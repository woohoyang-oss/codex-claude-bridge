# Codex Claude Bridge Architecture

This repository exists to make Codex behave more like a Claude-style coding environment, with special emphasis on direct browser control, debugging, and testing.

## Primary objective

Provide a local agent stack where Codex can:

- run in a Claude-style workflow
- launch and use Claudex as the coding runtime
- control Chrome directly
- inspect browser state for debugging
- execute repeatable browser tests

## System layout

```text
User
  -> Codex desktop / Codex runtime
    -> workspace bootstrap
      -> Claudex runtime
      -> MCP config
      -> browser-mcp
        -> Chrome DevTools Protocol
        -> local Chrome instance
```

## Layers

### 1. Workspace bootstrap

Purpose:

- establish Claude-style operating rules
- provision Claudex locally
- define local scripts and MCP entry points

Current files:

- `AGENTS.md`
- `CLAUDEX_MODE.md`
- `setup-claudex.sh`
- `run-claudex.sh`

### 2. Claudex runtime

Purpose:

- provide the closest available local base to a Claude Code style tool environment while remaining Codex-backed
- keep the main coding workflow aligned with Claude-like agent usage

Responsibilities:

- coding session runtime
- tool invocation behavior
- workspace editing flow

### 3. Browser MCP

Purpose:

- expose browser control and browser debugging as structured tools
- allow Codex to operate on a real Chrome session instead of static screenshots or blind HTML

Responsibilities:

- connect to Chrome over CDP
- manage tabs/pages/session lifecycle
- expose control and inspection tools
- support verification and test-style flows

### 4. Chrome runtime

Purpose:

- be the real browser that the agent controls

Initial approach:

- launch Chrome with `--remote-debugging-port`
- connect through CDP

Deferred approach:

- optional Chrome extension
- optional side panel UX
- optional native messaging bridge

### 5. Chrome extension UX layer

Purpose:

- expose browser-native handoff and selection UX
- capture page context from the current tab
- assist with element targeting before MCP-driven automation

Current scope:

- side panel
- page capture
- element picker overlay
- optional push to a local bridge URL

## Why CDP first

CDP-first is the fastest path to value:

- no extension review cycle
- no manifest complexity
- easier local debugging
- enough power for navigation, console logs, network logs, DOM inspection, screenshots, and user interaction

That covers the most important Claude-like browser capabilities first.

## Product boundaries

### In scope now

- Codex behaving like a Claude-style coding agent
- Claudex-based local runtime
- Chrome control for debugging and testing
- MCP tool surface for browser operations

### Not in scope now

- Gmail
- Google Calendar
- polished Chrome extension UX
- cloud sync
- multi-user browser orchestration

## Milestone sequence

### Milestone 1

Bootstrap the browser MCP project and wire it into this workspace.

### Milestone 2

Implement core browser control and inspection tools.

### Milestone 3

Implement browser verification and reusable test flows.

### Milestone 4

Add optional extension-based UX only if CDP-only flow proves insufficient.

## Chrome extension stance

The Chrome extension is a later UX layer, not the core control plane.

- core browser control stays in `browser-mcp`
- the extension is meant for side panel UX, element picking, page-to-agent handoff, and approval affordances
- the extension should enhance the CDP workflow, not replace it
