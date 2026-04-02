import type { ChromeManager } from "../chrome.js";

export async function selectTab(manager: ChromeManager, args: { tabId: number }) {
  const page = await manager.selectPage(args.tabId);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            tabId: args.tabId,
            title: await page.title(),
            url: page.url(),
          },
          null,
          2
        ),
      },
    ],
  };
}
