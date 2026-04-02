import type { ChromeManager } from "../chrome.js";

type WaitForArgs = {
  selector?: string;
  text?: string;
  timeoutMs?: number;
};

export async function waitFor(manager: ChromeManager, args: WaitForArgs) {
  const page = await manager.getActivePage();
  const timeout = args.timeoutMs ?? 5000;

  if (!args.selector && !args.text) {
    throw new Error("Provide either selector or text.");
  }

  if (args.selector) {
    await page.waitForSelector(args.selector, { timeout, state: "visible" });
  } else if (args.text) {
    await page.getByText(args.text, { exact: false }).first().waitFor({ timeout, state: "visible" });
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "ok",
            selector: args.selector ?? null,
            text: args.text ?? null,
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
