# Claudex Mode

This workspace is prepared to bootstrap a local Claudex runtime and communicate a Claude-style working mode to Codex.

## Local runtime

- Bootstrap repo: `/Users/wooho/Documents/Playground`
- Claudex checkout path: `/Users/wooho/Documents/Playground/claudex`
- Build output: `/Users/wooho/Documents/Playground/claudex/dist/cli.mjs`
- Codex auth file: `~/.codex/auth.json`
- Recommended model: `codexplan`

## Launch

```bash
./setup-claudex.sh
./run-claudex.sh
```

## Working style

- Inspect first, then edit.
- Prefer execution over long proposals.
- Continue through implementation and verification when possible.
- Treat review requests as bug hunts first.
- Ask only when uncertainty is meaningful.

## Current local status

- Local Claudex checkout exists
- Dependencies installed
- Build succeeded
- Smoke check passed
- `codex` CLI detected
- `~/.codex/auth.json` present
