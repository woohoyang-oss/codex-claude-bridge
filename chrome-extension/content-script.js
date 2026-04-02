let pickerActive = false;
let hoverOverlay = null;
let lastHoveredElement = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void handleMessage(message)
    .then((result) => sendResponse(result))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })
    );
  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case "bridge:capture-page":
      return capturePageContext();
    case "bridge:start-picker":
      startPicker();
      return { ok: true };
    case "bridge:stop-picker":
      stopPicker();
      return { ok: true };
    default:
      return { ok: false, error: `Unknown content-script message: ${message?.type ?? "undefined"}` };
  }
}

async function capturePageContext() {
  const payload = {
    title: document.title,
    url: location.href,
    selection: String(window.getSelection() || "").trim() || null,
    headings: collectText("h1, h2, h3"),
    buttons: collectText("button, [role='button'], input[type='submit']"),
    links: collectLinks(),
    forms: collectForms(),
    visibleTextSample: document.body?.innerText?.trim().slice(0, 4000) ?? "",
  };

  await chrome.runtime.sendMessage({
    type: "bridge:capture-result",
    payload,
  });

  return { ok: true, payload };
}

function collectText(selector) {
  return Array.from(document.querySelectorAll(selector))
    .map((node) => (node.textContent || node.value || "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

function collectLinks() {
  return Array.from(document.querySelectorAll("a"))
    .map((node) => ({
      text: (node.textContent || "").trim(),
      href: node.href || null,
    }))
    .filter((item) => item.text || item.href)
    .slice(0, 20);
}

function collectForms() {
  return Array.from(document.querySelectorAll("input, textarea, select"))
    .map((node) => ({
      tag: node.tagName.toLowerCase(),
      type: node.type || null,
      name: node.name || null,
      placeholder: node.placeholder || null,
      ariaLabel: node.getAttribute("aria-label"),
    }))
    .slice(0, 20);
}

function startPicker() {
  if (pickerActive) {
    return;
  }
  pickerActive = true;
  ensureOverlay();
  document.addEventListener("mousemove", onPointerMove, true);
  document.addEventListener("click", onPickerClick, true);
  document.addEventListener("keydown", onPickerKeydown, true);
}

function stopPicker() {
  if (!pickerActive) {
    return;
  }
  pickerActive = false;
  document.removeEventListener("mousemove", onPointerMove, true);
  document.removeEventListener("click", onPickerClick, true);
  document.removeEventListener("keydown", onPickerKeydown, true);
  if (hoverOverlay) {
    hoverOverlay.style.display = "none";
  }
}

function onPointerMove(event) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (!element || element === hoverOverlay) {
    return;
  }
  lastHoveredElement = element;
  const rect = element.getBoundingClientRect();
  hoverOverlay.style.display = "block";
  hoverOverlay.style.left = `${rect.left + window.scrollX}px`;
  hoverOverlay.style.top = `${rect.top + window.scrollY}px`;
  hoverOverlay.style.width = `${rect.width}px`;
  hoverOverlay.style.height = `${rect.height}px`;
}

async function onPickerClick(event) {
  if (!pickerActive) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const element = lastHoveredElement || event.target;
  if (!(element instanceof Element)) {
    stopPicker();
    return;
  }

  const payload = {
    selector: buildSelector(element),
    tag: element.tagName.toLowerCase(),
    text: (element.textContent || "").trim().slice(0, 500),
    url: location.href,
  };

  await chrome.runtime.sendMessage({
    type: "bridge:picked-element",
    payload,
  });

  stopPicker();
}

function onPickerKeydown(event) {
  if (event.key === "Escape") {
    stopPicker();
  }
}

function ensureOverlay() {
  if (hoverOverlay) {
    return;
  }
  hoverOverlay = document.createElement("div");
  hoverOverlay.style.position = "absolute";
  hoverOverlay.style.pointerEvents = "none";
  hoverOverlay.style.zIndex = "2147483647";
  hoverOverlay.style.border = "2px solid #ff6a00";
  hoverOverlay.style.background = "rgba(255, 106, 0, 0.08)";
  hoverOverlay.style.display = "none";
  document.documentElement.appendChild(hoverOverlay);
}

function buildSelector(element) {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  const parts = [];
  let current = element;
  while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 5) {
    let selector = current.tagName.toLowerCase();
    if (current.classList.length > 0) {
      selector += `.${Array.from(current.classList).slice(0, 2).map((name) => CSS.escape(name)).join(".")}`;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((node) => node.tagName === current.tagName);
      if (siblings.length > 1) {
        selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(" > ");
}
