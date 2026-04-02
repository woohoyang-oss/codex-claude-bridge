#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_DIR="$ROOT_DIR/templates/codex-desktop-claude-starter"
TARGET_DIR="${1:-$(pwd)}"

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "Template directory not found: $TEMPLATE_DIR" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

copy_if_missing() {
  local src="$1"
  local dst="$2"

  if [ -e "$dst" ]; then
    echo "skip: $dst already exists"
    return
  fi

  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  echo "created: $dst"
}

copy_if_missing "$TEMPLATE_DIR/AGENTS.md" "$TARGET_DIR/AGENTS.md"
copy_if_missing "$TEMPLATE_DIR/.mcp.json.example" "$TARGET_DIR/.mcp.json.example"
copy_if_missing "$TEMPLATE_DIR/CLAUDE_LIKE_WORKFLOW.md" "$TARGET_DIR/CLAUDE_LIKE_WORKFLOW.md"

if [ ! -d "$TARGET_DIR/skills" ]; then
  mkdir -p "$TARGET_DIR/skills"
  cp -R "$TEMPLATE_DIR/skills/." "$TARGET_DIR/skills/"
  echo "created: $TARGET_DIR/skills"
else
  echo "skip: $TARGET_DIR/skills already exists"
fi

echo
echo "Starter files copied into: $TARGET_DIR"
echo "Next steps:"
echo "1. Review AGENTS.md and CLAUDE_LIKE_WORKFLOW.md"
echo "2. Register any MCP servers you need in .mcp.json"
echo "3. Copy the skills you want into \$CODEX_HOME/skills or keep them in-repo as references"
