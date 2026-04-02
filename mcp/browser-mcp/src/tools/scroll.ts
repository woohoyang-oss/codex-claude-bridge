import type { ChromeManager } from "../chrome.js";

type ScrollArgs = {
  x?: number;
  y?: number;
};

export async function scroll(manager: ChromeManager, args: ScrollArgs) {
  const page = await manager.getActivePage();
  const x = args.x ?? 0;
  const y = args.y ?? 600;

  await page.evaluate(
    ({ scrollX, scrollY }) => {
      window.scrollBy(scrollX, scrollY);
    },
    { scrollX: x, scrollY: y }
  );

  const position = await page.evaluate(() => ({
    x: window.scrollX,
    y: window.scrollY,
  }));

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "scrolled",
            requested: { x, y },
            position,
            url: page.url(),
          },
          null,
          2
        ),
      },
    ],
  };
}
