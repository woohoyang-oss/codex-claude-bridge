# Codex Claude Bridge

Make Codex feel closer to a Claude-style browser-connected coding workflow.

This repository is no longer just a bootstrap. It now includes a working browser stack:

- `Claudex` bootstrap for Codex-style local runtime
- `browser-mcp` for live Chrome CDP control
- a Chrome extension side panel for page capture and element picking
- a local bridge queue for handoff and action-request packets
- a Codex inbox relay that exports those packets into file-based work items

## What already works

Current implemented flow:

1. Capture the current page in the Chrome extension
2. Pick a live DOM element from the page
3. Create a `handoff` or `action request` in the extension side panel
4. Store that request in the local bridge inbox queue
5. Consume it from `browser-mcp`
6. Run browser actions such as click, type, assert-visible, navigate, screenshot, and DOM inspection
7. Export queue items into file-based Codex inbox packets
8. Archive completed packets automatically

In practice, this means the repo already supports:

- Chrome CDP browser control
- browser debugging with console logs and network logs
- structured browser test flows
- extension-driven page capture
- extension-driven picked-element workflows
- queue-based handoff and action-request processing
- file-based Codex inbox packet generation

## Architecture

Main runtime path:

```text
Chrome Extension
  -> extension-bridge
  -> inbox.json
  -> browser-mcp
  -> Codex / Claudex
```

File export path:

```text
Chrome Extension
  -> extension-bridge inbox
  -> codex-inbox-relay
  -> codex-inbox/open
  -> codex-inbox/done
```

Core directories:

- `chrome-extension/`
  Unpacked Chrome extension with side panel, capture UI, picker UI, and inbox controls
- `bridge/extension-bridge/`
  Local HTTP bridge for capture payloads, picked elements, handoffs, and action requests
- `bridge/codex-inbox-relay/`
  Relay that exports bridge inbox items into file-based Codex packets
- `mcp/browser-mcp/`
  Chrome/CDP MCP server used by Codex
- `demo/browser-lab/`
  Deterministic local test page for click/type/action-request smoke tests
- `docs/`
  Architecture and planning docs

## Chrome Extension

The Chrome extension is the browser-native UX layer.

Current extension features:

- side panel UI
- active-tab display
- page-context capture
- element picker overlay
- push latest capture to local bridge
- push picked element to local bridge
- create Codex handoff payloads
- create picked-element action requests
- inspect recent inbox items
- claim or complete inbox items directly from the side panel

Load it in Chrome:

1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select `/Users/wooho/Documents/Playground/chrome-extension`

Extension docs:

- `chrome-extension/README.md`

## Browser MCP

`browser-mcp` is the real browser control plane.

Current tool surface includes:

- `browser_list_tabs`
- `browser_select_tab`
- `browser_navigate`
- `browser_wait_for`
- `browser_click`
- `browser_type`
- `browser_press`
- `browser_scroll`
- `browser_screenshot`
- `browser_get_console_logs`
- `browser_get_network_logs`
- `browser_get_dom_summary`
- `browser_get_extension_capture`
- `browser_get_picked_element`
- `browser_get_latest_handoff`
- `browser_get_latest_action_request`
- `browser_list_inbox_items`
- `browser_get_next_inbox_item`
- `browser_claim_inbox_item`
- `browser_complete_inbox_item`
- `browser_run_next_action_request`
- `browser_run_next_handoff`
- `browser_eval`
- `browser_assert_picked_element_visible`
- `browser_click_picked_element`
- `browser_type_picked_element`
- `browser_run_latest_action_request`
- `browser_assert_text`
- `browser_assert_visible`
- `browser_run_test_flow`

Browser MCP docs:

- `mcp/browser-mcp/README.md`

## Local Bridge And Relay

The extension bridge stores browser-native events under:

```text
/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge
```

Important bridge outputs:

- `latest-capture.json`
- `latest-picked-element.json`
- `latest-handoff.json`
- `latest-action-request.json`
- `inbox.json`

The Codex inbox relay exports packets under:

```text
/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge/codex-inbox/open
```

Completed packets are archived under:

```text
/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge/codex-inbox/done
```

Bridge docs:

- `bridge/extension-bridge/README.md`
- `bridge/codex-inbox-relay/README.md`

## Quick Start

Bootstrap Claudex:

```bash
./setup-claudex.sh
./run-claudex.sh
```

Run the browser stack:

```bash
./launch-chrome-debug.sh
./run-extension-bridge.sh
./run-codex-inbox-relay.sh
./run-browser-lab.sh
```

Run browser MCP:

```bash
cd /Users/wooho/Documents/Playground/mcp/browser-mcp
npm install
npm run build
npm run dev
```

## Verification

Implemented smoke flows:

- `npm run smoke`
  General CDP/browser MCP smoke
- `npm run smoke:action-demo`
  Picked-element action request demo against the local browser lab
- `npm run smoke:inbox`
  Inbox queue flow including claim, complete, action execution, and handoff execution
- `node /Users/wooho/Documents/Playground/scripts/smoke-codex-inbox-relay.mjs`
  Codex inbox packet export and archive flow

## Workspace Files

Bootstrap and operating files:

- `AGENTS.md`
- `CLAUDEX_MODE.md`
- `setup-claudex.sh`
- `run-claudex.sh`
- `.mcp.json`
- `.mcp.json.example`

Planning and architecture:

- `docs/architecture.md`
- `docs/browser-mcp-mvp.md`
- `docs/chrome-extension-plan.md`

## Current Goal

The main goal is still the same:

- make Codex feel closer to Claude's browser-connected workflow
- keep Chrome/CDP as the primary control layer
- use the Chrome extension as the native UX layer
- move toward a workflow where browser-side intent becomes Codex work automatically

## Notes

- The local `claudex/` directory is ignored on purpose so the repo stays lightweight.
- Codex authentication is expected through `~/.codex/auth.json`.
- Default model is `codexplan`.
