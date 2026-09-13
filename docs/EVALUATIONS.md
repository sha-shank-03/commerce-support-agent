# Live evaluation report

Actual result: **40/40** executions passed on commit `6a5e23f4e4a715d305a9f35cdb01e8eec8c8ad99`.

Model: `gpt-4.1-mini`. Prompt: `commerce-v2`. There are seven business scenarios, with repeated executions and alternating approval/rejection decisions—not forty distinct workflows.

Total model usage charged by the application: **$0.060033** for this set. Median end-to-end latency: **6.33s**; maximum: **9.47s**. Latency includes API polling and reviewer decisions made by the test harness. Cached input is conservatively priced at the uncached rate; this is an application estimate, not a provider invoice.

The deterministic graders check terminal/pause state, no pre-approval receipt, appropriate evidence, MCP use when an order is available, browser evidence for the carrier-fallback case, budget/turn limits, approval/rejection outcome and receipt idempotency. They do **not** prove every sentence is semantically correct. Human review remains necessary.

## Failures found and fixed

Earlier runs found a model asking for consent in prose instead of invoking the SDK approval gate, unsupported evidence IDs, a mistyped action digest, and a rejected address change incorrectly reported as awaiting input. The prompt now describes the SDK interruption explicitly; final citations are schema-bound and checked against retrieved evidence; application code carries the digest; rejection is a terminal decision. The first full set passed 32/40. The missing-order grader was also corrected: asking for an identifier without querying an unknown order is legitimate, not a missing-MCP failure. The full set was rerun, not selectively relabelled.

See `evaluation-results.json` for per-case latency, token usage, IDs and checks; `evaluation-history.json` retains earlier outcomes. Provider failures are never substituted with fabricated output. Integration/safety/browser tests are separate gates.
