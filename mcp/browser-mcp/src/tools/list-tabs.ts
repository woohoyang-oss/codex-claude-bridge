import type { ChromeManager } from "../chrome.js";

export async function listTabs(manager: ChromeManager) {
  const pages = await manager.listPages();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          pages.map((page, index) => ({
            tabId: index,
            title: page.url() ? page.url() : "about:blank",
            url: page.url(),
          })),
          null,
          2
        ),
      },
    ],
  };
}
