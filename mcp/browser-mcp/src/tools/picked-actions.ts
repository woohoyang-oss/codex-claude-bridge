import type { ChromeManager } from "../chrome.js";
import { readLatestActionRequest, readLatestPickedElement } from "./extension-capture.js";

export async function clickPickedElement(manager: ChromeManager) {
  const selector = await getPickedSelector();
  const page = await manager.getActivePage();
  await page.locator(selector).first().click();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "clicked_picked_element",
            selector,
            url: page.url(),
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function typeIntoPickedElement(manager: ChromeManager, args: { text: string; clearFirst?: boolean }) {
  const selector = await getPickedSelector();
  const page = await manager.getActivePage();
  const locator = page.locator(selector).first();
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
            status: "typed_into_picked_element",
            selector,
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

export async function assertPickedElementVisible(manager: ChromeManager, args: { timeoutMs?: number }) {
  const selector = await getPickedSelector();
  const page = await manager.getActivePage();
  await page.locator(selector).first().waitFor({
    timeout: args.timeoutMs ?? 5000,
    state: "visible",
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "picked_element_visible",
            selector,
            timeoutMs: args.timeoutMs ?? 5000,
            url: page.url(),
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function getPickedSelector() {
  const picked = await readLatestPickedElement();
  const selector = picked?.payload?.element?.selector;
  if (!selector) {
    throw new Error("No picked-element selector is available from the extension bridge.");
  }
  return selector;
}

export async function runLatestActionRequest(manager: ChromeManager) {
  const request = await readLatestActionRequest();
  const action = request?.payload?.action;

  switch (action) {
    case "assert_visible":
      return assertPickedElementVisible(manager, { timeoutMs: 5000 });
    case "click":
      return clickPickedElement(manager);
    case "type":
      return typeIntoPickedElement(manager, {
        text: request?.payload?.text || "",
        clearFirst: true,
      });
    default:
      throw new Error(`Unsupported or missing latest action request: ${String(action)}`);
  }
}
