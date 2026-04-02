import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const BRIDGE_URL = "http://127.0.0.1:8765";
const LAB_URL = "http://127.0.0.1:4173";

async function main(): Promise<void> {
  await fetch(`${BRIDGE_URL}/picked-element`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-action-demo",
      element: {
        selector: "#note-input",
        tag: "input",
        text: "",
        url: LAB_URL,
      },
    }),
  });

  await fetch(`${BRIDGE_URL}/action-request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-action-demo",
      activeTab: { title: "Browser Lab", url: LAB_URL },
      action: "type",
      text: "Keychron",
      note: "Type the message into the picked input.",
      pickedElement: { selector: "#note-input", text: "" },
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
    transport.stderr.on("data", (chunk) => process.stderr.write(chunk));
  }

  const client = new Client(
    {
      name: "browser-mcp-smoke-action-demo",
      version: "0.1.0",
    },
    { capabilities: {} }
  );

  await client.connect(transport);

  const navigate = await client.callTool({
    name: "browser_navigate",
    arguments: { url: LAB_URL },
  });

  const runTypeAction = await client.callTool({
    name: "browser_run_latest_action_request",
    arguments: {},
  });

  const typedValue = await client.callTool({
    name: "browser_eval",
    arguments: {
      expression: "document.querySelector('#note-input')?.value",
    },
  });

  await fetch(`${BRIDGE_URL}/picked-element`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-action-demo",
      element: {
        selector: "#apply-btn",
        tag: "button",
        text: "Apply Message",
        url: LAB_URL,
      },
    }),
  });

  await fetch(`${BRIDGE_URL}/action-request`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      source: "smoke-action-demo",
      activeTab: { title: "Browser Lab", url: LAB_URL },
      action: "click",
      text: "",
      note: "Click the apply button.",
      pickedElement: { selector: "#apply-btn", text: "Apply Message" },
    }),
  });

  const runClickAction = await client.callTool({
    name: "browser_run_latest_action_request",
    arguments: {},
  });

  const resultText = await client.callTool({
    name: "browser_eval",
    arguments: {
      expression: "document.querySelector('#result')?.textContent",
    },
  });

  console.log(
    JSON.stringify(
      {
        navigate,
        runTypeAction,
        typedValue,
        runClickAction,
        resultText,
      },
      null,
      2
    )
  );

  await client.close();
}

main().catch((error) => {
  console.error("smoke-action-demo failed:", error);
  process.exit(1);
});
