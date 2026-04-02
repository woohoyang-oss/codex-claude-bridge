import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const execFileAsync = promisify(execFile);
const BRIDGE_URL = process.env.EXTENSION_BRIDGE_URL ?? "http://127.0.0.1:8765";

async function main(): Promise<void> {
  await fetch(`${BRIDGE_URL}/picked-element`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-retry",
      element: {
        selector: "#definitely-missing",
      },
    }),
  });

  await fetch(`${BRIDGE_URL}/action-request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-retry",
      action: "assert_visible",
      note: "This should fail before a picked element exists",
      activeTab: {
        title: "Example Domain",
        url: "https://example.com",
      },
    }),
  });

  const firstRun = await runWorkerOnce();
  const failedItem = findHandled(firstRun.handled, "failed");
  if (!failedItem?.id) {
    throw new Error("Expected a failed inbox item after the first worker run.");
  }

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

  const client = new Client(
    {
      name: "browser-mcp-smoke-retry",
      version: "0.1.0",
    },
    {
      capabilities: {},
    }
  );
  await client.connect(transport);

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
      source: "smoke-retry",
      element: {
        selector: "h1",
      },
    }),
  });

  const retryResult = await client.callTool({
    name: "browser_retry_inbox_item",
    arguments: {
      itemId: failedItem.id,
    },
  });

  await client.close();

  const secondRun = await runWorkerOnce();

  console.log(
    JSON.stringify(
      {
        firstRun,
        retryResult,
        secondRun,
      },
      null,
      2
    )
  );
}

async function runWorkerOnce() {
  const { stdout } = await execFileAsync("npx", ["tsx", "scripts/inbox-worker.ts", "--once"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BROWSER_MCP_CDP_URL: process.env.BROWSER_MCP_CDP_URL ?? "http://127.0.0.1:9222",
      CODEX_CLAUDE_BRIDGE_DIR:
        process.env.CODEX_CLAUDE_BRIDGE_DIR ??
        "/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge",
    },
  });

  return JSON.parse(stdout.trim() || "{}");
}

function findHandled(handled, status) {
  return Array.isArray(handled) ? handled.find((item) => item?.status === status) : null;
}

main().catch((error) => {
  console.error("smoke-retry failed:", error);
  process.exit(1);
});
