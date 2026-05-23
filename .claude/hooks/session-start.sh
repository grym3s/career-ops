#!/bin/bash
# Launches headless Chromium with CDP on :9222 and exports BU_CDP_URL
# so `browser-harness` attaches automatically. Web-only, idempotent, fail-soft.
set -u

LOG=/tmp/bh-chrome.log
PORT=9222
CDP_URL="http://127.0.0.1:${PORT}"
PROFILE=/tmp/bh-chrome-profile

log() { printf '[bh-hook] %s\n' "$*" >&2; }

# Skip on local machines — user has their own Chrome.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  log "not a remote session, skipping"
  exit 0
fi

# Always export BU_CDP_URL — harmless even if Chromium fails to launch.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export BU_CDP_URL=${CDP_URL}" >> "$CLAUDE_ENV_FILE"
fi

# Idempotent: if CDP already responds, we're done.
if curl -fsS --max-time 2 "${CDP_URL}/json/version" >/dev/null 2>&1; then
  log "CDP already up at ${CDP_URL}"
  exit 0
fi

# Locate Chromium binary — literal path first, then search /opt/pw-browsers.
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
if [ ! -x "$CHROME" ]; then
  CHROME=$(find /opt/pw-browsers -maxdepth 4 -type f -name chrome 2>/dev/null | head -1)
fi
if [ -z "${CHROME:-}" ] || [ ! -x "$CHROME" ]; then
  log "no chromium binary found under /opt/pw-browsers; skipping launch"
  exit 0
fi

mkdir -p "$PROFILE" 2>/dev/null || true

log "launching $CHROME"
nohup "$CHROME" \
  --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$PROFILE" \
  about:blank \
  >"$LOG" 2>&1 &
disown 2>/dev/null || true

# Wait up to ~20s for CDP to come up.
for _ in $(seq 1 40); do
  if curl -fsS --max-time 1 "${CDP_URL}/json/version" >/dev/null 2>&1; then
    log "CDP ready at ${CDP_URL}"
    exit 0
  fi
  sleep 0.5
done

log "CDP did not come up within 20s — see $LOG; continuing anyway"
exit 0
