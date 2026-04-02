# Codex Desktop Claude-Style Mode

This document explains the minimum setup that makes Codex Desktop feel closer to Claude in day-to-day coding work.

## The four pieces

### 1. Workspace rules

Use `AGENTS.md` to define:

- how the agent should inspect code
- when it should implement instead of explain
- how it should report progress
- how it should treat reviews and verification

### 2. Reusable skills

Use focused `skills/` files for repeated workflows such as:

- browser debugging
- SEO checks
- UI audits
- release checks

### 3. Connected tools

Use `.mcp.json` and helper scripts to make external capabilities available:

- live browser control
- local bridges
- inbox relays
- service workers

### 4. Simple entrypoints

Reduce startup friction with one-command scripts for the workflows you use every day.

## Minimal starter files

The fastest working baseline is:

```text
AGENTS.md
.mcp.json.example
CLAUDE_LIKE_WORKFLOW.md
skills/
```

This repository ships that set under:

`/Users/wooho/Documents/Playground/templates/codex-desktop-claude-starter`

Use:

```bash
/Users/wooho/Documents/Playground/setup-codex-claude-workspace.sh /path/to/project
```

## When this starts feeling like Claude

Codex starts feeling much closer to Claude when:

- the workspace already tells it how to operate
- the common jobs are captured as skills
- browser state is available through tools instead of guesswork
- execution is easier than explanation
