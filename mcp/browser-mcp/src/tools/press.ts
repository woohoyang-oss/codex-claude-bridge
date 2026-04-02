import type { ChromeManager } from "../chrome.js";

type PressArgs = {
  key: string;
};

export async function press(manager: ChromeManager, args: PressArgs) {
  const page = await manager.getActivePage();
  await page.keyboard.press(args.key);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "pressed",
            key: args.key,
            url: page.url(),
          },
          null,
          2
        ),
      },
    ],
  };
}
