#!/usr/bin/env node
/**
 * lib/linkedin-guest.test.mjs — Unit tests for the LinkedIn guest client.
 *
 * No test framework. Run with:
 *   node lib/linkedin-guest.test.mjs
 *
 * Exits non-zero if any assertion fails. NEVER makes real HTTP requests —
 * every test uses canned fixtures or the module's mockResponse path.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import {
  fetchLinkedInGuestJobs,
  parseJobCardsHTML,
  buildSearchUrl,
  LinkedInGuestError,
  __test,
} from './linkedin-guest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SAMPLE_PATH = join(__dirname, 'fixtures', 'linkedin-guest-sample.html');
const MALFORMED_PATH = join(__dirname, 'fixtures', 'linkedin-guest-malformed.html');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passed++;
      console.log(`  ok  ${name}`);
    })
    .catch(err => {
      failed++;
      console.log(`  FAIL  ${name}`);
      console.log(`        ${err.stack || err.message}`);
    });
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function assert(cond, label) {
  if (!cond) throw new Error(label);
}

async function main() {
  console.log('linkedin-guest tests');

  const sampleHtml = readFileSync(SAMPLE_PATH, 'utf-8');
  const malformedHtml = readFileSync(MALFORMED_PATH, 'utf-8');

  // ── parseJobCardsHTML ────────────────────────────────────────────
  await test('parses three well-formed job cards from the sample fixture', () => {
    const jobs = parseJobCardsHTML(sampleHtml);
    assertEqual(jobs.length, 3, 'job count');

    assertEqual(jobs[0].title, 'Head of Engineering', 'job[0].title');
    assertEqual(jobs[0].company, 'Acme Corp', 'job[0].company');
    assertEqual(jobs[0].location, 'Sydney, New South Wales, Australia', 'job[0].location');
    assertEqual(jobs[0].jobId, '3829104721', 'job[0].jobId');
    assertEqual(jobs[0].postedAt, '2026-04-12', 'job[0].postedAt');
    // Tracking query string should be stripped
    assert(!jobs[0].url.includes('?refId'), 'refId stripped from url');
    assert(jobs[0].url.startsWith('https://www.linkedin.com/jobs/view/'), 'canonical url');
  });

  await test('decodes HTML entities in titles', () => {
    const jobs = parseJobCardsHTML(sampleHtml);
    // Third job's title has &amp; in the fixture
    assertEqual(jobs[2].title, 'Staff ML Engineer & Platform Lead', 'entity decode');
  });

  await test('handles jobs with no postedAt (missing <time> tag)', () => {
    const jobs = parseJobCardsHTML(sampleHtml);
    assertEqual(jobs[2].postedAt, null, 'job[2].postedAt is null');
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
    // All three have URN + either URL or title, so all three should parse,
    // but the missing-title card should fall back to sr-only span,
    // and the missing-URL card should synthesise a canonical URL from jobId.
    assertEqual(jobs.length, 3, 'all three cards recovered');
    assertEqual(jobs[0].title, 'Complete Role', 'first card intact');
    // Card 2: title is empty (sr-only empty, no h3) — company still present
    assertEqual(jobs[1].company, 'Missing Title Corp', 'missing-title company still present');
    // Card 3: no href, URL synthesised from jobId
    assertEqual(
      jobs[2].url,
      'https://www.linkedin.com/jobs/view/9000000003',
      'url synthesised from jobId',
    );
  });

  // ── buildSearchUrl ──────────────────────────────────────────────
  await test('buildSearchUrl encodes params correctly', () => {
    const url = buildSearchUrl(
      {
        keywords: 'Head of IT',
        geoId: '103644278',
        locationText: 'Sydney, Australia',
        timeRange: 'r604800',
      },
      50,
    );
    assert(url.startsWith('https://www.linkedin.com/jobs-guest/'), 'base url');
    assert(url.includes('keywords=Head+of+IT'), 'keywords encoded');
    assert(url.includes('geoId=103644278'), 'geoId');
    assert(url.includes('f_TPR=r604800'), 'f_TPR');
    assert(url.includes('start=50'), 'start');
    assert(url.includes('location=Sydney%2C+Australia'), 'location encoded');
  });

  // ── fetchLinkedInGuestJobs (mock mode) ──────────────────────────
  await test('fetchLinkedInGuestJobs uses mockResponse string and returns jobs', async () => {
    const jobs = await fetchLinkedInGuestJobs(
      { keywords: 'AI Engineer', maxPages: 1 },
      { mockResponse: sampleHtml },
    );
    assertEqual(jobs.length, 3, 'jobs from mock');
    assertEqual(jobs[0].source, 'linkedin-guest', 'source tag');
  });

  await test('fetchLinkedInGuestJobs with empty mock response returns []', async () => {
    const jobs = await fetchLinkedInGuestJobs(
      { keywords: 'AI Engineer', maxPages: 1 },
      { mockResponse: '<html></html>' },
    );
    assertEqual(jobs.length, 0, 'no jobs');
  });

  await test('fetchLinkedInGuestJobs handles multi-page array mock', async () => {
    // Two pages: the second returns a subset that overlaps to test dedup.
    // Page 1 has 3 jobs (full sample), page 2 has 0 → stops after page 1.
    const jobs = await fetchLinkedInGuestJobs(
      { keywords: 'x', maxPages: 2 },
      { mockResponse: [sampleHtml, ''] },
    );
    assertEqual(jobs.length, 3, 'multi-page dedup/stop');
  });

  await test('fetchLinkedInGuestJobs throws structured error on rate limit (function mock)', async () => {
    let thrown = null;
    try {
      await fetchLinkedInGuestJobs(
        { keywords: 'x', maxPages: 1 },
        {
          mockResponse: async () => {
            throw new LinkedInGuestError('mock 429', {
              status: 429,
              code: 'rate-limit',
            });
          },
        },
      );
    } catch (err) {
      thrown = err;
    }
    assert(thrown instanceof LinkedInGuestError, 'is LinkedInGuestError');
    assertEqual(thrown.code, 'rate-limit', 'code');
    assertEqual(thrown.status, 429, 'status');
  });

  await test('fetchLinkedInGuestJobs rejects on missing keywords', async () => {
    let thrown = null;
    try {
      await fetchLinkedInGuestJobs({}, { mockResponse: '' });
    } catch (err) {
      thrown = err;
    }
    assert(thrown instanceof LinkedInGuestError, 'bad-input error raised');
    assertEqual(thrown.code, 'bad-input', 'bad-input code');
  });

  await test('fetchLinkedInGuestJobs never calls real fetch in mock mode', async () => {
    // Install a sabotaged fetchImpl to guarantee that mock mode does not
    // fall through to the network. If it ever gets called, the test fails.
    const sabotage = () => {
      throw new Error('network was touched — mock mode leaked');
    };
    const jobs = await fetchLinkedInGuestJobs(
      { keywords: 'x', maxPages: 1 },
      { mockResponse: sampleHtml, fetchImpl: sabotage },
    );
    assertEqual(jobs.length, 3, 'three jobs via mock');
  });

  // ── Summary ─────────────────────────────────────────────────────
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('fatal in test runner:', err);
  process.exit(2);
});
