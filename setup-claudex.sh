#!/bin/zsh
set -euo pipefail

ROOT="/Users/wooho/Documents/Playground"
TARGET="$ROOT/claudex"
REPO_URL="https://github.com/woohoyang-oss/claudex.git"

if [ -d "$TARGET/.git" ]; then
  echo "Updating existing Claudex checkout..."
  git -C "$TARGET" pull --ff-only
else
  echo "Cloning Claudex..."
  git clone --depth=1 "$REPO_URL" "$TARGET"
fi

cd "$TARGET"
bun install
bun run build

echo
echo "Claudex is ready at $TARGET"
echo "Run: $ROOT/run-claudex.sh"
