import fs from "node:fs/promises";
import path from "node:path";

const ROOT_DIR = "/Users/wooho/Documents/Playground";
const DATA_DIR = path.join(ROOT_DIR, ".runtime", "codex-claude-bridge");
const INBOX_PATH = path.join(DATA_DIR, "inbox.json");
const RELAY_OPEN_DIR = path.join(DATA_DIR, "codex-inbox", "open");
const RELAY_DONE_DIR = path.join(DATA_DIR, "codex-inbox", "done");

async function main() {
  const uniqueId = `relay-smoke-${Date.now()}`;
  const inbox = await readJson(INBOX_PATH, { ok: true, items: [] });
  const items = Array.isArray(inbox.items) ? inbox.items : [];
  items.unshift({
    id: uniqueId,
    kind: "handoff",
    status: "pending",
    createdAt: new Date().toISOString(),
    record: {
      receivedAt: new Date().toISOString(),
      payload: {
        source: "smoke-codex-inbox-relay",
        note: "Relay this browser handoff into a Codex inbox packet",
        activeTab: {
          title: "Example Domain",
          url: "https://example.com",
        },
      },
    },
  });

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    INBOX_PATH,
    JSON.stringify(
      {
        ok: true,
        items,
      },
      null,
      2
    )
  );

  const jsonPath = path.join(RELAY_OPEN_DIR, `${uniqueId}.json`);
  const mdPath = path.join(RELAY_OPEN_DIR, `${uniqueId}.md`);
  await waitForFile(jsonPath, 5000);
  await waitForFile(mdPath, 5000);

  const packet = JSON.parse(await fs.readFile(jsonPath, "utf8"));
  const markdown = await fs.readFile(mdPath, "utf8");

  const updatedInbox = await readJson(INBOX_PATH, { ok: true, items: [] });
  const updatedItems = Array.isArray(updatedInbox.items) ? updatedInbox.items : [];
  const nextItems = updatedItems.map((item) =>
    item?.id === uniqueId
      ? {
          ...item,
          status: "completed",
          updatedAt: new Date().toISOString(),
        }
      : item
  );
  await fs.writeFile(
    INBOX_PATH,
    JSON.stringify(
      {
        ok: true,
        items: nextItems,
      },
      null,
      2
    )
  );

  const archivedJsonPath = path.join(RELAY_DONE_DIR, `${uniqueId}.json`);
  const archivedMdPath = path.join(RELAY_DONE_DIR, `${uniqueId}.md`);
  await waitForFile(archivedJsonPath, 5000);
  await waitForFile(archivedMdPath, 5000);

  console.log(
    JSON.stringify(
      {
        jsonPath,
        mdPath,
        archivedJsonPath,
        archivedMdPath,
        packet,
        markdownPreview: markdown.split("\n").slice(0, 12).join("\n"),
      },
      null,
      2
    )
  );
}

async function waitForFile(filePath, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await fs.access(filePath);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`Timed out waiting for file: ${filePath}`);
}

async function readJson(filePath, fallback) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

main().catch((error) => {
  console.error("smoke-codex-inbox-relay failed:", error);
  process.exit(1);
});
