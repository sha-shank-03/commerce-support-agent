# Threat model

Assets: provider key, reviewer sessions, cross-reviewer data, approval integrity, spending allowance, audit history. Trust boundaries: anonymous browser; authenticated reviewer; model/provider; scoped subprocesses; Go domain layer; PostgreSQL. Customer text, clarifications and tool content are untrusted data, never authority.

| Threat | Control and verification |
|---|---|
| Prompt-injected refund or arbitrary tool | Go action policy plus allowlist; live injection scenario and offline forbidden-tool tests |
| Forged/replayed approval | Exact digest, current order version, 24-hour approval expiry, authenticated owner and idempotent receipt |
| Cross-reviewer access | Ownership on reads and mutations; expired/revoked session tests |
| CSRF / cross-origin requests | Exact Origin and JSON-only POSTs; HTTP-only, SameSite=Lax cookies, Secure on HTTPS |
| Model overspending | Serialized reservation before each call, fixed reviewed model, 8 turns, $0.25/run, $2.50/month, 2 active leases |
| Browser SSRF | Exact application-owned loopback GET allowlist; forbidden destinations tested |
| Worker failure / cancellation | Bounded process timeout, persisted approval checkpoint, explicit recovery, conservative uncertain usage |
| Secret exposure | No provider tracing; restricted child environment; public export omits owners/checkpoints; history/build scan |

## Known limits

- Invitations are bearer credentials, not enterprise identity. Session exchange has a small in-memory rate limiter; deployment-level throttling is still desirable. Behind a proxy, source-IP throttling may group reviewers together rather than trusting spoofable forwarded headers.
- JSONB aggregation serializes all writes and is deliberately low-volume. Expired data is logically inaccessible after retention but physically pruned on later successful transactions, not by an always-on scheduler.
- Cancellation revokes execution authority immediately. A provider request already in flight may finish and be billed; reserved usage covers the uncertainty.
- Model summaries are not guaranteed correct. Deterministic grading validates specified invariants, not every natural-language claim. No refunds, emails or shipments are real.
- Dependency scanning is point-in-time, not a security guarantee. Go advisories GO-2026-5970 and GO-2026-5004 were found during development and fixed by upgrading x/text and pgx before release.
- Local secret scanning uses high-confidence patterns. A human still needs to inspect history, CI logs and public assets before changing repository visibility.

Report issues privately to the repository owner. Do not include credentials or customer data in issue text.
