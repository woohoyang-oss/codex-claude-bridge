import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR =
  process.env.CODEX_CLAUDE_BRIDGE_DIR ||
  "/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge";
const POLL_INTERVAL_MS = Number(process.env.CODEX_INBOX_RELAY_INTERVAL_MS || 2000);

const INBOX_PATH = path.join(DATA_DIR, "inbox.json");
const RELAY_DIR = path.join(DATA_DIR, "codex-inbox");
const OPEN_DIR = path.join(RELAY_DIR, "open");
const DONE_DIR = path.join(RELAY_DIR, "done");
const STATE_PATH = path.join(RELAY_DIR, "relay-state.json");

async function main() {
  await fs.mkdir(OPEN_DIR, { recursive: true });
  await fs.mkdir(DONE_DIR, { recursive: true });
  console.log(`codex-inbox-relay watching ${INBOX_PATH}`);
  console.log(`codex-inbox-relay output ${OPEN_DIR}`);

  await tick();
  setInterval(() => {
    void tick().catch((error) => {
      console.error("codex-inbox-relay tick failed:", error);
    });
  }, POLL_INTERVAL_MS);
}

async function tick() {
  const inbox = await readJson(INBOX_PATH, { ok: true, items: [] });
  const state = await readJson(STATE_PATH, { exportedIds: [], archivedIds: [] });
  const exportedIds = new Set(Array.isArray(state.exportedIds) ? state.exportedIds : []);
  const archivedIds = new Set(Array.isArray(state.archivedIds) ? state.archivedIds : []);
  const items = Array.isArray(inbox.items) ? inbox.items : [];
  let changed = false;

  for (const item of items) {
    if (!item?.id || exportedIds.has(item.id)) {
      continue;
    }

    const packet = buildPacket(item);
    await fs.writeFile(path.join(OPEN_DIR, `${item.id}.json`), JSON.stringify(packet, null, 2));
    await fs.writeFile(path.join(OPEN_DIR, `${item.id}.md`), buildMarkdown(packet));
    exportedIds.add(item.id);
    changed = true;
  }

  for (const item of items) {
    if (!item?.id || item.status !== "completed" || archivedIds.has(item.id)) {
      continue;
    }

    await archivePacket(item);
    archivedIds.add(item.id);
    changed = true;
  }

  if (changed) {
    await fs.writeFile(
      STATE_PATH,
      JSON.stringify(
        {
          exportedIds: Array.from(exportedIds),
          archivedIds: Array.from(archivedIds),
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }
}

async function archivePacket(item) {
  const archivedPacket = buildPacket(item, {
    status: "completed",
    archivedAt: new Date().toISOString(),
  });
  await fs.writeFile(path.join(DONE_DIR, `${item.id}.json`), JSON.stringify(archivedPacket, null, 2));
  await fs.writeFile(path.join(DONE_DIR, `${item.id}.md`), buildMarkdown(archivedPacket));
  await removeIfPresent(path.join(OPEN_DIR, `${item.id}.json`));
  await removeIfPresent(path.join(OPEN_DIR, `${item.id}.md`));
}

async function removeIfPresent(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

function buildPacket(item, overrides = {}) {
  const payload = item?.record?.payload || {};
  const note = String(payload.note || "").trim();
  const title =
    item.kind === "handoff"
      ? `Browser handoff: ${note || "review current page"}`
      : `Browser action: ${String(payload.action || "run request")}`;

  return {
    id: item.id,
    kind: item.kind,
    status: item.status,
    createdAt: item.createdAt,
    exportedAt: new Date().toISOString(),
    title,
    prompt: buildPrompt(item),
    payload,
    ...overrides,
  };
}

function buildPrompt(item) {
  const payload = item?.record?.payload || {};
  const activeTabUrl = payload.activeTab?.url || payload.tab?.url || "";
  const action = payload.action || "";
  const note = payload.note || "";

  if (item.kind === "handoff") {
    return [
      "Handle the browser handoff from the Chrome extension bridge.",
      activeTabUrl ? `Target URL: ${activeTabUrl}` : "No target URL provided.",
      note ? `Operator note: ${note}` : "No operator note provided.",
      "Use browser-mcp tools to inspect the page, verify the requested context, and continue the task.",
    ].join("\n");
  }

  return [
    "Handle the browser action request from the Chrome extension bridge.",
    activeTabUrl ? `Target URL: ${activeTabUrl}` : "No target URL provided.",
    action ? `Requested action: ${action}` : "No action provided.",
    note ? `Operator note: ${note}` : "No operator note provided.",
    "Use browser-mcp tools to execute or validate the request, then record the outcome.",
  ].join("\n");
}

function buildMarkdown(packet) {
  return [
    `# ${packet.title}`,
    "",
    `- id: ${packet.id}`,
    `- kind: ${packet.kind}`,
    `- status: ${packet.status}`,
    `- createdAt: ${packet.createdAt}`,
    `- exportedAt: ${packet.exportedAt}`,
    ...(packet.archivedAt ? [`- archivedAt: ${packet.archivedAt}`] : []),
    "",
    "## Prompt",
    "",
    packet.prompt,
    "",
    "## Payload",
    "",
    "```json",
    JSON.stringify(packet.payload, null, 2),
    "```",
    "",
  ].join("\n");
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
  console.error("codex-inbox-relay failed:", error);
  process.exit(1);
});
