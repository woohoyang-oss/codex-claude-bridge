import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BRIDGE_URL = process.env.EXTENSION_BRIDGE_URL ?? "http://127.0.0.1:8765";

async function main(): Promise<void> {
  await fetch(`${BRIDGE_URL}/picked-element`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-worker",
      element: {
        selector: "h1",
      },
    }),
  });

  await fetch(`${BRIDGE_URL}/action-request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-worker",
      action: "assert_visible",
      note: "Worker should consume this pending action request",
      activeTab: {
        title: "Example Domain",
        url: "https://example.com",
      },
    }),
  });

  await fetch(`${BRIDGE_URL}/handoff`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-worker",
      note: "Worker should consume this pending handoff",
      activeTab: {
        title: "Example Domain",
        url: "https://example.com",
      },
    }),
  });

  const { stdout } = await execFileAsync(
    "npx",
    ["tsx", "scripts/inbox-worker.ts", "--once"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BROWSER_MCP_CDP_URL: process.env.BROWSER_MCP_CDP_URL ?? "http://127.0.0.1:9222",
        CODEX_CLAUDE_BRIDGE_DIR:
          process.env.CODEX_CLAUDE_BRIDGE_DIR ??
          "/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge",
      },
    }
  );

  const workerSummary = JSON.parse(stdout.trim() || "{}");

  const inboxPath =
    process.env.CODEX_CLAUDE_BRIDGE_DIR ??
    "/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge";
  const inbox = await import("node:fs/promises").then((fs) =>
    fs.readFile(path.join(inboxPath, "inbox.json"), "utf8")
  );

  console.log(
    JSON.stringify(
      {
        workerSummary,
        inbox: JSON.parse(inbox),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("smoke-worker failed:", error);
  process.exit(1);
});
