# Codex to Claudex Bootstrap

This repository is a small bootstrap layer that makes a Codex workspace feel closer to a Claude Code workflow.

## Goal

When this repository is opened in Codex, it should quickly establish the intended working mode:

- Claude-style agentic coding workflow
- local Claudex runtime available on demand
- short, execution-focused operating rules
- reproducible setup scripts instead of manual copy-paste

## What this repo provides

- `AGENTS.md`
  Codex-facing operating rules so the workspace communicates the intended behavior clearly.
- `CLAUDEX_MODE.md`
  A compact runbook describing the local runtime and working style.
- `setup-claudex.sh`
  Clones or updates Claudex locally, installs dependencies, and builds it.
- `run-claudex.sh`
  Starts the local Claudex runtime with the recommended Codex-backed model.

## Quick start

```bash
./setup-claudex.sh
./run-claudex.sh
```

## Recommended behavior in Codex

Use this repository as a persistent hint that Codex should behave like a Claude-style coding agent:

- inspect first, edit second
- prefer doing the work over describing the work
- continue through implementation and verification when possible
- treat review requests as bug and regression hunts first
- ask only when a decision is risky or materially ambiguous

## Notes

- The local `claudex/` directory is ignored on purpose so this repo stays lightweight.
- Codex authentication is expected through `~/.codex/auth.json`.
- Default model is `codexplan`.

