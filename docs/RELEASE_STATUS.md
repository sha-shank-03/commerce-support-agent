# Public release v0.1.0 - 13 September 2026

The [repository](https://github.com/sha-shank-03/commerce-support-agent) is public, with `main` as the default branch and a verified `v0.1.0` release. Both the system map and recorded-run UI screenshots are embedded in the README. The companion [Artwork Proof Agent](https://github.com/sha-shank-03/artwork-proof-agent) is public too. Original code ownership is retained; no permissive licence was added.

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
- Vercel production: dpl_2tFX6PDbFxwrzfWajfYKPrVLuQwv, READY, static Vite frontend.
- Verified publication UI/source: 334c4708d7dc6a39059ede35359f0cabe82e43d6. Subsequent audit/handoff commits are documentation-only.
- Genuine replay content remains from the reviewed Luna release, dac03ce5bd12994980d76f1e1c6702d982601988; publication did not alter model reports or evaluation scores.
- [Final Linux verification](https://github.com/sha-shank-03/commerce-support-agent/actions/runs/34764974074) passed, including PostgreSQL, Go race/Python tests, schema/browser checks, dependency audits and Docker build.

## Publication checks

- A fresh **24/24 hosted non-billed browser checks** passed on the publication deployment in Chromium, Firefox and WebKit. The three paid live checks were intentionally not repeated for documentation/source-link-only changes; the 27-check live verification above remains the evidence for the unchanged backend.
- Complete Git blob history, working files and build assets passed both the repository scanner and exact-approved-credential scan. All **12 available completed CI runs**, including the historical failed run, had zero credential matches. GitHub reported no uploaded workflow artifacts. [Audit record](publication-audit.json).
- Current Railway/Vercel build/runtime logs had zero credential matches. [Runtime log audit](publication-runtime-audit.json). Browser checks reported no page errors. The static frontend has no model-serving functions; no new log drains or keep-alive monitoring were enabled.
- [Dependency/asset review](LICENSE_REVIEW.md) and deployed browser licence notices are included. Screenshots contain only synthetic recorded data, no invitations or session values.
- The console now links to public source. README evaluation wording was corrected to distinguish **39 task successes** from **40 safe-action audits**.

Evaluation and browser-test invitations were revoked; existing reviewer files were not overwritten. No key was added to Vercel/GitHub, no provider spending cap was raised, and no unrelated repository/database was changed. Invite-only hosted execution remains enabled with the existing controls. See [local setup](../README.md), [invite/revoke and disable-live commands](HOSTING.md), and [operations](OPERATIONS.md). The combined $10/month target is a planning estimate, not a bill guarantee; actual monthly hosting spend still needs observation.
