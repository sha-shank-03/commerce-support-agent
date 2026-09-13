# Release candidate status - 13 September 2026

The redesigned [Commerce console](https://commerce-support-agent.vercel.app) is deployed. It opens on an interactive system map, with synchronized replay, state-aware next actions, an inspectable model/tool trail and a reviewer brief. Seven genuine recordings work anonymously without backend/model calls.

The current telemetry refresh passed 40/40 final workflow cases after one network-failed case was rerun; the initial 39/40 attempt remains available. Final-case model usage estimate: $0.058996, excluding unobserved failed-request usage. All 40 persisted outcomes passed the exact-action audit. Thirteen Python tests and Go domain/API/storage race tests passed. All 27 hosted browser checks passed in Chromium, Firefox and WebKit, including real investigation, refresh before approval and rendered model-call timing.

[Linux CI for the UI code](https://github.com/sha-shank-03/commerce-support-agent/actions/runs/34760379230) passed, including PostgreSQL, generated contracts, browser tests, dependency/secret checks and Docker build. Public replay isolation, mobile/keyboard behavior, theme persistence, direct navigation and future-result hiding have regression coverage.

The existing Go/GraphQL authority, supervised OpenAI Agents SDK subprocess, read-only MCP adapter and fixture-only browser integration remain intact. The model is gpt-4.1-mini. Models, prompts, credentials, budgets, hosting resources and repository visibility did not change during the UI rollout. Test invitations were revoked and reviewer invitation files were not overwritten.

Prior hosted restart, wrong-digest, idempotency, five-run allowance, reviewer isolation, revocation and live-disable checks are retained in hosting-verification.json. The portfolio PostgreSQL service remains private-network-only, with separate app databases/roles. Backend sleep settings and one-vCPU/1-GB caps remain enabled.

Both demos now have genuine public replay assets and verified invited workflows; Artwork uses GPT-5.6 Luna, so the historical Anthropic-credit blocker is no longer current. Both source repositories remain private on codex/initial-build with no verified release tag. The remaining separate publication work is the paired source/licensing review, merge/tag and deliberate visibility change. Existing direct CLI deployment remains the supported path. The $10/month target is not a guaranteed bill; see [UI verification](UI_VERIFICATION.md) and [hosting operations](HOSTING.md).
