import type { Run } from "./api";
import { replayState } from "./console-types";
export function projectRun(
  run: Run | null | undefined,
  step: number,
): Run | null {
  if (!run) return null;
  const events = run.events.slice(0, step),
    atEnd = step >= run.events.length;
  if (atEnd) return run;
  // Legacy tool events mark invocation, not completion. Reveal evidence only
  // after a following event; never fabricate an earlier order snapshot.
  const completed = events.slice(0, -1);
  const has = (name: string) =>
    completed.some((e) => e.kind === "tool" && e.title === name);
  const lastSummary = [...events]
    .reverse()
    .find(
      (e) =>
        e.kind === "status" &&
        ["completed", "awaiting approval", "awaiting input"].includes(e.title),
    );
  return {
    ...run,
    events,
    state: replayState(events, run.state, false),
    summary: lastSummary?.detail || "",
    error: events.some((e) => e.kind === "error") ? run.error : "",
    evidence: run.evidence.filter((e) =>
      e.id.startsWith("policy:")
        ? has("lookup_policies")
        : e.id.startsWith("order:")
          ? has("lookup_order")
          : e.id.startsWith("shipment:")
            ? has("lookup_shipment")
            : e.id.startsWith("browser:")
              ? has("browser_result")
              : false,
    ),
    proposal: events.some((e) => e.kind === "proposal") ? run.proposal : null,
    receipt: events.some((e) => e.kind === "receipt") ? run.receipt : null,
  };
}
