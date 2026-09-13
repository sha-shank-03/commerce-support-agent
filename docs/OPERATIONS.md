# Operations and release status

This repository is a release candidate, not a claim that all hosted acceptance checks are complete. See the task handoff for current URLs and deployment status.

## Cost and access

Defaults: 7-day invitation, 5 runs; 24-hour session (never longer than the invitation); 24-hour approval; 2 concurrent runs; 8 total model calls; $0.25 estimated/run; $2.50/month OpenAI usage including evaluations. Only the reviewed `gpt-5.6-luna` price configuration is accepted. Pricing is conservative for cached tokens and stored in integer micro-USD. All replicas share the same locked ledger. Do not deploy against separate budget databases to evade the limit.

Set `LIVE_ENABLED=false` and redeploy to disable new live investigations and approvals. Existing in-flight provider calls may finish; cancellation revokes tool authority immediately. `bin/server -invite` issues a token into `.local/invite.txt`; distribute it privately. `bin/server -revoke INVITATION_ID` revokes both future exchanges and existing sessions. The server-side database URL is required for both commands. Provider keys must remain in local ignored files or Railway secrets, never Vercel frontend variables.

## Hosting target

Vercel serves the static `web/dist` build. The new `agentic-portfolio` Railway project contains this backend, the artwork backend and portfolio-only PostgreSQL, using **separate databases and distinct least-privilege roles**. Database access is private-network-only; administrators use Railway SSH. Cross-database CONNECT privileges were tested and denied. The Vercel `/api/:path*` rewrite is verified. `ALLOWED_ORIGIN` is the exact frontend origin and cookies are Secure/HttpOnly. See [deployment commands](HOSTING.md).

Before hosted live testing, $0.213149 of prior local implementation/evaluation usage was carried into the September 2026 hosted OpenAI ledger. The local live server is stopped. Do not restart independent local live evaluation against a separate ledger without reconciling usage first.

The account check found an existing Railway Pro plan and active Vercel Hobby plan. No plan upgrade is required for static portfolio hosting. The existing Railway allowance is shared with other projects; it is not free incremental capacity. Planning assumptions: approximately 0.15–0.30 GB baseline PostgreSQL memory, mostly sleeping or small idle backends, small storage and low traffic. At published usage rates, staying around $5/month infrastructure may be feasible but must be checked with actual deployed metrics. Combined model allowance adds at most $5/month by application estimates. **$10/month is a target, not a guaranteed bill.** Enable serverless sleeping where supported and do not configure uptime pings. If measured hosting exceeds the target, keep the replay static and live execution local.

## Release checklist

- All Go/Python deterministic safety tests and race tests pass against dedicated PostgreSQL.
- All 40 real-provider cases executed; at least 90% task success; no failed safety invariant.
- Browser checks pass in Chromium, Firefox, WebKit, including an API-blocked public replay, mobile sizing, keyboard entry, real approval and refresh.
- Dependency advisories resolved; Docker build and Linux behavior verified in CI.
- Complete history, tracked files, build output and CI logs scanned for secrets; dependency and asset licences reviewed.
- No private provider data/checkpoints/session tokens in replay files; recording commit/prompt/model/date remain accurate.
- Hosted invite flow and rollback/live-disable controls verified before marking hosting complete.
- Merge and tag only verified code; make this new repository public only after the release gates pass. Do not change visibility of any pre-existing repository.
