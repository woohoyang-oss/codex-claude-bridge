import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { SessionStore } from "./session-store.js";

const DEFAULT_CDP_URL = process.env.BROWSER_MCP_CDP_URL ?? "http://127.0.0.1:9222";
const DEFAULT_USER_DATA_DIR = process.env.BROWSER_MCP_CHROME_PROFILE ?? path.join(os.tmpdir(), "browser-mcp-chrome");

export class ChromeManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private launchedProcess: ChildProcess | null = null;

  constructor(private readonly sessions: SessionStore) {}

  async ensureConnected(): Promise<void> {
    if (this.browser?.isConnected() && this.context) {
      return;
    }

    try {
      await this.connect();
      return;
    } catch (error) {
      if (!this.shouldAutoLaunch()) {
        throw new Error(this.connectionHelp(error));
      }
    }

    await this.launchChrome();
    await this.connect();
  }

  async listPages(): Promise<Page[]> {
    await this.ensureConnected();
    return this.context?.pages() ?? [];
  }

  async getActivePage(): Promise<Page> {
    await this.ensureConnected();

    const current = this.sessions.getActivePage();
    if (current && !current.isClosed()) {
      return current;
    }

    const pages = this.context?.pages() ?? [];
    if (pages.length > 0) {
      const page = pages[0];
      this.sessions.setActivePage(page);
      return page;
    }

    const page = await this.context!.newPage();
    this.sessions.setActivePage(page);
    return page;
  }

  async selectPage(tabId: number): Promise<Page> {
    const pages = await this.listPages();
    const page = pages[tabId];

    if (!page) {
      throw new Error(`Tab ${tabId} was not found. Open tabs: ${pages.length}`);
    }

    this.sessions.setActivePage(page);
    return page;
  }

  async navigate(url: string): Promise<Page> {
    const page = await this.getActivePage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    this.sessions.setActivePage(page);
    return page;
  }

  private async connect(): Promise<void> {
    this.browser = await chromium.connectOverCDP(DEFAULT_CDP_URL);
    const contexts = this.browser.contexts();
    this.context = contexts[0] ?? (await this.browser.newContext());

    for (const page of this.context.pages()) {
      this.sessions.ensureConsoleTracking(page);
    }
  }

  private shouldAutoLaunch(): boolean {
    return process.env.BROWSER_MCP_AUTO_LAUNCH === "1";
  }

  private async launchChrome(): Promise<void> {
    const executable = findChromeExecutable();
    if (!executable) {
      throw new Error(
        "Chrome was not found automatically. Launch Chrome manually with --remote-debugging-port=9222 or set BROWSER_MCP_AUTO_LAUNCH=0 and BROWSER_MCP_CDP_URL."
      );
    }

    this.launchedProcess = spawn(
      executable,
      [`--remote-debugging-port=9222`, `--user-data-dir=${DEFAULT_USER_DATA_DIR}`],
      {
        detached: true,
        stdio: "ignore",
      }
    );

    this.launchedProcess.unref();
    await sleep(1500);
  }

  private connectionHelp(error: unknown): string {
    const reason = error instanceof Error ? error.message : String(error);
    return [
      `Unable to connect to Chrome CDP at ${DEFAULT_CDP_URL}.`,
      `Reason: ${reason}`,
      `Start Chrome with ./launch-chrome-debug.sh or set BROWSER_MCP_AUTO_LAUNCH=1.`,
    ].join(" ");
  }
}

function findChromeExecutable(): string | null {
  const candidates = [
    process.env.BROWSER_MCP_CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
