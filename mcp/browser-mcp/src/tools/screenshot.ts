import os from "node:os";
import path from "node:path";
import type { ChromeManager } from "../chrome.js";

export async function screenshot(
  manager: ChromeManager,
  args: { fullPage?: boolean; outputPath?: string }
) {
  const page = await manager.getActivePage();
  const outputPath =
    args.outputPath && path.isAbsolute(args.outputPath)
      ? args.outputPath
      : path.join(os.tmpdir(), `browser-mcp-${Date.now()}.png`);

  await page.screenshot({
    fullPage: args.fullPage ?? false,
    path: outputPath,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            savedTo: outputPath,
            url: page.url(),
          },
          null,
          2
        ),
      },
    ],
  };
}
