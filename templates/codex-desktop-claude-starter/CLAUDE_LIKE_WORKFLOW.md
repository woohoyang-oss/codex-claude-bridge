# Claude-Like Workflow In Codex Desktop

Use this checklist when you want Codex to feel more like a browser-connected Claude workflow.

## 1. Give the workspace rules

- Add `AGENTS.md` at the repo root.
- Keep it focused on execution style, review style, and tool expectations.

## 2. Turn repeated tasks into skills

- Create one skill per repeatable workflow.
- Keep each skill narrow and outcome-driven.
- Prefer examples and concrete steps over abstract philosophy.

## 3. Connect the right tools

- Add browser control through MCP when browser state matters.
- Keep setup scripts simple so the environment starts the same way every time.

## 4. Use short operational loops

The default loop should be:

1. inspect
2. implement
3. verify
4. summarize

That loop is what makes the environment feel agentic instead of chat-like.
