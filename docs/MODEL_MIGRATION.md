# Model migration - 13 September 2026

## Confirmed scope

The user requested Luna for Commerce and Claude for Artwork. Commerce previously
used GPT-4.1 mini through an existing OpenAI Agents SDK Responses integration;
Artwork previously used Luna through a caller-owned Responses tool loop.
The model change does not authorize different business behavior or wider access.

Commerce now requests `gpt-5.6-luna`, with `reasoning.effort=none` to preserve the
old non-reasoning latency/cost role. Typed tools, structured final answers,
read-only MCP, fixture-only browser navigation and SDK approval interruptions
are unchanged. Go remains authoritative for every action. Old-model checkpoints
require a fresh run; historical results retain their original model identity.

## Compatibility and cost

The endpoint stays Responses; no router, fallback, hosted tool, caching feature
or multi-agent capability was added. Prompt `commerce-v2` is unchanged. The
existing 70 KB input bound plus schema headroom, 1,200 output tokens, eight turns,
$0.05 per-call reservation, $0.25/run ceiling and shared $2.50/month ledger remain.
Short-context input is conservatively priced at the $0.25/M cache-write ceiling;
output is $1.20/M, calculated in integer micro-USD with upward rounding.

Sources: [Luna model](https://developers.openai.com/api/docs/models/gpt-5.6-luna),
[migration guidance](https://developers.openai.com/api/docs/guides/upgrading-to-gpt-5p6-sol),
[standard pricing](https://developers.openai.com/api/docs/pricing).

## Validation status

Local: 15 Python tests, Go race tests, schema generation, production build and
24 offline browser tests passed across Chromium, Firefox and WebKit.

The full Luna set scored **39/40 (97.5%)**, with **40/40 persisted action-safety
audits**. One browser case stopped at an application RPC validation boundary;
its exact rejection reason was not retained. No action was proposed/executed.
The failed case remains in the score, without retesting it into a perfect score.
This exceeds the agreed 90% task-success gate, not a claim of perfect reliability.

Case usage: 176,218 input / 5,239 output tokens; estimated **$0.050418**.
Median end-to-end latency 11.145 s; maximum 20.85 s. Includes polling/tools and
automated reviewer decisions, not just model latency. Historical GPT-4.1 mini
evaluations and recordings remain accurately labelled in Git/evaluation history.

Seven genuine Luna replay assets are deployed anonymously. The public graph now
labels the LLM **GPT-5.6 Luna**; technical traces retain the exact API model ID.
No provider credential, budget or hosting allocation was changed for Commerce.

Railway deployment: `0d174695-b074-46fe-96fe-315d9aa32de6` (backend `7068172`).
Evaluation source: `2b9fc8b3747aa184bb0c9b86e3fb3fbc7a8c667f` (harness fix only).
Vercel production deployment: `dpl_CfteC2t8uLyEERBnUq3W3b4ybmcy`.
Hosted browser/CI checks are recorded in the final handoff below when complete.
