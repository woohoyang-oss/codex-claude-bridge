import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR =
  process.env.CODEX_CLAUDE_BRIDGE_DIR ||
  "/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge";
const INBOX_PATH = path.join(DATA_DIR, "inbox.json");
type InboxItem = {
  id?: string;
  status?: string;
  [key: string]: unknown;
};

export async function markInboxItem(args: {
  itemId: string;
  status: "claimed" | "completed" | "failed" | "pending";
  error?: string;
}) {
  const updated = await updateInboxItemStatus(args);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            ok: true,
            item: updated,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function updateInboxItemStatus(args: {
  itemId: string;
  status: "claimed" | "completed" | "failed" | "pending";
  error?: string;
}) {
  const inbox = await readInbox();
  const items: InboxItem[] = Array.isArray(inbox?.items) ? (inbox.items as InboxItem[]) : [];
  const nextItems = items.map((item: InboxItem) =>
    item?.id === args.itemId
      ? {
          ...item,
          status: args.status,
          updatedAt: new Date().toISOString(),
          ...(args.status === "failed"
            ? {
                lastError: args.error || "Execution failed.",
              }
            : {}),
          ...(args.status === "pending"
            ? {
                retryCount: Number(item?.retryCount || 0) + 1,
                lastError: undefined,
              }
            : {}),
        }
      : item
  );
  const updated = nextItems.find((item: InboxItem) => item?.id === args.itemId);
  if (!updated) {
    throw new Error(`Inbox item not found: ${args.itemId}`);
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
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
  return updated;
}

export async function retryInboxItem(args: { itemId: string }) {
  const updated = await updateInboxItemStatus({
    itemId: args.itemId,
    status: "pending",
  });
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            ok: true,
            item: updated,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function readInbox() {
  try {
    const text = await fs.readFile(INBOX_PATH, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        ok: true,
        items: [],
      };
    }
    throw error;
  }
}
