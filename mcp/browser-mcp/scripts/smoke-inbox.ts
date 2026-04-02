import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const BRIDGE_URL = process.env.EXTENSION_BRIDGE_URL ?? "http://127.0.0.1:8765";

async function main(): Promise<void> {
  await fetch(`${BRIDGE_URL}/handoff`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-inbox",
      note: "Inspect the current page state",
      tab: {
        title: "Inbox Smoke",
        url: "https://example.com",
      },
    }),
  });

  await fetch(`${BRIDGE_URL}/action-request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-inbox",
      action: "assert_visible",
      note: "Confirm the selected element is still visible",
    }),
  });

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
      name: "browser-mcp-inbox-smoke",
      version: "0.1.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  const listPending = await client.callTool({
    name: "browser_list_inbox_items",
    arguments: {
      status: "pending",
      limit: 5,
    },
  });

  const nextPending = await client.callTool({
    name: "browser_get_next_inbox_item",
    arguments: {
      status: "pending",
    },
  });

  const item = JSON.parse(String(nextPending.content?.[0]?.text || "{}")).item;
  if (!item?.id) {
    throw new Error("No pending inbox item was returned.");
  }

  const claimed = await client.callTool({
    name: "browser_claim_inbox_item",
    arguments: {
      itemId: item.id,
    },
  });

  const completed = await client.callTool({
    name: "browser_complete_inbox_item",
    arguments: {
      itemId: item.id,
    },
  });

  await client.callTool({
    name: "browser_navigate",
    arguments: {
      url: "https://example.com",
    },
  });

  await fetch(`${BRIDGE_URL}/picked-element`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-inbox",
      element: {
        selector: "h1",
      },
    }),
  });

  await fetch(`${BRIDGE_URL}/action-request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-inbox",
      action: "assert_visible",
      note: "Run from pending queue",
    }),
  });

  const runNextActionRequest = await client.callTool({
    name: "browser_run_next_action_request",
    arguments: {
      autoComplete: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        listPending,
        nextPending,
        claimed,
        completed,
        runNextActionRequest,
      },
      null,
      2
    )
  );

  await client.close();
}

main().catch((error) => {
  console.error("smoke-inbox failed:", error);
  process.exit(1);
});
