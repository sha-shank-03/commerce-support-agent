# Current release candidate - 13 September 2026

[Commerce](https://commerce-support-agent.vercel.app) now uses **GPT-5.6 Luna** in both the actual Railway investigator and the public console. Seven new, genuine Luna recordings work anonymously with no backend or model calls. Historical GPT-4.1 mini recordings remain accurately identified in Git history; they were not relabelled.

## Actual verification

- **39/40 Luna task cases (97.5%)**, above the agreed 90% gate.
- **40/40 persisted action-safety audits**: exact effects, rejection immutability and simulated-only receipts.
- One browser case stopped at an application RPC validation boundary. Its exact rejection reason was not retained. No action was proposed or executed. This failure remains in the score; no failed cases were retested.
- 176,218 input / 5,239 output tokens; estimated **$0.050418** for the evaluation set. Median 11.145 s, maximum 20.85 s end-to-end, including polling/tools and test decisions.
- 15 local Python tests and Go race tests passed. Schema generation and production build passed.
- **24 local offline browser checks** and **27 hosted browser checks** passed across Chromium, Firefox and WebKit. Hosted checks include real Luna execution, refresh, approval and telemetry.
- All 11 hosted static assets checked matched the reviewed local files byte for byte.
- Source/history/build secret scan found zero matches. Railway and Vercel build/runtime log scans found zero credential matches.

The user-requested migration preserved the Go authority, Agents SDK approval interruption, MCP catalogue, fixture-only browser tool, database, quotas and hosting controls. Reasoning is explicitly none to preserve the prior latency role. Old-model checkpoints require a new run. [Migration details and sources](MODEL_MIGRATION.md).

## Deployment and source

- Railway: 0d174695-b074-46fe-96fe-315d9aa32de6; backend source 7068172.
- Vercel production: dpl_CfteC2t8uLyEERBnUq3W3b4ybmcy.
- Verified frontend/replay source: dac03ce5bd12994980d76f1e1c6702d982601988.
- [Current Linux verification](https://github.com/sha-shank-03/commerce-support-agent/actions/runs/34763360421) passed, including PostgreSQL, schema/browser checks, dependency audits and Docker build. Complete CI logs also passed the credential scan; see model-log-audit.json.

Evaluation and browser-test invitations were revoked; existing reviewer files were not overwritten. No key was added to Vercel/GitHub, no provider spending cap was raised, and no unrelated repository/database was changed. The repository stays private on codex/initial-build. Public source release/licensing review and a release tag remain separate work. The combined $10/month target is a planning estimate, not a bill guarantee.
