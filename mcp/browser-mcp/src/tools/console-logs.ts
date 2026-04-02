import type { ChromeManager } from "../chrome.js";
import type { SessionStore } from "../session-store.js";

export async function getConsoleLogs(manager: ChromeManager, sessions: SessionStore) {
  const page = await manager.getActivePage();
  const logs = sessions.getConsoleEntries(page);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url: page.url(),
            entries: logs,
          },
          null,
          2
        ),
      },
    ],
  };
}
