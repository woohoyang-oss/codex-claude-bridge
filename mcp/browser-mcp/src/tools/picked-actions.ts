import type { ChromeManager } from "../chrome.js";
import { readInboxItems, readLatestActionRequest, readLatestPickedElement } from "./extension-capture.js";
import { updateInboxItemStatus } from "./inbox.js";

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

export async function runNextActionRequestFromInbox(manager: ChromeManager, args: { autoComplete?: boolean } = {}) {
  const request = await readLatestActionRequest();
  const inbox = await readInboxItems();
  const items: Array<Record<string, any>> = Array.isArray(inbox?.items) ? inbox.items : [];
  const nextPending = items.find(
    (item: Record<string, any>) =>
      item?.status === "pending" && item?.kind === "action_request" && item?.record?.payload?.action
  );

  if (!nextPending?.id) {
    throw new Error("No pending action_request inbox item is available.");
  }

  await updateInboxItemStatus({ itemId: nextPending.id, status: "claimed" });
  const payload = nextPending.record;
  const action = payload?.payload?.action;

  let result;
  switch (action) {
    case "assert_visible":
      result = await assertPickedElementVisible(manager, { timeoutMs: 5000 });
      break;
    case "click":
      result = await clickPickedElement(manager);
      break;
    case "type":
      result = await typeIntoPickedElement(manager, {
        text: payload?.payload?.text || "",
        clearFirst: true,
      });
      break;
    default:
      throw new Error(`Unsupported action_request inbox action: ${String(action)}`);
  }

  if (args.autoComplete ?? true) {
    await updateInboxItemStatus({ itemId: nextPending.id, status: "completed" });
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            inboxItemId: nextPending.id,
            handledAction: action,
            latestActionRequestPreview: request?.payload?.action ?? null,
            result: JSON.parse(String(result.content[0]?.text || "{}")),
          },
          null,
          2
        ),
      },
    ],
  };
}
