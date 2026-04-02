import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ONCE = process.argv.includes("--once");
const INTERVAL_MS = getIntervalArg() ?? 3000;

async function main(): Promise<void> {
  if (ONCE) {
    const summary = await runCycle();
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`browser-inbox-worker polling every ${INTERVAL_MS}ms`);
  while (true) {
    const summary = await runCycle();
    console.log(JSON.stringify(summary, null, 2));
    await sleep(INTERVAL_MS);
  }
}

async function runCycle() {
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
      name: "browser-inbox-worker",
      version: "0.1.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  const handled = [];

  while (true) {
    const nextAction = await getNextItem(client, "action_request");
    if (!nextAction?.id) {
      break;
    }
    const actionUrl = nextAction?.record?.payload?.activeTab?.url;
    if (isNavigableUrl(actionUrl)) {
      await client.callTool({
        name: "browser_navigate",
        arguments: {
          url: actionUrl,
        },
      });
    }
    try {
      const result = await client.callTool({
        name: "browser_run_next_action_request",
        arguments: {
          autoComplete: true,
        },
      });
      if (result.isError) {
        throw new Error(extractText(result) || "Action request tool returned an error.");
      }
      handled.push({
        kind: "action_request",
        id: nextAction.id,
        status: "completed",
        result: extractText(result),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await client.callTool({
        name: "browser_fail_inbox_item",
        arguments: {
          itemId: nextAction.id,
          error: message,
        },
      });
      handled.push({
        kind: "action_request",
        id: nextAction.id,
        status: "failed",
        error: message,
      });
    }
  }

  while (true) {
    const nextHandoff = await getNextItem(client, "handoff");
    if (!nextHandoff?.id) {
      break;
    }
    try {
      const result = await client.callTool({
        name: "browser_run_next_handoff",
        arguments: {
          autoComplete: true,
          navigateToUrl: true,
        },
      });
      if (result.isError) {
        throw new Error(extractText(result) || "Handoff tool returned an error.");
      }
      handled.push({
        kind: "handoff",
        id: nextHandoff.id,
        status: "completed",
        result: extractText(result),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await client.callTool({
        name: "browser_fail_inbox_item",
        arguments: {
          itemId: nextHandoff.id,
          error: message,
        },
      });
      handled.push({
        kind: "handoff",
        id: nextHandoff.id,
        status: "failed",
        error: message,
      });
    }
  }

  await client.close();

  return {
    ranAt: new Date().toISOString(),
    handledCount: handled.length,
    handled,
  };
}

async function getNextItem(client: Client, kind: string) {
  const response = await client.callTool({
    name: "browser_get_next_inbox_item",
    arguments: {
      status: "pending",
      kind,
    },
  });
  return JSON.parse(extractText(response) || "{}").item || null;
}

function extractText(result: any) {
  return String(result?.content?.[0]?.text || "");
}

function isNavigableUrl(value: unknown) {
  const text = String(value || "");
  return text.startsWith("http://") || text.startsWith("https://");
}

function getIntervalArg() {
  const index = process.argv.findIndex((arg) => arg === "--interval-ms");
  if (index === -1) {
    return null;
  }
  const raw = process.argv[index + 1];
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error("browser-inbox-worker failed:", error);
  process.exit(1);
});
