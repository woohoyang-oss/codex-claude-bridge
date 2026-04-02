import type { ChromeManager } from "../chrome.js";

type AssertTextArgs = {
  text: string;
  timeoutMs?: number;
};

export async function assertText(manager: ChromeManager, args: AssertTextArgs) {
  const page = await manager.getActivePage();
  const timeout = args.timeoutMs ?? 5000;

  await page.getByText(args.text, { exact: false }).first().waitFor({
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
            assertion: "text_visible",
            text: args.text,
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
