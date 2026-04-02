#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="/Users/wooho/Documents/Playground"
export CODEX_CLAUDE_BRIDGE_DIR="${CODEX_CLAUDE_BRIDGE_DIR:-$ROOT_DIR/.runtime/codex-claude-bridge}"

cd "$ROOT_DIR/bridge/codex-inbox-relay"
node server.mjs
