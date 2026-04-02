#!/bin/zsh
set -euo pipefail

cd /Users/wooho/Documents/Playground/bridge/extension-bridge
export CODEX_CLAUDE_BRIDGE_DIR="${CODEX_CLAUDE_BRIDGE_DIR:-/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge}"
exec node server.mjs
