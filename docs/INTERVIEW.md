# Five-minute walkthrough and interview guide

1. Open a recorded damaged-delivery case. Explain that it is a genuine past model run and the page makes zero model/backend requests.
2. Show the order/policy evidence and read-only MCP events. Distinguish retrieved facts from the model's summary.
3. Show the exact-action approval and simulated receipt. In invited live mode, pause before approval, refresh, then approve. No real payment exists.
4. Open domain tests and concurrent PostgreSQL budget tests. Explain why safety lives in Go instead of prompts.
5. Show the evaluation history, not just the passing number. Describe the digest-transcription failure and the code-level fix.

**Why Go plus Python?** Go owns the API and business invariants; Python provides the Agents SDK/MCP/browser ecosystem. A fixed JSON-lines subprocess keeps deployment small. The downside is supervision/protocol work and per-run startup overhead; a durable worker queue would be the next scaling step.

**Why an agent rather than a deterministic chatbot?** Investigation paths differ: order/policy reads, shipment status, a constrained browser fallback, missing information or escalation. The model chooses useful evidence tools; eligibility, arithmetic and execution remain deterministic.

**What was your most useful 'aha'?** The model sometimes mistyped a long digest even though it understood the action. I stopped asking it to carry security identifiers. The application supplies the digest, the SDK provides the approval interruption, and Go verifies the exact decision. Improving the boundary was more reliable than asking for more careful text generation.

**How do you prevent duplicate refunds?** An authenticated approval binds a proposal digest and order version. Execution and receipt are persisted in the same serialized transaction. Repeated approval returns the same receipt. Real payments would additionally require the provider's idempotency key and an outbox/reconciliation process; this demo does not claim to solve a real payment integration.

**What happens after a crash?** The pending SDK state is persisted before showing approval. Leases prevent concurrent ownership. Uncertain calls are not silently retried; the reviewer explicitly resumes and existing receipts are retained.

**How do you evaluate it?** Seven scenarios, forty real executions including approval/rejection variations, deterministic required/forbidden outcomes, evidence IDs, budgets and receipt checks. It is a small development set, not an unbiased generalization benchmark. Next: hidden adversarial cases, independent human summary review and broader policy variation.

**AI-development disclosure.** Codex assisted with scaffolding, implementation, tests, debugging and documentation. No other tool is claimed as an author of this repository. Real OpenAI calls and actual local PostgreSQL/browser tests are distinguished from offline fixtures. The owner should be able to explain the code and reproduce the tests before presenting it in an interview.
