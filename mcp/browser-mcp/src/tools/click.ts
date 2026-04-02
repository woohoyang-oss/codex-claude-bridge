import type { ChromeManager } from "../chrome.js";

export async function click(manager: ChromeManager, args: { selector: string }) {
  const page = await manager.getActivePage();
  await page.locator(args.selector).first().click();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "clicked",
            selector: args.selector,
            url: page.url(),
          },
          null,
          2
        ),
      },
    ],
  };
}
