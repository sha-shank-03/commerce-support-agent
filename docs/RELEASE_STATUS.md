# Release candidate status — 13 September 2026

Public static replay: https://commerce-support-agent.vercel.app

Seven genuine recorded OpenAI runs are available anonymously. Hosted Chromium, Firefox and WebKit checks passed with API requests blocked and only same-origin replay data fetched. Mobile sizing and keyboard navigation checks passed. Hosted live execution is explicitly disabled; no Railway backend/database has yet been provisioned for this project.

Local verification: the real-provider set passed 40/40 executions (estimated $0.060033 for that set). Thirteen Python protocol/tool unit tests passed. Go domain/API/storage race tests passed using a dedicated PostgreSQL database. Real invited refund approval and refresh tests passed on all three browsers. Python dependency scans reported no known vulnerabilities; the Go scan became clean after upgrading affected pgx/x/text versions.

Private GitHub branch: `codex/initial-build`. Initial CI caught nondeterministic GraphQL schema field ordering; code generation now sorts the schema. The corrected CI must complete successfully before release/tagging. No repository has been made public and no verified-release tag has been created.

Remaining gates: finish current Linux CI/container verification; confirm hosted-secret destinations; provision isolated Railway services/databases after cost checks; verify hosted invited workflows, revocation and live disable; finish final history/build/CI-log review; then merge/tag and change visibility. The paired artwork project's Anthropic live evaluation remains blocked by API credit. Neither project is being represented as fully delivered.
