# An approval is not a boolean

Technical design note by Shashank, prepared with Codex assistance from this repository's implementation. Independent portfolio demonstration; all orders, policies and effects are synthetic.

## Problem

A support agent can recommend a reasonable refund and still be unsafe to execute it. A reviewer might approve one amount while the order changes, a client might retry after a disconnect, or untrusted ticket text might tell the model to bypass policy. A prompt saying "ask for approval" cannot enforce any of these boundaries.

## Decision: separate proposal from authority

The Python investigator uses the OpenAI Agents SDK to retrieve evidence and propose a resolution. It has no database or payment credentials. Go owns identity, policy, integer-money calculations and execution through a narrow, versioned JSON-lines interface.

A proposal includes its action, arguments, order identity and version, expiry and explanation. Go computes a SHA-256 digest over the proposal. The browser displays the proposal and sends back the exact digest with the reviewer's decision. That digest is a content binding, not an authentication credential: the server separately checks the secure session and run ownership.

The SDK's approval interruption pauses the worker before action execution. The application persists the checkpoint and proposal in PostgreSQL. After approval, an explicitly resumed worker must still pass Go's checks: the decision and digest must match, the proposal must be unexpired, the order version must be current, and the business action must remain eligible. The model cannot approve itself.

## Duplicate requests and uncertain outcomes

Within the transaction, Go records the simulated order change and receipt together. If the same approved request arrives again, execution returns its existing receipt instead of changing the order twice. No real payment or carrier account is connected. An external payment integration would additionally need the provider's idempotency key and reconciliation; the local receipt alone would not guarantee exactly-once effects across a network.

PostgreSQL's row lock serializes the small demonstration aggregate, including usage reservations and leases. This is deliberately simple for a low-volume portfolio app. A production design should normalize entities, use finer-grained locks, and add a transactional outbox and durable queue.

## Evidence and failure

The Luna evaluation ran all 40 defined cases: 39 completed their task checks, while all 40 passed the separate persisted action-safety audit. One browser-fallback case failed at an application validation boundary without creating a proposal or receipt. The precise rejection reason was not retained, so the report does not guess at it or silently rerun the failure out of the score.

The useful distinction is task success versus permission to act. A system should report uncertainty or stop when it cannot safely complete an investigation. It should never turn a failed investigation into an authorized refund.

## Inspect the implementation

- [Proposal digest, eligibility, integer amounts and idempotent execution](../internal/domain/domain.go)
- [Authentication, ownership, decisions and worker protocol](../internal/server/server.go)
- [Approval-interrupted Python investigator](../agent/worker.py)
- [PostgreSQL persistence](../internal/store/store.go)
- [Actual evaluation results and limitations](EVALUATIONS.md)
- [Architecture and recovery trade-offs](ARCHITECTURE.md)

The companion [Artwork Proof Agent](https://github.com/sha-shank-03/artwork-proof-agent) applies the same principle to a different decision: approval binds an artwork hash and report version, while deterministic measurements remain separate from Claude's visual suggestions.
