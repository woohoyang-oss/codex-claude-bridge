import type { ChromeManager } from "../chrome.js";
import { readInboxItems } from "./extension-capture.js";
import { updateInboxItemStatus } from "./inbox.js";

type HandoffInboxItem = {
  id?: string;
  kind?: string;
  status?: string;
  record?: {
    payload?: {
      activeTab?: {
        url?: string;
        title?: string;
      };
      note?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export async function runNextHandoffFromInbox(
  manager: ChromeManager,
  args: { autoComplete?: boolean; navigateToUrl?: boolean } = {}
) {
  const inbox = await readInboxItems();
  const items: HandoffInboxItem[] = Array.isArray(inbox?.items) ? (inbox.items as HandoffInboxItem[]) : [];
  const nextPending = items.find(
    (item: HandoffInboxItem) => item?.status === "pending" && item?.kind === "handoff" && item?.record?.payload
  );

  if (!nextPending?.id) {
    throw new Error("No pending handoff inbox item is available.");
  }

  const claimed = await updateInboxItemStatus({ itemId: nextPending.id, status: "claimed" });
  const payload = nextPending.record?.payload ?? {};
  let navigatedTo = null;

  if (args.navigateToUrl) {
    const url = String(payload.activeTab?.url || "");
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const page = await manager.getActivePage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      navigatedTo = page.url();
    }
  }

  let completed = null;
  if (args.autoComplete ?? true) {
    completed = await updateInboxItemStatus({ itemId: nextPending.id, status: "completed" });
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            ok: true,
            inboxItemId: nextPending.id,
            claimedStatus: claimed.status,
            completedStatus: completed?.status ?? claimed.status,
            navigatedTo,
            payload,
          },
          null,
          2
        ),
      },
    ],
  };
}
