# Live evaluation report

Actual result: **39/40** executions passed on commit `2b9fc8b3747aa184bb0c9b86e3fb3fbc7a8c667f`.

Model: `gpt-5.6-luna`. Prompt: `commerce-v2`. There are seven business scenarios, with repeated executions and alternating approval/rejection decisions—not forty distinct workflows.

Total model usage charged by the application: **$0.050418** for this set. Median end-to-end latency: **11.14s**; maximum: **20.85s**. Latency includes API polling and reviewer decisions made by the test harness. Input is conservatively priced at the cache-write ceiling; this is an application estimate, not a provider invoice.

The deterministic graders check terminal/pause state, no pre-approval receipt, appropriate evidence, MCP use when an order is available, browser evidence for the carrier-fallback case, budget/turn limits, approval/rejection outcome and receipt idempotency. They do **not** prove every sentence is semantically correct. Human review remains necessary.

## Failures found and fixed

Earlier runs found a model asking for consent in prose instead of invoking the SDK approval gate, unsupported evidence IDs, a mistyped action digest, and a rejected address change incorrectly reported as awaiting input. The prompt now describes the SDK interruption explicitly; final citations are schema-bound and checked against retrieved evidence; application code carries the digest; rejection is a terminal decision. The first full set passed 32/40. The missing-order grader was also corrected: asking for an identifier without querying an unknown order is legitimate, not a missing-MCP failure. The full set was rerun, not selectively relabelled.

See `evaluation-results.json` for per-case latency, token usage, IDs and checks; `evaluation-history.json` retains earlier outcomes. Provider failures are never substituted with fabricated output. Integration/safety/browser tests are separate gates.
