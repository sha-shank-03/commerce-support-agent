# Agent console redesign — implementation plan

## Confirmed baseline

Two independently runnable React/Vite applications have working invitation, approval and spending controls. Commerce uses Go/GraphQL plus one Python OpenAI Agents SDK agent; Artwork uses FastAPI and a bounded Luna Responses loop. Public replays must stay static and never call the backend. Model selection, prompts, authorization, budgets and existing customer applications are outside this redesign.

The current interface hides integration relationships. Commerce's timeline slider filters events but still shows final results. Both event contracts lack per-call model timing. Artwork's six verified recordings have not yet been published.

## Delivery sequence

1. Add backward-compatible, allowlisted LLM-call events and deterministic telemetry tests. Expose actual call boundaries, duration and usage without prompts, credentials or hidden reasoning. Old recordings explicitly retain unavailable timing.
2. Build a shared visual language independently in each repository: compact console chrome; Run / System map / Reviewer brief navigation; component inspection; responsive, accessible light/dark layouts.
3. Implement synchronized recorded playback, state-aware next actions, component activity and inspectable events. Hide future findings, proposals and receipts. Historical final snapshots are not presented as earlier state.
4. Add a concise reviewer brief with actual verification evidence, limitations, architecture and project links. Publish Artwork's already genuine static recordings only after the existing gate, secret review and all proof-page visual checks pass.
5. Run unit/API tests, contracts, builds, dependency checks and Chromium/Firefox/WebKit checks for replay isolation, keyboard/mobile operation, theme, graph interactions, refresh, login races and approval flows. Capture actual UI screenshots.
6. Deploy reviewed changes to the existing services and Vercel projects, verify hosted behavior using bounded temporary invitations, revoke test invitations and report actual results. No provider changes, purchases, new hosting resources or repository visibility changes.

## Acceptance and integrity

- First screen explains input, current phase, integration activity and next permitted action.
- Architecture links represent allowed connections; execution activity comes only from recorded events. One agent is not described as several agents.
- LLM calls expose model, status, observed duration, token usage and estimated cost when recorded. Missing values are unknown, not zero or fabricated.
- Tool evidence and decision summaries are displayed as untrusted content; no arbitrary remote image loads, HTML execution or private chain-of-thought disclosure.
- Replay play/pause/step updates all result panels and never enables live action controls. Final-only snapshots remain labelled or hidden until the end.
- Full workflows remain usable on a phone and keyboard; motion respects reduced-motion preferences.
- Public browsing makes zero backend/model calls, including maps and reviewer documentation.
- Same per-run and monthly ceilings, authorization, approval digest and idempotency rules remain authoritative on the server.

## Design references

- https://reactflow.dev/learn/customization/custom-nodes — selectable diagram nodes.
- https://docs.langchain.com/langsmith/observability-studio — inspect model/tool execution.
- https://langfuse.com/changelog/2025-03-19-new-trace-view — hierarchy, timeline and details.

The implementation reuses the existing custom React rendering pipeline and native controls, not a chat-framework migration. The graph is an execution viewer, not an editable workflow builder. No third-party tracing service is required.

## Status

Plan recorded; implementation and verification in progress. Results will be appended after checks run.

## Implemented and checked locally

- System-map landing view, selectable integration boundaries, Run view and reviewer brief.
- Responsive dark/light themes, keyboard controls, stronger connector contrast and reduced motion.
- Shared #run/#brief navigation works even when the console is already open; an initial effect race found in WebKit was fixed.
- Play/pause/rewind/step controls project the visible historical state. Future outputs are hidden; no live action is possible in replay mode.
- Allowlisted started/completed model events show observed timing, real token counts and conservative cost estimates. Existing recordings without spans remain honest about missing metadata.
- Downloadable reviewer guide, actual evaluation results and earlier failures.
- Hosted backend telemetry deployed; final evaluation 40/40 after rerunning one network-failed case. Original attempt preserved. Final-case cost estimate $0.058996, excluding any unobserved failed-attempt usage.
- No provider/model selection, credentials, budgets, hosting resources or repository visibility changed.

All forty persisted Commerce outcomes passed the exact-action audit. Seven genuine recordings include MCP and restricted-browser execution.

Frontend production deployment and hosted UI verification are the remaining steps.
