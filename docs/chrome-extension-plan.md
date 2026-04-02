# Chrome Extension Plan

This document defines the role of a future Chrome extension in the Codex-Claude bridge project.

## Current position

The project currently uses a CDP-first architecture:

- `browser-mcp` connects to Chrome through the DevTools Protocol
- Codex uses MCP tools to control and inspect the browser
- browser debugging and test flows already work without an extension

This is the correct first implementation because it is faster, easier to debug, and already covers the highest-value workflows.

## Why add an extension later

A Chrome extension becomes useful when we want a more Claude-like browser experience:

- a visible side panel inside Chrome
- clearer page-to-agent handoff
- current-tab actions triggered from the browser UI
- page overlays for selections or action targets
- stronger UX around user approvals and safe actions

## Recommended role of the extension

The extension should not replace `browser-mcp`. It should complement it.

### Keep in MCP

- navigation
- screenshots
- DOM inspection
- console logs
- network logs
- test flow execution
- assertions

### Move to extension-assisted UX

- side panel controls
- "send page to Codex" actions
- element picking overlays
- page annotations and action previews
- optional current-tab metadata bridge

## Recommended architecture

```text
Chrome Extension UI
  -> content script
  -> background service worker
    -> local bridge
      -> browser-mcp
        -> Chrome CDP
```

## Phased plan

### Phase 1

Keep the extension out of the critical path. Browser MCP remains the source of truth for browser control.

### Phase 2

Add a thin extension for:

- side panel
- current-tab send action
- element picker overlay

### Phase 3

Add optional native messaging or local websocket bridge if the extension needs tighter interaction with the local agent runtime.

## Success criteria

The extension is worth building only if it improves one of these:

- faster browser-to-agent workflow
- better element targeting
- clearer debugging UX
- safer approval flows for browser actions

If it does not improve those, CDP-first remains enough.
