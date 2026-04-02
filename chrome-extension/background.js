const DEFAULT_BRIDGE_URL = "http://127.0.0.1:8765";

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  const { bridgeUrl } = await chrome.storage.local.get("bridgeUrl");
  if (!bridgeUrl) {
    await chrome.storage.local.set({ bridgeUrl: DEFAULT_BRIDGE_URL });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void handleMessage(message, sender)
    .then((result) => sendResponse(result))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    );
  return true;
});

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "bridge:get-active-tab":
      return getActiveTab();
    case "bridge:capture-page":
      return withActiveTab((tabId) =>
        chrome.tabs.sendMessage(tabId, { type: "bridge:capture-page" })
      );
    case "bridge:start-picker":
      return withActiveTab((tabId) =>
        chrome.tabs.sendMessage(tabId, { type: "bridge:start-picker" })
      );
    case "bridge:stop-picker":
      return withActiveTab((tabId) =>
        chrome.tabs.sendMessage(tabId, { type: "bridge:stop-picker" })
      );
    case "bridge:save-bridge-url":
      await chrome.storage.local.set({ bridgeUrl: message.bridgeUrl });
      return { ok: true, bridgeUrl: message.bridgeUrl };
    case "bridge:get-settings":
      return chrome.storage.local.get(["bridgeUrl", "lastCapture", "lastPickedElement"]);
    case "bridge:get-inbox":
      return getInbox();
    case "bridge:push-last-capture":
      return pushLastCaptureToBridge();
    case "bridge:push-picked-element":
      return pushPickedElementToBridge();
    case "bridge:create-handoff":
      return createHandoff(message.note);
    case "bridge:create-action-request":
      return createActionRequest(message);
    case "bridge:picked-element":
      await chrome.storage.local.set({ lastPickedElement: message.payload });
      return { ok: true };
    case "bridge:capture-result":
      await chrome.storage.local.set({ lastCapture: message.payload });
      return { ok: true };
    default:
      return { ok: false, error: `Unknown message type: ${message?.type ?? "undefined"}` };
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return {
    ok: true,
    tab: tab
      ? {
          id: tab.id,
          title: tab.title,
          url: tab.url,
        }
      : null,
  };
}

async function withActiveTab(callback) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return { ok: false, error: "No active tab was found." };
  }
  const result = await callback(tab.id);
  return result ?? { ok: true };
}

async function pushLastCaptureToBridge() {
  const { bridgeUrl, lastCapture } = await chrome.storage.local.get(["bridgeUrl", "lastCapture"]);
  if (!lastCapture) {
    return { ok: false, error: "No captured page context is available yet." };
  }

  const response = await fetch(bridgeUrl || DEFAULT_BRIDGE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      source: "chrome-extension",
      capturedAt: new Date().toISOString(),
      page: lastCapture,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  };
}

async function pushPickedElementToBridge() {
  const { bridgeUrl, lastPickedElement } = await chrome.storage.local.get(["bridgeUrl", "lastPickedElement"]);
  if (!lastPickedElement) {
    return { ok: false, error: "No picked element is available yet." };
  }

  const response = await fetch(`${bridgeUrl || DEFAULT_BRIDGE_URL}/picked-element`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      source: "chrome-extension",
      capturedAt: new Date().toISOString(),
      element: lastPickedElement,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  };
}

async function createHandoff(note) {
  const [{ title, url }, { bridgeUrl, lastCapture, lastPickedElement }] = await Promise.all([
    getActiveTab().then((result) => result.tab || {}),
    chrome.storage.local.get(["bridgeUrl", "lastCapture", "lastPickedElement"]),
  ]);

  const payload = {
    source: "chrome-extension",
    createdAt: new Date().toISOString(),
    activeTab: { title, url },
    note: note || "",
    capture: lastCapture || null,
    pickedElement: lastPickedElement || null,
  };

  const response = await fetch(`${bridgeUrl || DEFAULT_BRIDGE_URL}/handoff`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    payload,
  };
}

async function createActionRequest(message) {
  const [{ title, url }, { bridgeUrl, lastPickedElement }] = await Promise.all([
    getActiveTab().then((result) => result.tab || {}),
    chrome.storage.local.get(["bridgeUrl", "lastPickedElement"]),
  ]);

  const payload = {
    source: "chrome-extension",
    createdAt: new Date().toISOString(),
    activeTab: { title, url },
    action: message.action,
    text: message.text || "",
    note: message.note || "",
    pickedElement: lastPickedElement || null,
  };

  const response = await fetch(`${bridgeUrl || DEFAULT_BRIDGE_URL}/action-request`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    payload,
  };
}

async function getInbox() {
  const { bridgeUrl } = await chrome.storage.local.get(["bridgeUrl"]);
  const response = await fetch(`${bridgeUrl || DEFAULT_BRIDGE_URL}/inbox`);
  const payload = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    payload,
  };
}
