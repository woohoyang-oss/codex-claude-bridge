import type { ChromeManager } from "../chrome.js";

export async function navigate(manager: ChromeManager, args: { url: string }) {
  const page = await manager.navigate(args.url);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url: page.url(),
            title: await page.title(),
          },
          null,
          2
        ),
      },
    ],
  };
}
