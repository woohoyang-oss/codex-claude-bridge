import type { ChromeManager } from "../chrome.js";
import type { SessionStore } from "../session-store.js";
import { assertText } from "./assert-text.js";
import { assertVisible } from "./assert-visible.js";
import { click } from "./click.js";
import { getConsoleLogs } from "./console-logs.js";
import { getDomSummary } from "./dom-summary.js";
import { evalInPage } from "./eval.js";
import { navigate } from "./navigate.js";
import { getNetworkLogs } from "./network-logs.js";
import { press } from "./press.js";
import { screenshot } from "./screenshot.js";
import { scroll } from "./scroll.js";
import { typeText } from "./type.js";
import { waitFor } from "./wait-for.js";

export type TestFlowStep =
  | { action: "navigate"; url: string }
  | { action: "wait_for"; selector?: string; text?: string; timeoutMs?: number }
  | { action: "click"; selector: string }
  | { action: "type"; selector: string; text: string; clearFirst?: boolean }
  | { action: "press"; key: string }
  | { action: "scroll"; x?: number; y?: number }
  | { action: "assert_text"; text: string; timeoutMs?: number }
  | { action: "assert_visible"; selector: string; timeoutMs?: number }
  | { action: "eval"; expression: string }
  | { action: "screenshot"; outputPath?: string; fullPage?: boolean }
  | { action: "dom_summary" }
  | { action: "console_logs" }
  | { action: "network_logs" };

export async function runTestFlow(
  manager: ChromeManager,
  sessions: SessionStore,
  args: { steps: TestFlowStep[] }
) {
  const results: Array<{ step: TestFlowStep; result: unknown }> = [];

  for (const step of args.steps) {
    switch (step.action) {
      case "navigate":
        results.push({ step, result: await navigate(manager, { url: step.url }) });
        break;
      case "wait_for":
        results.push({
          step,
          result: await waitFor(manager, {
            selector: step.selector,
            text: step.text,
            timeoutMs: step.timeoutMs,
          }),
        });
        break;
      case "click":
        results.push({ step, result: await click(manager, { selector: step.selector }) });
        break;
      case "type":
        results.push({
          step,
          result: await typeText(manager, {
            selector: step.selector,
            text: step.text,
            clearFirst: step.clearFirst,
          }),
        });
        break;
      case "press":
        results.push({ step, result: await press(manager, { key: step.key }) });
        break;
      case "scroll":
        results.push({ step, result: await scroll(manager, { x: step.x, y: step.y }) });
        break;
      case "assert_text":
        results.push({
          step,
          result: await assertText(manager, { text: step.text, timeoutMs: step.timeoutMs }),
        });
        break;
      case "assert_visible":
        results.push({
          step,
          result: await assertVisible(manager, { selector: step.selector, timeoutMs: step.timeoutMs }),
        });
        break;
      case "eval":
        results.push({ step, result: await evalInPage(manager, { expression: step.expression }) });
        break;
      case "screenshot":
        results.push({
          step,
          result: await screenshot(manager, {
            outputPath: step.outputPath,
            fullPage: step.fullPage,
          }),
        });
        break;
      case "dom_summary":
        results.push({ step, result: await getDomSummary(manager) });
        break;
      case "console_logs":
        results.push({ step, result: await getConsoleLogs(manager, sessions) });
        break;
      case "network_logs":
        results.push({ step, result: await getNetworkLogs(manager, sessions) });
        break;
      default:
        throw new Error(`Unsupported test flow action: ${(step as { action: string }).action}`);
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            status: "flow_completed",
            stepsRun: results.length,
            results,
          },
          null,
          2
        ),
      },
    ],
  };
}
