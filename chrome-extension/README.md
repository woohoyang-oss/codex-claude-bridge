# Chrome Extension

This extension is the first UX layer on top of the CDP-first browser MCP stack.

## What it does now

- opens a side panel in Chrome
- shows the current active tab
- captures current-page context from the browser DOM
- copies captured page JSON for handoff to Codex
- starts an element picker overlay and stores the last picked selector
- can push the last captured page payload to a local bridge URL

## What it does not replace

`browser-mcp` remains the real browser control plane.

This extension does not replace:

- CDP navigation
- screenshots
- console and network logs
- browser assertions
- structured test flow execution

## Load in Chrome

1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select `/Users/wooho/Documents/Playground/chrome-extension`

## Expected workflow

1. Use the side panel to capture the current page or pick an element
2. Use `browser-mcp` for control, debugging, and automated verification
3. Later, connect the extension's local bridge URL to a dedicated local handoff service if tighter integration is needed
