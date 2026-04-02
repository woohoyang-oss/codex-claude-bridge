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
import { listTabs } from "./tools/list-tabs.js";
import { navigate } from "./tools/navigate.js";
import { getNetworkLogs } from "./tools/network-logs.js";
import { selectTab } from "./tools/select-tab.js";
import { screenshot } from "./tools/screenshot.js";
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

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("browser-mcp running on stdio");
}
