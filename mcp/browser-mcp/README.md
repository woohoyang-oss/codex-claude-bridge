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
- `browser_eval`
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

## Smoke test

After Chrome is available on port `9222`:

```bash
cd /Users/wooho/Documents/Playground/mcp/browser-mcp
npm run build
npm run smoke
```

## Notes

- The server keeps a small in-memory active-page session.
- Console messages are buffered per page and exposed through the console tool.
- Screenshots are saved under the system temp directory unless an absolute output path is provided.
