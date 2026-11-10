---
name: hanger-workflow
description: "Use when building, testing, or debugging Hanger features, including ideas, canvases, authentication, and project UI. Applies this repository's efficient Laravel, MCP, and verification workflow."
---

# Hanger workflow

1. Read only the files and tests relevant to the requested change. Follow local patterns; avoid speculative features and new dependencies. If a useful process or lookup is likely to recur, make it a runnable script or reusable skill resource rather than repeating manual work; don't automate one-offs.
2. Load `laravel-best-practices`, `testing-best-practices`, or `tailwindcss-development` only when the change touches those areas.
3. Use the configured Laravel Boost MCP tools when useful: `search-docs` for version-sensitive APIs, `database-schema` before schema changes, read-only `database-query` for data inspection, and `browser-logs` for recent frontend errors. Do not duplicate the existing `.mcp.json` setup.
4. Verify the smallest relevant scope:
   - `./scripts/verify.sh backend tests/Feature/HomePageTest.php`
   - `./scripts/verify.sh backend --filter=test_name`
   - `./scripts/verify.sh frontend`
   - `./scripts/verify.sh browser` for dashboard/canvas interactions (requires Herd at `http://hanger.test`)
   - `./scripts/verify.sh all` for the full backend, build, and browser checks
   - `./scripts/verify.sh all` before a broad handoff
5. After PHP edits, run `vendor/bin/pint --dirty --format agent`.

Keep reusable project context in `AGENTS.md`; keep feature-specific procedures here so they load only when needed. Usage quotas depend on the active Copilot plan and cannot be guaranteed by repository files.
