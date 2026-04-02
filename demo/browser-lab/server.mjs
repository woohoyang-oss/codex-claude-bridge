import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const HOST = process.env.BROWSER_LAB_HOST || "127.0.0.1";
const PORT = Number(process.env.BROWSER_LAB_PORT || 4173);
const ROOT = "/Users/wooho/Documents/Playground/demo/browser-lab";

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const filePath = url.pathname === "/" ? path.join(ROOT, "index.html") : path.join(ROOT, url.pathname);

  try {
    const contents = await fs.readFile(filePath);
    const contentType = filePath.endsWith(".html") ? "text/html; charset=utf-8" : "text/plain; charset=utf-8";
    res.writeHead(200, { "content-type": contentType });
    res.end(contents);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`browser-lab listening on http://${HOST}:${PORT}`);
});
