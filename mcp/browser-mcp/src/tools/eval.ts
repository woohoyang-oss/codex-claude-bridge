import type { ChromeManager } from "../chrome.js";

type EvalArgs = {
  expression: string;
};

export async function evalInPage(manager: ChromeManager, args: EvalArgs) {
  const page = await manager.getActivePage();

  const result = await page.evaluate(({ source }) => {
    const fn = new Function(`return (${source});`);
    return fn();
  }, { source: args.expression });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            url: page.url(),
            result,
          },
          null,
          2
        ),
      },
    ],
  };
}
