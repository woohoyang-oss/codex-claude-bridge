#!/bin/zsh
set -euo pipefail

CHROME_PATH="${BROWSER_MCP_CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PROFILE_DIR="${BROWSER_MCP_CHROME_PROFILE:-/tmp/browser-mcp-chrome}"

exec "$CHROME_PATH" \
  --remote-debugging-port=9222 \
  --user-data-dir="$PROFILE_DIR"
