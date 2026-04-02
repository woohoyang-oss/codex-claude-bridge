const elements = {
  tabTitle: document.querySelector("#tab-title"),
  tabUrl: document.querySelector("#tab-url"),
  captureOutput: document.querySelector("#capture-output"),
  pickedOutput: document.querySelector("#picked-output"),
  bridgeUrl: document.querySelector("#bridge-url"),
  bridgeStatus: document.querySelector("#bridge-status"),
  refreshTab: document.querySelector("#refresh-tab"),
  capturePage: document.querySelector("#capture-page"),
  copyCapture: document.querySelector("#copy-capture"),
  startPicker: document.querySelector("#start-picker"),
  stopPicker: document.querySelector("#stop-picker"),
  saveBridgeUrl: document.querySelector("#save-bridge-url"),
  pushBridge: document.querySelector("#push-bridge"),
  pushPicked: document.querySelector("#push-picked"),
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
    })
  );
  elements.pushBridge.addEventListener("click", () => void pushBridge());
  elements.pushPicked.addEventListener("click", () => void pushPickedElement());
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

async function sendRuntimeMessage(message) {
  return chrome.runtime.sendMessage(message);
}
