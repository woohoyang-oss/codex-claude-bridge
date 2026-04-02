import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main(): Promise<void> {
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(process.cwd(), "dist", "index.js")],
    cwd: process.cwd(),
    stderr: "pipe",
    env: {
      BROWSER_MCP_CDP_URL: process.env.BROWSER_MCP_CDP_URL ?? "http://127.0.0.1:9222",
      CODEX_CLAUDE_BRIDGE_DIR:
        process.env.CODEX_CLAUDE_BRIDGE_DIR ??
        "/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge",
    },
  });

  if (transport.stderr) {
    transport.stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
  }

  const client = new Client(
    {
      name: "browser-mcp-smoke",
      version: "0.1.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  const screenshotPath = path.join("/tmp", `browser-mcp-smoke-${Date.now()}.png`);

  const listTools = await client.listTools();
  const navigate = await client.callTool({
    name: "browser_navigate",
    arguments: {
      url: "https://example.com",
    },
  });
  const waitFor = await client.callTool({
    name: "browser_wait_for",
    arguments: {
      text: "Example Domain",
      timeoutMs: 10000,
    },
  });
  const dom = await client.callTool({
    name: "browser_get_dom_summary",
    arguments: {},
  });
  const screenshot = await client.callTool({
    name: "browser_screenshot",
    arguments: {
      outputPath: screenshotPath,
      fullPage: true,
    },
  });
  const consoleLogs = await client.callTool({
    name: "browser_get_console_logs",
    arguments: {},
  });
  const networkLogs = await client.callTool({
    name: "browser_get_network_logs",
    arguments: {},
  });
  const assertText = await client.callTool({
    name: "browser_assert_text",
    arguments: {
      text: "Example Domain",
      timeoutMs: 5000,
    },
  });
  const assertVisible = await client.callTool({
    name: "browser_assert_visible",
    arguments: {
      selector: "h1",
      timeoutMs: 5000,
    },
  });
  const evalResult = await client.callTool({
    name: "browser_eval",
    arguments: {
      expression: "document.title",
    },
  });
  const scrollResult = await client.callTool({
    name: "browser_scroll",
    arguments: {
      y: 250,
    },
  });
  const flowResult = await client.callTool({
    name: "browser_run_test_flow",
    arguments: {
      steps: [
        { action: "navigate", url: "https://example.com" },
        { action: "wait_for", text: "Example Domain", timeoutMs: 10000 },
        { action: "assert_text", text: "Example Domain", timeoutMs: 5000 },
        { action: "assert_visible", selector: "h1", timeoutMs: 5000 },
        { action: "eval", expression: "document.title" }
      ],
    },
  });
  const extensionCapture = await client.callTool({
    name: "browser_get_extension_capture",
    arguments: {},
  });
  const pickedElement = await client.callTool({
    name: "browser_get_picked_element",
    arguments: {},
  });
  const latestHandoff = await client.callTool({
    name: "browser_get_latest_handoff",
    arguments: {},
  });
  const latestActionRequest = await client.callTool({
    name: "browser_get_latest_action_request",
    arguments: {},
  });
  const pickedVisible = await client.callTool({
    name: "browser_assert_picked_element_visible",
    arguments: {
      timeoutMs: 5000,
    },
  });
  const runLatestActionRequest = await client.callTool({
    name: "browser_run_latest_action_request",
    arguments: {},
  });

  console.log(
    JSON.stringify(
      {
        tools: listTools.tools.map((tool) => tool.name),
        navigate,
        waitFor,
        dom,
        screenshot,
        consoleLogs,
        networkLogs,
        assertText,
        assertVisible,
        evalResult,
        scrollResult,
        flowResult,
        extensionCapture,
        pickedElement,
        latestHandoff,
        latestActionRequest,
        pickedVisible,
        runLatestActionRequest,
      },
      null,
      2
    )
  );

  await client.close();
}

main().catch((error) => {
  console.error("smoke failed:", error);
  process.exit(1);
});
