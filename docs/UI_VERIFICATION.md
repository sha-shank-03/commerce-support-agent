# Connected console verification - 13 September 2026

## Story

A reviewer opens the system map, inspects integration boundaries, plays a genuine recorded run, and follows measured model calls through evidence and a human decision. An invited reviewer can also start a synthetic live run, refresh its persisted state and approve the exact result. Public browsing never needs a live backend.

## Verified boundaries

| Boundary | Actual evidence |
|---|---|
| UI and navigation | 24 offline checks passed locally across Chromium, Firefox and WebKit. System-map nodes, theme persistence, direct hash links, keyboard/mobile layouts, playback and future-output hiding were exercised. |
| Public deployment | https://commerce-support-agent.vercel.app is live with the new console. Public map, guide and replay checks block /api requests and pass without backend access. |
| Client to API | All three hosted browsers authenticated using temporary invitations and started real provider-backed runs. |
| API to database | Refresh before approval restored the persisted pending result; approval produced a bound simulated receipt. |
| Model to telemetry | 40/40 final evaluation cases checked call count, model, nonnegative measured durations, provider tokens and total estimated cost. |
| API response to UI | Per-call telemetry rendered in expanded trace entries. All 27 applicable hosted browser tests passed. No hosted browser tests were skipped. |
| Safety | No receipt before approval; replay cannot approve or execute. Existing isolation, digest and budget tests remain in the backend suite. All 40 persisted domain outcomes also passed the exact-action audit. |
| Assets | Seven genuine recordings expose observed MCP/browser and LLM events. |

## Failures and limitations retained

The initial refresh set was 39/40: one harness request failed with URLError. Only that case was rerun; the original attempt and rerun policy remain in the downloadable results/history. Final recorded-case usage estimate is $0.058996, excluding any unobserved usage from the failed request. This is not a provider invoice, a consecutive-run success rate or a production reliability claim.

Model output remains untrusted. Browser activity is limited to the application-owned carrier fixture; no actual customer account or payment service is connected.

A login/history race and an initial hash-navigation race exposed by WebKit were fixed and regression-tested. Missing historical timings are displayed as unavailable, not fabricated. The system map represents allowed architecture paths rather than a live traffic animation; replay advances at an explicitly illustrative event pace.

## Deployment provenance

- UI code commit: `e456b685c250091142f1c88afa9c009646f93c02`.
- Telemetry backend source: `e5e1283`; genuine replay manifests retain their full recording commit.
- Railway deployment: `7055c7d8-ab94-4d8d-ba6a-f66c72dfdd3f`.
- Vercel deployment: `dpl_6ugnEjAVyjqjz4XATE7Zu5nukNXu` (CLI upload of the tested working tree; the subsequent UI commit contains that source).
- Code CI: https://github.com/sha-shank-03/commerce-support-agent/actions/runs/34760379230.
- No key, model, prompt, budget, resource or repository visibility changes were part of this UI rollout.

Temporary test invitations are revoked after verification. The pre-existing reviewer invitation files were not overwritten. Backend sleeping, one-replica resource caps and existing readiness checks remain enabled. Public source publication and a verified release tag remain separate work.

## Final security and source check

Both Linux code CI pipelines passed, including PostgreSQL, schema generation, offline browser tests, dependency audits, secret scans and Docker builds. Railway build/runtime logs, Vercel build logs and complete CI logs were scanned for credential patterns and the known provider credential without printing raw data: zero matches. Non-secret scan evidence is in ui-log-audit.json. The hosted static recordings match their reviewed local files byte for byte.

Subsequent handoff commits are documentation-only and do not change the verified runtime source. No permissive licence was added and both GitHub repositories remain private.
