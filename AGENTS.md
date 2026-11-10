# Hanger agent instructions

- Keep changes focused; follow nearby code and avoid adding dependencies without approval.
- Minimize context and token use on every task: inspect narrowly, reuse project/MCP knowledge, load skills only when relevant, and avoid repeated or oversized output. Never trade correctness or necessary verification for token savings.
- When a useful process or lookup is likely to recur, capture it in a runnable script or reusable skill/resource instead of repeating manual steps. Keep one-off work simple; don't automate without a clear repeat-use benefit.
- For Laravel PHP work, use the `laravel-best-practices` skill. For tests, use `testing-best-practices`; for Tailwind UI, use `tailwindcss-development`.
- Use Laravel Boost MCP when relevant: search docs before version-sensitive Laravel changes, inspect schema before migrations, and use database queries only for read-only inspection. Its server is already configured in `.mcp.json`.
- Run focused checks with `./scripts/verify.sh backend <test-file-or-filter>`, `./scripts/verify.sh frontend`, or `./scripts/verify.sh browser`; `./scripts/verify.sh all` runs the full suite, build, and browser flow.
- After PHP edits, run `vendor/bin/pint --dirty --format agent`. This project uses PHPUnit; prefer `php artisan test --compact` for focused tests.
- Don't create documentation unless requested; update directly related docs when behavior or workflows change.
