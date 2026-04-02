# Extension Bridge

Local bridge service for the Chrome extension.

## Purpose

- receive captured page context from the extension
- receive picked-element payloads from the extension
- persist the latest browser-native handoff data locally
- append handoff and action requests into a lightweight local inbox queue
- let `browser-mcp` read the latest extension context without talking directly to Chrome extension APIs

## Run

```bash
cd /Users/wooho/Documents/Playground/bridge/extension-bridge
node server.mjs
```

Default address:

```text
http://127.0.0.1:8765
```

Default data directory:

```text
/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge
```

## Endpoints

- `GET /health`
- `GET /latest`
- `GET /picked-element`
- `GET /handoff`
- `GET /action-request`
- `GET /inbox`
- `POST /`
- `POST /capture`
- `POST /picked-element`
- `POST /handoff`
- `POST /action-request`
- `POST /inbox/claim`
- `POST /inbox/complete`

## Stored files

- `latest-capture.json`
- `latest-picked-element.json`
- `latest-handoff.json`
- `latest-action-request.json`
- `inbox.json`
