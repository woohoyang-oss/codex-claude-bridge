const elements = {
  tabTitle: document.querySelector("#tab-title"),
  tabUrl: document.querySelector("#tab-url"),
  captureOutput: document.querySelector("#capture-output"),
  pickedOutput: document.querySelector("#picked-output"),
  pickedAction: document.querySelector("#picked-action"),
  pickedActionText: document.querySelector("#picked-action-text"),
  pickedActionNote: document.querySelector("#picked-action-note"),
  inboxSummary: document.querySelector("#inbox-summary"),
  inboxOutput: document.querySelector("#inbox-output"),
  bridgeUrl: document.querySelector("#bridge-url"),
  handoffNote: document.querySelector("#handoff-note"),
  bridgeStatus: document.querySelector("#bridge-status"),
  refreshTab: document.querySelector("#refresh-tab"),
  capturePage: document.querySelector("#capture-page"),
  copyCapture: document.querySelector("#copy-capture"),
  startPicker: document.querySelector("#start-picker"),
  stopPicker: document.querySelector("#stop-picker"),
  saveBridgeUrl: document.querySelector("#save-bridge-url"),
  refreshInbox: document.querySelector("#refresh-inbox"),
  pushBridge: document.querySelector("#push-bridge"),
  pushPicked: document.querySelector("#push-picked"),
  createHandoff: document.querySelector("#create-handoff"),
  createActionRequest: document.querySelector("#create-action-request"),
};

boot();

async function boot() {
  await refreshView();
  bindEvents();
}

function bindEvents() {
  elements.refreshTab.addEventListener("click", () => void refreshTab());
  elements.capturePage.addEventListener("click", () => void capturePage());
  elements.copyCapture.addEventListener("click", () => void copyCapture());
  elements.startPicker.addEventListener("click", () => void sendRuntimeMessage({ type: "bridge:start-picker" }));
  elements.stopPicker.addEventListener("click", () => void sendRuntimeMessage({ type: "bridge:stop-picker" }));
  elements.saveBridgeUrl.addEventListener("click", () =>
    void sendRuntimeMessage({
      type: "bridge:save-bridge-url",
      bridgeUrl: elements.bridgeUrl.value.trim(),
    }).then(() => {
      elements.bridgeStatus.textContent = "Bridge URL saved.";
      void refreshInbox();
    })
  );
  elements.refreshInbox.addEventListener("click", () => void refreshInbox());
  elements.pushBridge.addEventListener("click", () => void pushBridge());
  elements.pushPicked.addEventListener("click", () => void pushPickedElement());
  elements.createHandoff.addEventListener("click", () => void createHandoff());
  elements.createActionRequest.addEventListener("click", () => void createActionRequest());
}

async function refreshView() {
  await refreshTab();
  const settings = await sendRuntimeMessage({ type: "bridge:get-settings" });
  elements.bridgeUrl.value = settings.bridgeUrl || "";
  elements.captureOutput.textContent = settings.lastCapture
    ? JSON.stringify(settings.lastCapture, null, 2)
    : "No page capture yet.";
  elements.pickedOutput.textContent = settings.lastPickedElement
    ? JSON.stringify(settings.lastPickedElement, null, 2)
    : "No element selected.";
  await refreshInbox();
}

async function refreshTab() {
  const result = await sendRuntimeMessage({ type: "bridge:get-active-tab" });
  if (!result.ok || !result.tab) {
    elements.tabTitle.textContent = "No active tab";
    elements.tabUrl.textContent = "Open a page to begin.";
    return;
  }
  elements.tabTitle.textContent = result.tab.title || "Untitled tab";
  elements.tabUrl.textContent = result.tab.url || "";
}

async function capturePage() {
  const result = await sendRuntimeMessage({ type: "bridge:capture-page" });
  if (!result.ok) {
    elements.captureOutput.textContent = result.error || "Page capture failed.";
    return;
  }
  elements.captureOutput.textContent = JSON.stringify(result.payload, null, 2);
}

async function copyCapture() {
  const text = elements.captureOutput.textContent || "";
  await navigator.clipboard.writeText(text);
  elements.bridgeStatus.textContent = "Copied capture JSON to clipboard.";
}

async function pushBridge() {
  const result = await sendRuntimeMessage({ type: "bridge:push-last-capture" });
  if (!result.ok) {
    elements.bridgeStatus.textContent = result.error || "Bridge push failed.";
    return;
  }
  elements.bridgeStatus.textContent = `Bridge push succeeded (${result.status} ${result.statusText}).`;
}

async function pushPickedElement() {
  const result = await sendRuntimeMessage({ type: "bridge:push-picked-element" });
  if (!result.ok) {
    elements.bridgeStatus.textContent = result.error || "Picked-element push failed.";
    return;
  }
  elements.bridgeStatus.textContent = `Picked element push succeeded (${result.status} ${result.statusText}).`;
}

async function createHandoff() {
  const result = await sendRuntimeMessage({
    type: "bridge:create-handoff",
    note: elements.handoffNote.value.trim(),
  });
  if (!result.ok) {
    elements.bridgeStatus.textContent = result.error || "Codex handoff creation failed.";
    return;
  }
  elements.bridgeStatus.textContent = `Codex handoff stored (${result.status} ${result.statusText}).`;
  await refreshInbox();
}

async function createActionRequest() {
  const result = await sendRuntimeMessage({
    type: "bridge:create-action-request",
    action: elements.pickedAction.value,
    text: elements.pickedActionText.value.trim(),
    note: elements.pickedActionNote.value.trim(),
  });
  if (!result.ok) {
    elements.bridgeStatus.textContent = result.error || "Action request creation failed.";
    return;
  }
  elements.bridgeStatus.textContent = `Action request stored (${result.status} ${result.statusText}).`;
  await refreshInbox();
}

async function refreshInbox() {
  const result = await sendRuntimeMessage({ type: "bridge:get-inbox" });
  if (!result.ok) {
    elements.inboxSummary.textContent = result.error || "Inbox fetch failed.";
    elements.inboxOutput.textContent = "No inbox data loaded.";
    return;
  }

  const items = Array.isArray(result.payload?.items) ? result.payload.items : [];
  const pending = items.filter((item) => item?.status === "pending").length;
  const claimed = items.filter((item) => item?.status === "claimed").length;
  const completed = items.filter((item) => item?.status === "completed").length;
  elements.inboxSummary.textContent = `${items.length} items total, ${pending} pending, ${claimed} claimed, ${completed} completed.`;
  elements.inboxOutput.textContent = JSON.stringify(items.slice(0, 8), null, 2);
}

async function sendRuntimeMessage(message) {
  return chrome.runtime.sendMessage(message);
}
