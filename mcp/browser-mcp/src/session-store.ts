import type { Page } from "playwright";

export type ConsoleEntry = {
  type: string;
  text: string;
  location?: string;
  timestamp: string;
};

export type NetworkEntry = {
  type: "request" | "response" | "requestfailed";
  method: string;
  url: string;
  status?: number;
  failureText?: string;
  timestamp: string;
};

export class SessionStore {
  private activePage: Page | null = null;
  private readonly consoleEntries = new WeakMap<Page, ConsoleEntry[]>();
  private readonly networkEntries = new WeakMap<Page, NetworkEntry[]>();

  setActivePage(page: Page): void {
    this.activePage = page;
    this.ensureConsoleTracking(page);
  }

  getActivePage(): Page | null {
    return this.activePage;
  }

  ensureConsoleTracking(page: Page): void {
    const alreadyTracked = this.consoleEntries.has(page) && this.networkEntries.has(page);
    if (alreadyTracked) {
      return;
    }

    this.consoleEntries.set(page, []);
    this.networkEntries.set(page, []);

    page.on("console", (message) => {
      const entries = this.consoleEntries.get(page);
      if (!entries) {
        return;
      }

      const location = message.location();
      entries.push({
        type: message.type(),
        text: message.text(),
        location:
          location.url && location.lineNumber !== undefined
            ? `${location.url}:${location.lineNumber}:${location.columnNumber ?? 0}`
            : undefined,
        timestamp: new Date().toISOString(),
      });

      if (entries.length > 200) {
        entries.splice(0, entries.length - 200);
      }
    });

    page.on("request", (request) => {
      this.pushNetworkEntry(page, {
        type: "request",
        method: request.method(),
        url: request.url(),
        timestamp: new Date().toISOString(),
      });
    });

    page.on("response", (response) => {
      this.pushNetworkEntry(page, {
        type: "response",
        method: response.request().method(),
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString(),
      });
    });

    page.on("requestfailed", (request) => {
      this.pushNetworkEntry(page, {
        type: "requestfailed",
        method: request.method(),
        url: request.url(),
        failureText: request.failure()?.errorText,
        timestamp: new Date().toISOString(),
      });
    });
  }

  getConsoleEntries(page: Page): ConsoleEntry[] {
    return [...(this.consoleEntries.get(page) ?? [])];
  }

  getNetworkEntries(page: Page): NetworkEntry[] {
    return [...(this.networkEntries.get(page) ?? [])];
  }

  private pushNetworkEntry(page: Page, entry: NetworkEntry): void {
    const entries = this.networkEntries.get(page);
    if (!entries) {
      return;
    }

    entries.push(entry);
    if (entries.length > 300) {
      entries.splice(0, entries.length - 300);
    }
  }
}
