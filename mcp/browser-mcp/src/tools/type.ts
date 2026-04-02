import type { ChromeManager } from "../chrome.js";

type TypeArgs = {
  selector: string;
  text: string;
  clearFirst?: boolean;
};

export async function typeText(manager: ChromeManager, args: TypeArgs) {
  const page = await manager.getActivePage();
  const locator = page.locator(args.selector).first();

  await locator.click();
  if (args.clearFirst ?? true) {
    await locator.fill("");
  }
  await locator.type(args.text);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "typed",
            selector: args.selector,
            textLength: args.text.length,
            url: page.url(),
          },
          null,
          2
        ),
      },
    ],
  };
}
