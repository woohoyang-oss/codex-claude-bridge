import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ChromeManager } from "./chrome.js";
import { SessionStore } from "./session-store.js";
import { click } from "./tools/click.js";
import { assertText } from "./tools/assert-text.js";
import { assertVisible } from "./tools/assert-visible.js";
import { getConsoleLogs } from "./tools/console-logs.js";
import { getDomSummary } from "./tools/dom-summary.js";
import { evalInPage } from "./tools/eval.js";
import {
  getExtensionCapture,
  getInboxItems,
  getLatestActionRequest,
  getLatestHandoff,
  getNextInboxItem,
  getPickedElement,
} from "./tools/extension-capture.js";
import { runNextHandoffFromInbox } from "./tools/handoff.js";
import { markInboxItem } from "./tools/inbox.js";
import { listTabs } from "./tools/list-tabs.js";
import { navigate } from "./tools/navigate.js";
import { getNetworkLogs } from "./tools/network-logs.js";
import {
  assertPickedElementVisible,
  clickPickedElement,
  runLatestActionRequest,
  runNextActionRequestFromInbox,
  typeIntoPickedElement,
} from "./tools/picked-actions.js";
import { press } from "./tools/press.js";
import { runTestFlow } from "./tools/run-test-flow.js";
import { selectTab } from "./tools/select-tab.js";
import { screenshot } from "./tools/screenshot.js";
import { scroll } from "./tools/scroll.js";
import { typeText } from "./tools/type.js";
import { waitFor } from "./tools/wait-for.js";

export async function startServer(): Promise<void> {
  const sessions = new SessionStore();
  const manager = new ChromeManager(sessions);

  const server = new McpServer({
    name: "browser-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "browser_list_tabs",
    {
      description: "List currently open Chrome tabs from the connected browser session.",
      inputSchema: {},
    },
    async () => listTabs(manager)
  );

  server.registerTool(
    "browser_navigate",
    {
      description: "Navigate the active browser tab to a URL and wait for the page to settle.",
      inputSchema: {
        url: z.string().url().describe("The destination URL."),
      },
    },
    async ({ url }) => navigate(manager, { url })
  );

  server.registerTool(
    "browser_select_tab",
    {
      description: "Set the active browser tab by numeric tab id from browser_list_tabs.",
      inputSchema: {
        tabId: z.number().int().nonnegative().describe("Zero-based tab index from browser_list_tabs."),
      },
    },
    async ({ tabId }) => selectTab(manager, { tabId })
  );

  server.registerTool(
    "browser_wait_for",
    {
      description: "Wait for a selector or visible text to appear on the active page.",
      inputSchema: {
        selector: z.string().optional().describe("CSS selector to wait for."),
        text: z.string().optional().describe("Visible text to wait for."),
        timeoutMs: z.number().int().positive().optional().describe("Timeout in milliseconds."),
      },
    },
    async ({ selector, text, timeoutMs }) => waitFor(manager, { selector, text, timeoutMs })
  );

  server.registerTool(
    "browser_click",
    {
      description: "Click the first matching element on the active page.",
      inputSchema: {
        selector: z.string().describe("CSS selector for the target element."),
      },
    },
    async ({ selector }) => click(manager, { selector })
  );

  server.registerTool(
    "browser_type",
    {
      description: "Type text into the first matching input on the active page.",
      inputSchema: {
        selector: z.string().describe("CSS selector for the target input."),
        text: z.string().describe("Text to type."),
        clearFirst: z.boolean().optional().describe("Clear the field before typing."),
      },
    },
    async ({ selector, text, clearFirst }) => typeText(manager, { selector, text, clearFirst })
  );

  server.registerTool(
    "browser_press",
    {
      description: "Send a keyboard key to the active page.",
      inputSchema: {
        key: z.string().describe("Keyboard key such as Enter, Tab, Escape, ArrowDown."),
      },
    },
    async ({ key }) => press(manager, { key })
  );

  server.registerTool(
    "browser_scroll",
    {
      description: "Scroll the active page by a relative x/y offset.",
      inputSchema: {
        x: z.number().optional().describe("Horizontal scroll delta."),
        y: z.number().optional().describe("Vertical scroll delta."),
      },
    },
    async ({ x, y }) => scroll(manager, { x, y })
  );

  server.registerTool(
    "browser_screenshot",
    {
      description: "Capture a screenshot of the active page.",
      inputSchema: {
        fullPage: z.boolean().optional().describe("Capture the full page instead of only the viewport."),
        outputPath: z.string().optional().describe("Absolute path for the screenshot output."),
      },
    },
    async ({ fullPage, outputPath }) => screenshot(manager, { fullPage, outputPath })
  );

  server.registerTool(
    "browser_get_console_logs",
    {
      description: "Return recent console entries for the active browser page.",
      inputSchema: {},
    },
    async () => getConsoleLogs(manager, sessions)
  );

  server.registerTool(
    "browser_get_network_logs",
    {
      description: "Return recent network activity and failures for the active browser page.",
      inputSchema: {},
    },
    async () => getNetworkLogs(manager, sessions)
  );

  server.registerTool(
    "browser_get_dom_summary",
    {
      description: "Return a compact summary of the current page structure and interactive elements.",
      inputSchema: {},
    },
    async () => getDomSummary(manager)
  );

  server.registerTool(
    "browser_get_extension_capture",
    {
      description: "Return the latest page capture pushed by the Chrome extension bridge.",
      inputSchema: {},
    },
    async () => getExtensionCapture()
  );

  server.registerTool(
    "browser_get_picked_element",
    {
      description: "Return the latest element selection pushed by the Chrome extension bridge.",
      inputSchema: {},
    },
    async () => getPickedElement()
  );

  server.registerTool(
    "browser_get_latest_handoff",
    {
      description: "Return the latest Codex handoff payload stored by the extension bridge.",
      inputSchema: {},
    },
    async () => getLatestHandoff()
  );

  server.registerTool(
    "browser_get_latest_action_request",
    {
      description: "Return the latest picked-element action request stored by the extension bridge.",
      inputSchema: {},
    },
    async () => getLatestActionRequest()
  );

  server.registerTool(
    "browser_list_inbox_items",
    {
      description: "List queued handoff and action-request items created by the Chrome extension bridge.",
      inputSchema: {
        status: z.string().optional().describe("Optional status filter such as pending, claimed, completed."),
        kind: z.string().optional().describe("Optional kind filter such as handoff or action_request."),
        limit: z.number().int().positive().optional().describe("Maximum number of items to return."),
      },
    },
    async ({ status, kind, limit }) => getInboxItems({ status, kind, limit })
  );

  server.registerTool(
    "browser_get_next_inbox_item",
    {
      description: "Return the next queued extension bridge inbox item, optionally filtered by status.",
      inputSchema: {
        status: z.string().optional().describe("Optional status filter such as pending, claimed, completed, failed."),
        kind: z.string().optional().describe("Optional kind filter such as handoff or action_request."),
      },
    },
    async ({ status, kind }) => getNextInboxItem({ status, kind })
  );

  server.registerTool(
    "browser_claim_inbox_item",
    {
      description: "Mark an extension bridge inbox item as claimed so another agent does not pick it up twice.",
      inputSchema: {
        itemId: z.string().describe("Inbox item id from browser_list_inbox_items or browser_get_next_inbox_item."),
      },
    },
    async ({ itemId }) => markInboxItem({ itemId, status: "claimed" })
  );

  server.registerTool(
    "browser_complete_inbox_item",
    {
      description: "Mark an extension bridge inbox item as completed after it has been handled.",
      inputSchema: {
        itemId: z.string().describe("Inbox item id from browser_list_inbox_items or browser_get_next_inbox_item."),
      },
    },
    async ({ itemId }) => markInboxItem({ itemId, status: "completed" })
  );

  server.registerTool(
    "browser_fail_inbox_item",
    {
      description: "Mark an extension bridge inbox item as failed after an execution error.",
      inputSchema: {
        itemId: z.string().describe("Inbox item id from browser_list_inbox_items or browser_get_next_inbox_item."),
      },
    },
    async ({ itemId }) => markInboxItem({ itemId, status: "failed" })
  );

  server.registerTool(
    "browser_eval",
    {
      description: "Run a small JavaScript expression in page context and return its result.",
      inputSchema: {
        expression: z.string().describe("JavaScript expression evaluated in the page context."),
      },
    },
    async ({ expression }) => evalInPage(manager, { expression })
  );

  server.registerTool(
    "browser_assert_picked_element_visible",
    {
      description: "Assert that the selector from the last extension-picked element is visible on the active page.",
      inputSchema: {
        timeoutMs: z.number().int().positive().optional().describe("Timeout in milliseconds."),
      },
    },
    async ({ timeoutMs }) => assertPickedElementVisible(manager, { timeoutMs })
  );

  server.registerTool(
    "browser_click_picked_element",
    {
      description: "Click the selector from the last extension-picked element.",
      inputSchema: {},
    },
    async () => clickPickedElement(manager)
  );

  server.registerTool(
    "browser_type_picked_element",
    {
      description: "Type into the selector from the last extension-picked element.",
      inputSchema: {
        text: z.string().describe("Text to type into the picked element."),
        clearFirst: z.boolean().optional().describe("Clear the field before typing."),
      },
    },
    async ({ text, clearFirst }) => typeIntoPickedElement(manager, { text, clearFirst })
  );

  server.registerTool(
    "browser_run_latest_action_request",
    {
      description: "Execute the latest picked-element action request from the extension bridge.",
      inputSchema: {},
    },
    async () => runLatestActionRequest(manager)
  );

  server.registerTool(
    "browser_run_next_action_request",
    {
      description: "Claim the next pending action_request inbox item from the extension bridge, execute it, and mark it completed.",
      inputSchema: {
        autoComplete: z.boolean().optional().describe("Mark the inbox item completed after success."),
      },
    },
    async ({ autoComplete }) => runNextActionRequestFromInbox(manager, { autoComplete })
  );

  server.registerTool(
    "browser_run_next_handoff",
    {
      description: "Claim the next pending handoff inbox item, optionally navigate to its active tab URL, and mark it completed.",
      inputSchema: {
        autoComplete: z.boolean().optional().describe("Mark the inbox item completed after reading it."),
        navigateToUrl: z.boolean().optional().describe("Navigate the active browser tab to the handoff activeTab URL if present."),
      },
    },
    async ({ autoComplete, navigateToUrl }) => runNextHandoffFromInbox(manager, { autoComplete, navigateToUrl })
  );

  server.registerTool(
    "browser_assert_text",
    {
      description: "Assert that visible text appears on the active page.",
      inputSchema: {
        text: z.string().describe("Visible text expected on the page."),
        timeoutMs: z.number().int().positive().optional().describe("Timeout in milliseconds."),
      },
    },
    async ({ text, timeoutMs }) => assertText(manager, { text, timeoutMs })
  );

  server.registerTool(
    "browser_assert_visible",
    {
      description: "Assert that the first matching selector is visible on the active page.",
      inputSchema: {
        selector: z.string().describe("CSS selector expected to be visible."),
        timeoutMs: z.number().int().positive().optional().describe("Timeout in milliseconds."),
      },
    },
    async ({ selector, timeoutMs }) => assertVisible(manager, { selector, timeoutMs })
  );

  server.registerTool(
    "browser_run_test_flow",
    {
      description: "Run a structured browser test flow made of navigation, interaction, inspection, and assertions.",
      inputSchema: {
        steps: z
          .array(z.record(z.any()))
          .describe("Ordered array of flow steps such as navigate, click, type, wait_for, assert_text, screenshot."),
      },
    },
    async ({ steps }) => runTestFlow(manager, sessions, { steps: steps as never[] })
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("browser-mcp running on stdio");
}
