#!/bin/zsh
set -euo pipefail

cd /Users/wooho/Documents/Playground/claudex
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_MODEL="${OPENAI_MODEL:-codexplan}"

exec node dist/cli.mjs "$@"
