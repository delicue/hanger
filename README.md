# Hanger

Hanger is an idea workspace: a place to collect project thoughts, media, links, and visual references on flexible canvases, then pick up where you left off.

## Development checks

Run the relevant checks without loading a long command recipe into each prompt:

```bash
./scripts/verify.sh backend tests/Feature/HomePageTest.php
./scripts/verify.sh backend --filter=test_name
./scripts/verify.sh frontend
./scripts/verify.sh browser
./scripts/verify.sh all
```

The browser check uses the local Herd site at `http://hanger.test`. Install its browser once with `npx playwright install chromium` if needed. Override the target with `HANGER_URL`. `all` includes the browser check.

## AI-assisted development

- Root `AGENTS.md` contains short, always-relevant project guidance.
- `.github/skills/hanger-workflow/` contains the on-demand Hanger workflow.
- Laravel Boost MCP is already configured in `.mcp.json`; use its documentation, schema, and diagnostics tools when relevant rather than copying reference material into prompts.

Token quotas depend on the active Copilot plan and cannot be guaranteed by repository configuration. These files keep repeated project context concise and load specialized guidance only when needed.
