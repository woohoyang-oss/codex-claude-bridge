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
      await fs.writeFile(
        LATEST_HANDOFF_PATH,
        JSON.stringify(
          {
            receivedAt: new Date().toISOString(),
            payload,
          },
          null,
          2
        )
      );
      return json(res, 200, { ok: true, storedAt: LATEST_HANDOFF_PATH });
    }

    if (req.method === "POST" && url.pathname === "/action-request") {
      const payload = await readJsonBody(req);
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(
        LATEST_ACTION_REQUEST_PATH,
        JSON.stringify(
          {
            receivedAt: new Date().toISOString(),
            payload,
          },
          null,
          2
        )
      );
      return json(res, 200, { ok: true, storedAt: LATEST_ACTION_REQUEST_PATH });
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
