# Browser Debug

Use this skill when the task requires inspecting a live page instead of reasoning from code alone.

## Goals

- reproduce the issue in a real browser
- collect screenshots, console logs, network logs, and DOM evidence
- convert findings into concrete fixes or assertions

## Workflow

1. Open or attach to the target page.
2. Capture a screenshot before changing anything.
3. Inspect console and network logs.
4. Read the relevant DOM or visible text.
5. Only then suggest or implement a fix.
6. Re-run the browser check after the change.

## Output

- short root-cause summary
- one or two concrete observations from the page
- verification result after the fix
