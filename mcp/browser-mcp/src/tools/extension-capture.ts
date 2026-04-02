import fs from "node:fs/promises";
import path from "node:path";

type InboxItem = {
  id?: string;
  status?: string;
  [key: string]: unknown;
};

const DATA_DIR =
  process.env.CODEX_CLAUDE_BRIDGE_DIR ||
  "/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge";
const LATEST_CAPTURE_PATH = path.join(DATA_DIR, "latest-capture.json");
const LATEST_PICKED_PATH = path.join(DATA_DIR, "latest-picked-element.json");
const LATEST_HANDOFF_PATH = path.join(DATA_DIR, "latest-handoff.json");
const LATEST_ACTION_REQUEST_PATH = path.join(DATA_DIR, "latest-action-request.json");
const INBOX_PATH = path.join(DATA_DIR, "inbox.json");

export async function getExtensionCapture() {
  const data = await readLatestExtensionCapture();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export async function getPickedElement() {
  const data = await readLatestPickedElement();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export async function getLatestHandoff() {
  const data = await readLatestHandoff();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export async function getLatestActionRequest() {
  const data = await readLatestActionRequest();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export async function getInboxItems(args: { status?: string; kind?: string; limit?: number } = {}) {
  const data = await readInboxItems();
  const items: InboxItem[] = Array.isArray(data?.items) ? (data.items as InboxItem[]) : [];
  const filteredByStatus = args.status
    ? items.filter((item: InboxItem) => item?.status === args.status)
    : items;
  const filtered = args.kind
    ? filteredByStatus.filter((item: InboxItem) => String(item?.kind || "") === args.kind)
    : filteredByStatus;
  const limited = typeof args.limit === "number" ? filtered.slice(0, args.limit) : filtered;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            ok: true,
            count: limited.length,
            items: limited,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function getNextInboxItem(args: { status?: string; kind?: string } = {}) {
  const data = await readInboxItems();
  const items: InboxItem[] = Array.isArray(data?.items) ? (data.items as InboxItem[]) : [];
  const item =
    items.find(
      (entry: InboxItem) =>
        (!args.status || entry?.status === args.status) &&
        (!args.kind || String(entry?.kind || "") === args.kind)
    ) || null;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            ok: true,
            item,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function readLatestExtensionCapture() {
  return readJson(LATEST_CAPTURE_PATH);
}

export async function readLatestPickedElement() {
  return readJson(LATEST_PICKED_PATH);
}

export async function readLatestHandoff() {
  return readJson(LATEST_HANDOFF_PATH);
}

export async function readLatestActionRequest() {
  return readJson(LATEST_ACTION_REQUEST_PATH);
}

export async function readInboxItems() {
  return readJson(INBOX_PATH);
}

async function readJson(filePath: string) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        ok: false,
        error: `No data found at ${filePath}`,
      };
    }
    throw error;
  }
}
