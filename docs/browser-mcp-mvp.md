# Browser MCP MVP

This is the first implementation target for the Codex-Claude bridge.

## Goal

Give Codex a reliable local browser toolset that can:

- control Chrome directly
- debug live pages
- run test-like verification flows

## Non-goals

- Gmail integration
- Calendar integration
- full Chrome extension UX
- cloud-hosted browser infrastructure

## Recommended stack

- Node.js
- TypeScript
- `@modelcontextprotocol/sdk`
- Playwright with Chromium or direct CDP client

Preferred implementation:

- use Playwright for high-level page control
- use CDP session access for console, network, and low-level diagnostics when needed

## Directory target

```text
mcp/
  browser-mcp/
    package.json
    tsconfig.json
    src/
      index.ts
      server.ts
      chrome.ts
      session-store.ts
      tools/
        list-tabs.ts
        navigate.ts
        click.ts
        type.ts
        wait-for.ts
        screenshot.ts
        console-logs.ts
        network-logs.ts
        dom-summary.ts
        eval.ts
        assert-text.ts
        assert-visible.ts
```

## MVP tool contract

### Session and page control

- `browser_list_tabs`
  - list open pages with title and URL
- `browser_select_tab`
  - switch active page by tab id
- `browser_navigate`
  - open a URL and wait for stable load
- `browser_wait_for`
  - wait for selector, URL fragment, text, or timeout gate

### Interaction

- `browser_click`
  - click element by selector
- `browser_type`
  - type into input or textarea
- `browser_press`
  - send keyboard key
- `browser_scroll`
  - scroll page or element

### Inspection

- `browser_screenshot`
  - capture viewport or full page
- `browser_get_console_logs`
  - return recent browser console entries
- `browser_get_network_logs`
  - return recent network activity and failures
- `browser_get_dom_summary`
  - summarize meaningful page structure, headings, forms, buttons, and visible actions
- `browser_eval`
  - run limited JS in page context for diagnostics

### Assertions

- `browser_assert_text`
  - verify text exists on page
- `browser_assert_visible`
  - verify element is visible

## Safety rules

- default to local browser only
- no hidden background browsing outside the active task
- restrict `browser_eval` to diagnostic use
- keep screenshots local
- never submit destructive actions without explicit instruction

## MVP acceptance criteria

- Codex can open a browser page and inspect its visible state
- Codex can reproduce a simple UI flow
- Codex can collect console and network failures
- Codex can assert expected UI text or visibility
- Codex can produce a screenshot artifact for failure review

## Build order

1. project scaffold
2. Chrome launcher and connection manager
3. tab selection and navigation
4. click/type/wait
5. screenshot and DOM summary
6. console and network capture
7. assertions
8. end-to-end smoke scenario

## First commit scope

The first implementation commit should include only:

- `mcp/browser-mcp` scaffold
- Chrome launch/connect logic
- `browser_list_tabs`
- `browser_navigate`
- `browser_screenshot`
- `browser_get_console_logs`
- local README for running the server

That is enough to prove the architecture before adding deeper interaction tools.

