# Live evaluation report

## UI telemetry refresh - 13 September 2026

The refreshed set initially passed 39/40; one harness request failed with URLError. Only that failed case was rerun, and the final per-case outcome is 40/40. The original attempt and exact rerun IDs are retained in evaluation-history.json and the retryNotice field of evaluation-results.json. No failed attempt was silently relabelled.

Final recorded-case model usage totals $0.058996. This excludes any unobserved usage from the network-failed attempt; the database spending ledger retains reservations/settlements. Model-call duration and token/cost metadata were graded against persisted run totals. Public recordings now carry genuine per-call telemetry.

Actual result: **40/40** executions passed on commit `e5e1283f355d3f4199997a11a9f4462627192860`.

Model: `gpt-4.1-mini`. Prompt: `commerce-v2`. There are seven business scenarios, with repeated executions and alternating approval/rejection decisions—not forty distinct workflows.

Total model usage charged by the application: **$0.058996** for this set. Median end-to-end latency: **8.45s**; maximum: **16.87s**. Latency includes API polling and reviewer decisions made by the test harness. Cached input is conservatively priced at the uncached rate; this is an application estimate, not a provider invoice.

The deterministic graders check terminal/pause state, no pre-approval receipt, appropriate evidence, MCP use when an order is available, browser evidence for the carrier-fallback case, budget/turn limits, approval/rejection outcome and receipt idempotency. They do **not** prove every sentence is semantically correct. Human review remains necessary.

## Failures found and fixed

Earlier runs found a model asking for consent in prose instead of invoking the SDK approval gate, unsupported evidence IDs, a mistyped action digest, and a rejected address change incorrectly reported as awaiting input. The prompt now describes the SDK interruption explicitly; final citations are schema-bound and checked against retrieved evidence; application code carries the digest; rejection is a terminal decision. The first full set passed 32/40. The missing-order grader was also corrected: asking for an identifier without querying an unknown order is legitimate, not a missing-MCP failure. The full set was rerun, not selectively relabelled.

See `evaluation-results.json` for per-case latency, token usage, IDs and checks; `evaluation-history.json` retains earlier outcomes. Provider failures are never substituted with fabricated output. Integration/safety/browser tests are separate gates.
