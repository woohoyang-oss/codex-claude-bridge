import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR =
  process.env.CODEX_CLAUDE_BRIDGE_DIR ||
  "/Users/wooho/Documents/Playground/.runtime/codex-claude-bridge";
const LATEST_CAPTURE_PATH = path.join(DATA_DIR, "latest-capture.json");
const LATEST_PICKED_PATH = path.join(DATA_DIR, "latest-picked-element.json");
const LATEST_HANDOFF_PATH = path.join(DATA_DIR, "latest-handoff.json");

export async function getExtensionCapture() {
  const data = await readLatestExtensionCapture();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export async function getPickedElement() {
  const data = await readLatestPickedElement();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export async function getLatestHandoff() {
  const data = await readLatestHandoff();
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export async function readLatestExtensionCapture() {
  return readJson(LATEST_CAPTURE_PATH);
}

export async function readLatestPickedElement() {
  return readJson(LATEST_PICKED_PATH);
}

export async function readLatestHandoff() {
  return readJson(LATEST_HANDOFF_PATH);
}

async function readJson(filePath: string) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        ok: false,
        error: `No data found at ${filePath}`,
      };
    }
    throw error;
  }
}
