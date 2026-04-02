import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const HOST = process.env.EXTENSION_BRIDGE_HOST || "127.0.0.1";
const PORT = Number(process.env.EXTENSION_BRIDGE_PORT || 8765);
const DATA_DIR =
  process.env.CODEX_CLAUDE_BRIDGE_DIR ||
  "/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge";
const LATEST_CAPTURE_PATH = path.join(DATA_DIR, "latest-capture.json");
const LATEST_PICKED_PATH = path.join(DATA_DIR, "latest-picked-element.json");
const LATEST_HANDOFF_PATH = path.join(DATA_DIR, "latest-handoff.json");
const LATEST_ACTION_REQUEST_PATH = path.join(DATA_DIR, "latest-action-request.json");
const INBOX_PATH = path.join(DATA_DIR, "inbox.json");

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (req.method === "GET" && url.pathname === "/health") {
      return json(res, 200, { ok: true, dataDir: DATA_DIR });
    }

    if (req.method === "GET" && url.pathname === "/latest") {
      return sendFileJson(res, LATEST_CAPTURE_PATH);
    }

    if (req.method === "GET" && url.pathname === "/picked-element") {
      return sendFileJson(res, LATEST_PICKED_PATH);
    }

    if (req.method === "GET" && url.pathname === "/handoff") {
      return sendFileJson(res, LATEST_HANDOFF_PATH);
    }

    if (req.method === "GET" && url.pathname === "/action-request") {
      return sendFileJson(res, LATEST_ACTION_REQUEST_PATH);
    }

    if (req.method === "GET" && url.pathname === "/inbox") {
      return json(res, 200, await readInbox());
    }

    if (req.method === "POST" && (url.pathname === "/" || url.pathname === "/capture")) {
      const payload = await readJsonBody(req);
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        LATEST_CAPTURE_PATH,
        JSON.stringify(
          {
            receivedAt: new Date().toISOString(),
            payload,
          },
          null,
          2
        )
      );
      return json(res, 200, { ok: true, storedAt: LATEST_CAPTURE_PATH });
    }

    if (req.method === "POST" && url.pathname === "/picked-element") {
      const payload = await readJsonBody(req);
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        LATEST_PICKED_PATH,
        JSON.stringify(
          {
            receivedAt: new Date().toISOString(),
            payload,
          },
          null,
          2
        )
      );
      return json(res, 200, { ok: true, storedAt: LATEST_PICKED_PATH });
    }

    if (req.method === "POST" && url.pathname === "/handoff") {
      const payload = await readJsonBody(req);
      await fs.mkdir(DATA_DIR, { recursive: true });
      const record = {
        receivedAt: new Date().toISOString(),
        payload,
      };
      await fs.writeFile(LATEST_HANDOFF_PATH, JSON.stringify(record, null, 2));
      const inboxItem = await appendInboxItem("handoff", record);
      return json(res, 200, { ok: true, storedAt: LATEST_HANDOFF_PATH, inboxItem });
    }

    if (req.method === "POST" && url.pathname === "/action-request") {
      const payload = await readJsonBody(req);
      await fs.mkdir(DATA_DIR, { recursive: true });
      const record = {
        receivedAt: new Date().toISOString(),
        payload,
      };
      await fs.writeFile(LATEST_ACTION_REQUEST_PATH, JSON.stringify(record, null, 2));
      const inboxItem = await appendInboxItem("action_request", record);
      return json(res, 200, { ok: true, storedAt: LATEST_ACTION_REQUEST_PATH, inboxItem });
    }

    if (req.method === "POST" && url.pathname === "/inbox/complete") {
      const payload = await readJsonBody(req);
      const itemId = String(payload.itemId || "");
      if (!itemId) {
        return json(res, 400, { ok: false, error: "itemId is required" });
      }
      const updated = await markInboxItem(itemId, "completed");
      return json(res, 200, { ok: true, item: updated });
    }

    if (req.method === "POST" && url.pathname === "/inbox/claim") {
      const payload = await readJsonBody(req);
      const itemId = String(payload.itemId || "");
      if (!itemId) {
        return json(res, 400, { ok: false, error: "itemId is required" });
      }
      const updated = await markInboxItem(itemId, "claimed");
      return json(res, 200, { ok: true, item: updated });
    }

    if (req.method === "POST" && url.pathname === "/inbox/status") {
      const payload = await readJsonBody(req);
      const itemId = String(payload.itemId || "");
      const status = String(payload.status || "");
      if (!itemId) {
        return json(res, 400, { ok: false, error: "itemId is required" });
      }
      if (status !== "claimed" && status !== "completed" && status !== "failed" && status !== "pending") {
        return json(res, 400, { ok: false, error: "status must be claimed, completed, failed, or pending" });
      }
      const updated = await markInboxItem(itemId, status, payload.error);
      return json(res, 200, { ok: true, item: updated });
    }

    return json(res, 404, { ok: false, error: `Not found: ${req.method} ${url.pathname}` });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`extension-bridge listening on http://${HOST}:${PORT}`);
  console.log(`extension-bridge data dir ${DATA_DIR}`);
});

function json(res, status, data) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(data, null, 2));
}

async function sendFileJson(res, filePath) {
  try {
    const contents = await fs.readFile(filePath, "utf8");
    json(res, 200, JSON.parse(contents));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      json(res, 404, { ok: false, error: "No data has been captured yet." });
      return;
    }
    throw error;
  }
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8") || "{}";
  return JSON.parse(text);
}

async function readInbox() {
  try {
    const text = await fs.readFile(INBOX_PATH, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        ok: true,
        items: [],
      };
    }
    throw error;
  }
}

async function appendInboxItem(kind, record) {
  const inbox = await readInbox();
  const item = {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    status: "pending",
    createdAt: new Date().toISOString(),
    record,
  };
  const nextInbox = {
    ok: true,
    items: [item, ...(inbox.items || [])],
  };
  await fs.writeFile(INBOX_PATH, JSON.stringify(nextInbox, null, 2));
  return item;
}

async function markInboxItem(itemId, status, errorMessage) {
  const inbox = await readInbox();
  const items = (inbox.items || []).map((item) =>
    item.id === itemId
      ? {
          ...item,
          status,
          updatedAt: new Date().toISOString(),
          ...(status === "failed"
            ? {
                lastError: errorMessage || "Execution failed.",
              }
            : {}),
          ...(status === "pending"
            ? {
                retryCount: Number(item.retryCount || 0) + 1,
                lastError: undefined,
              }
            : {}),
        }
      : item
  );
  const updated = items.find((item) => item.id === itemId);
  if (!updated) {
    throw new Error(`Inbox item not found: ${itemId}`);
  }
  await fs.writeFile(
    INBOX_PATH,
    JSON.stringify(
      {
        ok: true,
        items,
      },
      null,
      2
    )
  );
  return updated;
}
