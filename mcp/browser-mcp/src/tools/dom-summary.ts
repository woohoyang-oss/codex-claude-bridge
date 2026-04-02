import type { ChromeManager } from "../chrome.js";

export async function getDomSummary(manager: ChromeManager) {
  const page = await manager.getActivePage();

  const summary = await page.evaluate(() => {
    const text = (value: string | null | undefined) => (value ?? "").trim();
    const limited = (values: string[]) => values.filter(Boolean).slice(0, 12);

    const headings = limited(
      Array.from(document.querySelectorAll("h1, h2, h3"))
        .map((el) => text(el.textContent))
    );

    const buttons = limited(
      Array.from(document.querySelectorAll("button, [role='button'], input[type='submit']"))
        .map((el) => text((el as HTMLInputElement).value || el.textContent))
    );

    const links = limited(
      Array.from(document.querySelectorAll("a"))
        .map((el) => text(el.textContent))
    );

    const inputs = Array.from(document.querySelectorAll("input, textarea, select"))
      .slice(0, 12)
      .map((el) => {
        const input = el as HTMLInputElement;
        return {
          tag: el.tagName.toLowerCase(),
          type: input.type || null,
          name: input.name || null,
          placeholder: input.placeholder || null,
          ariaLabel: el.getAttribute("aria-label"),
        };
      });

    return {
      title: document.title,
      url: window.location.href,
      headings,
      buttons,
      links,
      inputs,
    };
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(summary, null, 2),
      },
    ],
  };
}
