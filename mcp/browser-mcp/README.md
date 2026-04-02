# Browser MCP

Local Chrome/CDP MCP server for the Codex-Claude bridge workspace.

## Current scope

This first version includes:

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
- `browser_fail_inbox_item`
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

## Requirements

- Node.js 22+
- Google Chrome installed locally

## Install

```bash
cd /Users/wooho/Documents/Playground/mcp/browser-mcp
npm install
```

## Launch Chrome for CDP

From the workspace root:

```bash
./launch-chrome-debug.sh
```

By default the server connects to:

```text
http://127.0.0.1:9222
```

Override with:

```bash
export BROWSER_MCP_CDP_URL=http://127.0.0.1:9222
```

## Run the MCP server

```bash
cd /Users/wooho/Documents/Playground/mcp/browser-mcp
npm run dev
```

Or after building:

```bash
npm run build
npm start
```

Run the inbox worker:

```bash
cd /Users/wooho/Documents/Playground/mcp/browser-mcp
npm run worker -- --once
```

## Smoke test

After Chrome is available on port `9222`:

```bash
cd /Users/wooho/Documents/Playground/mcp/browser-mcp
npm run build
npm run smoke
```

Action demo:

```bash
/Users/wooho/Documents/Playground/run-extension-bridge.sh
/Users/wooho/Documents/Playground/run-browser-lab.sh
cd /Users/wooho/Documents/Playground/mcp/browser-mcp
npm run build
npm run smoke:action-demo
```

Inbox demo:

```bash
/Users/wooho/Documents/Playground/run-extension-bridge.sh
cd /Users/wooho/Documents/Playground/mcp/browser-mcp
npm run build
npm run smoke:inbox
```

Worker demo:

```bash
/Users/wooho/Documents/Playground/run-extension-bridge.sh
cd /Users/wooho/Documents/Playground/mcp/browser-mcp
npm run build
npm run smoke:worker
```

## Extension bridge

If you also want browser-native capture from the Chrome extension:

```bash
/Users/wooho/Documents/Playground/run-extension-bridge.sh
```

The bridge stores the latest extension payloads and queued inbox items in:

```text
/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge
```

## Notes

- The server keeps a small in-memory active-page session.
- Console messages are buffered per page and exposed through the console tool.
- Screenshots are saved under the system temp directory unless an absolute output path is provided.
