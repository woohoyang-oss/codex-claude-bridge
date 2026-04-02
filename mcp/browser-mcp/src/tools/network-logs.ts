import type { ChromeManager } from "../chrome.js";
import type { SessionStore } from "../session-store.js";

export async function getNetworkLogs(manager: ChromeManager, sessions: SessionStore) {
  const page = await manager.getActivePage();
  const entries = sessions.getNetworkEntries(page);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url: page.url(),
            entries,
          },
          null,
          2
        ),
      },
    ],
  };
}
