import type { ChromeManager } from "../chrome.js";

type AssertVisibleArgs = {
  selector: string;
  timeoutMs?: number;
};

export async function assertVisible(manager: ChromeManager, args: AssertVisibleArgs) {
  const page = await manager.getActivePage();
  const timeout = args.timeoutMs ?? 5000;

  await page.locator(args.selector).first().waitFor({
    timeout,
    state: "visible",
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "assertion_passed",
            assertion: "selector_visible",
            selector: args.selector,
            timeoutMs: timeout,
            url: page.url(),
          },
          null,
          2
        ),
      },
    ],
  };
}
