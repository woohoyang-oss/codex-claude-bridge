# Chrome Extension

This extension is the first UX layer on top of the CDP-first browser MCP stack.

## What it does now

- opens a side panel in Chrome
- shows the current active tab
- captures current-page context from the browser DOM
- copies captured page JSON for handoff to Codex
- starts an element picker overlay and stores the last picked selector
- can push the last captured page payload to a local bridge URL
- can push the last picked element payload to a local bridge URL
- can create a Codex handoff payload containing the active tab, capture, picked element, and an operator note
- can create a picked-element action request for click, type, or assert-visible
- can inspect the local inbox queue so recent handoff and action requests are visible in the side panel
- can claim or complete recent inbox items directly from the side panel

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

## Before you use it

Start the local services from the workspace root:

```bash
/Users/wooho/Documents/Playground/launch-chrome-debug.sh
/Users/wooho/Documents/Playground/run-extension-bridge.sh
/Users/wooho/Documents/Playground/run-codex-inbox-relay.sh
/Users/wooho/Documents/Playground/run-browser-inbox-worker.sh
```

Optional local demo page:

```bash
/Users/wooho/Documents/Playground/run-browser-lab.sh
```

The browser worker is optional if you want to inspect queue items manually before running them.

## How to use it after install

### 1. Open the side panel

- click the extension icon in Chrome
- the side panel opens because the extension enables `openPanelOnActionClick`

### 2. Capture the current page

- open any page you want to inspect
- click `Capture Page Context`
- the side panel stores the current page summary locally
- click `Copy JSON` if you want the raw captured payload

### 3. Pick an element from the page

- click `Start Element Picker`
- move over the page and choose a target element
- the picked selector is saved in the side panel
- click `Stop Picker` when you are done

### 4. Push raw browser context to the bridge

- click `Push Last Capture` to store the latest page capture in the bridge
- click `Push Picked Element` to store the latest selected element in the bridge

This is useful when you want `browser-mcp` to read the raw browser-native payloads directly.

### 5. Create a Codex handoff

- enter a note in `Codex handoff note`
- click `Create Codex Handoff`

This creates a queue item that includes:

- active tab metadata
- captured page context
- picked element, if available
- your operator note

### 6. Create an action request

- choose `Assert Visible`, `Click`, or `Type`
- if you choose `Type`, enter text in `Action text`
- optionally add an operator note
- click `Create Action Request`

This creates a queue item that tells the browser worker or `browser-mcp` what to do with the picked element.

### 7. Watch queue state

The side panel inbox section shows recent items and their status:

- `pending`
- `claimed`
- `completed`
- `failed`

You can also click:

- `Claim`
- `Complete`

directly from the side panel for basic queue control.

### 8. Let the worker process requests

If `run-browser-inbox-worker.sh` is running, it will automatically try to consume pending:

- action requests
- handoffs

If a request fails, it can move to `failed` and be retried later through the queue tools.

## Expected workflow

1. Use the side panel to capture the current page or pick an element
2. Use `browser-mcp` for control, debugging, and automated verification
3. Later, connect the extension's local bridge URL to a dedicated local handoff service if tighter integration is needed

## Local bridge

This repository now includes a local bridge service:

```bash
/Users/wooho/Documents/Playground/run-extension-bridge.sh
```

Use it together with `browser-mcp` so Codex can read:

- latest extension page capture
- latest picked element
- latest Codex handoff payload
- latest picked-element action request
- inbox queue items
