#!/usr/bin/env node
/**
 * tests/linkedin-guest/parser.test.mjs — Unit tests for the LinkedIn-guest provider.
 *
 * No test framework. Run with:
 *   node tests/linkedin-guest/parser.test.mjs
 *
 * Exits non-zero if any assertion fails. NEVER makes real HTTP requests —
 * the orchestrator tests inject a mock ctx with stubbed fetchText.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import linkedinGuest, {
  parseJobCardsHTML,
  buildSearchUrl,
  PAGE_SIZE,
} from '../../providers/linkedin-guest.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLE_PATH = join(__dirname, 'fixtures', 'sample.html');
const MALFORMED_PATH = join(__dirname, 'fixtures', 'malformed.html');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => { passed++; console.log(`  ok  ${name}`); })
    .catch(err => {
      failed++;
      console.log(`  FAIL  ${name}`);
      console.log(`        ${err.stack || err.message}`);
    });
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assert(cond, label) { if (!cond) throw new Error(label); }

// Mock ctx that hands back pre-canned HTML pages, never touches the network.
function mockCtx(pages) {
  const queue = Array.isArray(pages) ? [...pages] : [pages];
  return {
    transport: 'http',
    fetchText: async () => {
      if (queue.length === 0) return '';
      return queue.length === 1 ? queue[0] : queue.shift();
    },
    fetchJson: async () => { throw new Error('linkedin-guest provider should not call fetchJson'); },
  };
}

async function main() {
  console.log('linkedin-guest provider tests');

  const sampleHtml = readFileSync(SAMPLE_PATH, 'utf-8');
  const malformedHtml = readFileSync(MALFORMED_PATH, 'utf-8');

  // ── parseJobCardsHTML ────────────────────────────────────────────
  await test('parses three well-formed job cards from the sample fixture', () => {
    const jobs = parseJobCardsHTML(sampleHtml);
    assertEqual(jobs.length, 3, 'job count');
    assertEqual(jobs[0].title, 'Head of Engineering', 'job[0].title');
    assertEqual(jobs[0].company, 'Acme Corp', 'job[0].company');
    assertEqual(jobs[0].location, 'Sydney, New South Wales, Australia', 'job[0].location');
    assert(!jobs[0].url.includes('?refId'), 'refId stripped from url');
    assert(jobs[0].url.startsWith('https://www.linkedin.com/jobs/view/'), 'canonical url');
  });

  await test('decodes HTML entities in titles', () => {
    const jobs = parseJobCardsHTML(sampleHtml);
    assertEqual(jobs[2].title, 'Staff ML Engineer & Platform Lead', 'entity decode');
  });

  await test('returns [] for empty string', () => {
    assertEqual(parseJobCardsHTML('').length, 0, 'empty');
    assertEqual(parseJobCardsHTML('<html><body></body></html>').length, 0, 'no URN');
  });

  await test('returns [] for non-string input', () => {
    assertEqual(parseJobCardsHTML(null).length, 0, 'null');
    assertEqual(parseJobCardsHTML(undefined).length, 0, 'undefined');
    assertEqual(parseJobCardsHTML(42).length, 0, 'number');
  });

  await test('defensive parse of malformed cards drops only unusable ones', () => {
    const jobs = parseJobCardsHTML(malformedHtml);
    assertEqual(jobs.length, 3, 'all three cards recovered');
    assertEqual(jobs[0].title, 'Complete Role', 'first card intact');
    assertEqual(jobs[1].company, 'Missing Title Corp', 'missing-title company still present');
    assertEqual(jobs[2].url, 'https://www.linkedin.com/jobs/view/9000000003', 'url synthesised from jobId');
  });

  // ── buildSearchUrl ──────────────────────────────────────────────
  await test('buildSearchUrl encodes params correctly', () => {
    const url = buildSearchUrl(
      { keywords: 'Head of IT', geo_id: '103644278', location_text: 'Sydney, Australia', time_range: 'r604800' },
      50,
    );
    assert(url.startsWith('https://www.linkedin.com/jobs-guest/'), 'base url');
    assert(url.includes('keywords=Head+of+IT'), 'keywords encoded');
    assert(url.includes('geoId=103644278'), 'geoId');
    assert(url.includes('f_TPR=r604800'), 'f_TPR');
    assert(url.includes('start=50'), 'start');
    assert(url.includes('location=Sydney%2C+Australia'), 'location encoded');
  });

  // ── provider.fetch via mock ctx ─────────────────────────────────
  await test('provider.fetch returns parsed jobs from a single mocked page', async () => {
    const jobs = await linkedinGuest.fetch(
      { name: 'mock', keywords: 'AI Engineer', max_pages: 1 },
      mockCtx(sampleHtml),
    );
    assertEqual(jobs.length, 3, 'jobs from mock');
    assertEqual(jobs[0].title, 'Head of Engineering', 'first title');
  });

  await test('provider.fetch returns [] for empty mock response', async () => {
    const jobs = await linkedinGuest.fetch(
      { name: 'mock', keywords: 'AI Engineer', max_pages: 1 },
      mockCtx('<html></html>'),
    );
    assertEqual(jobs.length, 0, 'no jobs');
  });

  await test('provider.fetch stops paginating when a page is short (under PAGE_SIZE)', async () => {
    // Sample has 3 jobs (< PAGE_SIZE=25) so even with max_pages=5 only one fetch should happen.
    let fetchCount = 0;
    const ctx = {
      transport: 'http',
      fetchText: async () => { fetchCount++; return sampleHtml; },
      fetchJson: async () => { throw new Error('unexpected fetchJson'); },
    };
    const jobs = await linkedinGuest.fetch(
      { name: 'mock', keywords: 'x', max_pages: 5 },
      ctx,
    );
    assertEqual(jobs.length, 3, 'three jobs total');
    assertEqual(fetchCount, 1, 'paginated only once (short page)');
  });

  await test('provider.fetch translates 429/451/999 status into rate-limit error', async () => {
    const ratelimitCtx = {
      transport: 'http',
      fetchText: async () => {
        const err = new Error('HTTP 429');
        err.status = 429;
        throw err;
      },
      fetchJson: async () => { throw new Error('no'); },
    };
    let thrown = null;
    try {
      await linkedinGuest.fetch({ name: 'mock', keywords: 'x', max_pages: 1 }, ratelimitCtx);
    } catch (err) { thrown = err; }
    assert(thrown != null, 'expected throw');
    assert(/rate-limited/.test(thrown.message), `expected rate-limit message, got: ${thrown && thrown.message}`);
  });

  await test('provider.fetch rejects on missing keywords', async () => {
    let thrown = null;
    try {
      await linkedinGuest.fetch({ name: 'mock' }, mockCtx(''));
    } catch (err) { thrown = err; }
    assert(thrown != null, 'expected throw');
    assert(/keywords/i.test(thrown.message), 'mentions keywords');
  });

  await test('provider.fetch never calls fetchJson (text endpoint only)', async () => {
    let jsonCalled = false;
    const ctx = {
      transport: 'http',
      fetchText: async () => sampleHtml,
      fetchJson: async () => { jsonCalled = true; return {}; },
    };
    const jobs = await linkedinGuest.fetch({ name: 'mock', keywords: 'x', max_pages: 1 }, ctx);
    assertEqual(jobs.length, 3, 'three jobs');
    assertEqual(jsonCalled, false, 'fetchJson should not be called');
  });

  // PAGE_SIZE export sanity
  await test('PAGE_SIZE export matches LinkedIn convention (25)', () => {
    assertEqual(PAGE_SIZE, 25, 'PAGE_SIZE');
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('fatal in test runner:', err);
  process.exit(2);
});
