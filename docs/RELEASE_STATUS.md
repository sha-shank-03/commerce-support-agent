# Release candidate status — 13 September 2026

Public static replay: https://commerce-support-agent.vercel.app

Seven genuine recorded OpenAI runs are available anonymously. Hosted Chromium, Firefox and WebKit checks passed with API requests blocked and only same-origin replay data fetched. Mobile sizing and keyboard navigation checks passed. Hosted live execution is explicitly disabled; no Railway backend/database has yet been provisioned for this project.

Local verification: the final backend build's real-provider set passed 40/40 executions (estimated $0.059339 for that set), followed by a 40/40 exact-action audit of persisted amounts, addresses, decisions and simulated-only effects. Thirteen Python protocol/tool unit tests passed. Go domain/API/storage race tests passed using a dedicated PostgreSQL database. Real invited refund approval and refresh tests passed on all three browsers. Python dependency scans reported no known vulnerabilities; the Go scan became clean after upgrading affected pgx/x/text versions.

Private GitHub branch: `codex/initial-build`. Initial CI caught nondeterministic GraphQL schema field ordering; code generation now sorts the schema. Corrected Linux CI passed, including Docker builds and all offline checks ([verified application commit](https://github.com/sha-shank-03/commerce-support-agent/actions/runs/34739631047)). Complete CI logs were scanned without exposing credentials; no credential-pattern matches were found. No repository has been made public and no verified-release tag has been created.

Remaining gates: confirm hosted-secret destinations; provision isolated Railway services/databases after cost checks; verify hosted invited workflows, revocation and live disable; finish final publication review; then merge/tag and change visibility. The paired artwork project's Anthropic live evaluation remains blocked by API credit. Neither project is being represented as fully delivered.
