# Commerce Support Agent - reviewer guide

Independent portfolio demonstration by Shashank. Unaffiliated with Sticker Mule.
Synthetic data and original artwork fixtures only; no customer systems, real payments or printers.

## A two-minute walkthrough

1. Start on System map. Select the LLM, API, database and tool nodes to inspect their inputs, outputs and enforced boundaries.
2. Open Run view. Select a genuine recorded case, rewind, then step through the trace or play the event-paced recording.
3. Expand a model-call event to inspect the model, measured duration, provider token counts and application-estimated cost when captured.
4. Watch the next permitted action change at clarification and approval boundaries.
5. Inspect the final evidence, decision and simulated receipt or proof.

Playback speed is illustrative, not wall-clock latency. Historical recordings without call timing are explicitly labelled. The system map describes allowed architecture paths; it is not a fabricated real-time network monitor. Public replay files make zero backend/model calls.

## Architecture

Go / GraphQL owns orders, deterministic eligibility, approvals and simulated execution. A supervised Python OpenAI Agents SDK subprocess investigates with typed tools. A read-only MCP server supplies order/policy evidence; a browser tool visits only the application-owned mock carrier fixture.

Current live model: gpt-4.1-mini. A single bounded agent is used, not a multi-agent swarm.
The React/TypeScript interface and static replays are served by Vercel. The live backend and isolated portfolio PostgreSQL storage are on Railway.

## Security and human control

- Expiring, revocable, hashed invitations are exchanged for secure sessions. Reviewer data is isolated.
- Only the application can authorize state changes. Model output is untrusted.
- Exact action/report digests bind approval to the reviewed version; duplicate decisions cannot duplicate execution.
- Checkpoints survive restarts. Uncertain work requires verified recovery, not blind retries.
- Two concurrent runs, eight model turns and an estimated $0.25 ceiling per run.
- A shared database ledger reserves provider spending before calls; the per-app monthly allowance is $2.50 including evaluations.
- Only allowlisted telemetry is public: call IDs, phases, model, timing, tokens and estimated cost. No hidden reasoning, raw provider payloads, prompts, sessions or credentials.

## Evidence and limitations

Download verification.json for actual per-case checks, source commit, latency and token usage.
The refreshed set passed after one network-failed case per app was rerun. evaluation-history.json retains the initial 39/40 Commerce and 29/30 Artwork attempts; verification.json identifies the exact rerun cases. Per-case usage estimates do not include any unobserved usage from a network-failed attempt. The application ledger remains authoritative for spending reservations.
These are synthetic bounded evaluations, not production reliability or unrestricted visual-accuracy claims.
The source repositories remain private pending the separate portfolio release gates.
Infrastructure has a $10/month combined planning target including model allowances, not a guaranteed bill.

## Useful interview questions

- Why separate the agent's suggestions from the application's authority?
- What prevents a stale approval or duplicate request from executing twice?
- Which failures can be retried, and which require explicit recovery?
- How do you distinguish a measured fact from a model suggestion?
- How can a replay remain inspectable with all backend services offline?
- Why are cost reservations atomic across concurrent requests?

AI development note: Codex assisted implementation, documentation and test authoring. Passing automated tests are reported separately from real-provider evaluations and human visual checks. This project makes no claim of autonomous correctness.
