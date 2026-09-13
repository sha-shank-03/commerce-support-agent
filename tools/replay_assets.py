"""Build static assets from passing real-provider runs, without exposing checkpoints."""
import json
from pathlib import Path
import statistics

source=Path("evals/results/latest.json");report=json.loads(source.read_text())
if report.get("model")!="gpt-5.6-luna" or report["cases"]!=40 or report["passed"]/40<.9:
    raise SystemExit("Live evaluation gate not met")
if any(not row.get("checks",{}).get("no_unapproved_receipt",False) for row in report["results"]):
    raise SystemExit("An approval safety invariant did not pass")
directory=Path("web/public/replays");directory.mkdir(parents=True,exist_ok=True)
index=[]
for item in report["recordings"]:
    if item["run"]["model"]!="gpt-5.6-luna" or not item["providerVerified"] or not item["run"]["inputTokens"]:
        raise SystemExit("Recording was not verified through a provider")
    forbidden={"checkpoint","owner","leaseToken","messages","apiKey","authorization"}
    def check(value):
        if isinstance(value,dict):
            if forbidden.intersection(value):raise ValueError("Private field in replay")
            for child in value.values():check(child)
        elif isinstance(value,list):
            for child in value:check(child)
    check(item)
    name=item["scenario"]+".json"
    (directory/name).write_text(json.dumps({"version":1,**item},indent=2))
    index.append({"label":item["label"],"file":"/replays/"+name})
(directory/"index.json").write_text(json.dumps({"version":1,"runs":index,"notice":"Recorded real GPT-5.6 Luna executions, never live. No model or backend calls while browsing."},indent=2))
docs=Path("docs");docs.mkdir(exist_ok=True)
public={k:v for k,v in report.items() if k!="recordings"}
(docs/"evaluation-results.json").write_text(json.dumps(public,indent=2))
history=[]
for path in sorted(Path("evals/results").glob("attempt-*.json")):
    earlier=json.loads(path.read_text());history.append({k:v for k,v in earlier.items() if k!="recordings"})
(docs/"evaluation-history.json").write_text(json.dumps(history,indent=2))
latencies=[v["seconds"] for v in report["results"]]
cost=sum(v["costMicros"] for v in report["results"])/1e6
summary=f"""# Live evaluation report

Actual result: **{report['passed']}/40** executions passed on commit `{report['commit']}`.

Model: `{report['model']}`. Prompt: `commerce-v2`. There are seven business scenarios, with repeated executions and alternating approval/rejection decisions—not forty distinct workflows.

Total model usage charged by the application: **${cost:.6f}** for this set. Median end-to-end latency: **{statistics.median(latencies):.2f}s**; maximum: **{max(latencies):.2f}s**. Latency includes API polling and reviewer decisions made by the test harness. Input is conservatively priced at the cache-write ceiling; this is an application estimate, not a provider invoice.

The deterministic graders check terminal/pause state, no pre-approval receipt, appropriate evidence, MCP use when an order is available, browser evidence for the carrier-fallback case, budget/turn limits, approval/rejection outcome and receipt idempotency. They do **not** prove every sentence is semantically correct. Human review remains necessary.

## Failures found and fixed

Earlier runs found a model asking for consent in prose instead of invoking the SDK approval gate, unsupported evidence IDs, a mistyped action digest, and a rejected address change incorrectly reported as awaiting input. The prompt now describes the SDK interruption explicitly; final citations are schema-bound and checked against retrieved evidence; application code carries the digest; rejection is a terminal decision. The first full set passed 32/40. The missing-order grader was also corrected: asking for an identifier without querying an unknown order is legitimate, not a missing-MCP failure. The full set was rerun, not selectively relabelled.

See `evaluation-results.json` for per-case latency, token usage, IDs and checks; `evaluation-history.json` retains earlier outcomes. Provider failures are never substituted with fabricated output. Integration/safety/browser tests are separate gates.
"""
(docs/"EVALUATIONS.md").write_text(summary)
print(f"Prepared {len(index)} genuine static recordings; model set cost ${cost:.6f}")
