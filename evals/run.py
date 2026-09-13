import argparse
import atexit
import http.cookiejar
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import urllib.request
import urllib.error

MODEL = "gpt-5.6-luna"
FIELDS = "id state summary error model promptVersion turns usedMicros inputTokens outputTokens ticket{id subject message orderId scenario} order{id status totalMinor currency address version} events{seq kind title detail at call{id phase model durationMs inputTokens outputTokens costMicros}} evidence{id title content version} proposal{id kind digest amountMinor address reason expires} receipt{id detail simulated}"
parser=argparse.ArgumentParser();parser.add_argument("--limit",type=int,default=40);parser.add_argument("--scenario",default="")
parser.add_argument("--resume",action="store_true",help="Resume only a passing prefix from the same source commit")
parser.add_argument("--rerun-failed",action="store_true",help="Retain the full previous attempt and rerun only failed cases")
parser.add_argument("--hosted-site");parser.add_argument("--railway-project");parser.add_argument("--railway-environment");parser.add_argument("--railway-service");args=parser.parse_args()
selectors=[];issued=[]
if args.hosted_site:
    if not args.hosted_site.startswith("https://") or not all([args.railway_project,args.railway_environment,args.railway_service]):parser.error("Hosted runs require HTTPS and exact Railway selectors")
    selectors=["--project",args.railway_project,"--environment",args.railway_environment,"--service",args.railway_service]
origin=args.hosted_site.rstrip("/") if args.hosted_site else "http://localhost:5173"
api=origin+"/api" if args.hosted_site else "http://127.0.0.1:8080"
cases=[json.loads(l) for l in Path("evals/cases.jsonl").read_text().splitlines()]
cases=[c for c in cases if not args.scenario or c["id"].startswith(args.scenario)][:args.limit]
results=[];recordings=[];Path("evals/results").mkdir(parents=True,exist_ok=True)
previous=Path("evals/results/latest.json")
commit=subprocess.check_output(["git","rev-parse","HEAD"],text=True).strip()
retry_notice=None
if args.resume and args.rerun_failed:parser.error("Choose resume or rerun-failed, not both")
if args.rerun_failed:
    saved=json.loads(previous.read_text())
    if saved.get("provider")!="OpenAI" or saved.get("model")!=MODEL or saved.get("commit")!=commit or [r.get("id") for r in saved["results"]]!=[c["id"] for c in cases]:
        raise SystemExit("Rerun requires the complete same-source evaluation set")
    results=saved["results"];recordings=saved["recordings"]
    retry_notice={"priorPassed":saved["passed"],"priorCases":saved["cases"],"rerunCaseIds":[r["id"] for r in results if not r["passed"]],"method":"Only failed cases rerun; original attempt retained in evaluation history."}
    previous.rename(previous.with_name(f"attempt-{time.time_ns()}.json"))
elif args.resume:
    saved=json.loads(previous.read_text());results=saved["results"];recordings=saved["recordings"]
    if saved.get("provider")!="OpenAI" or saved.get("model")!=MODEL or saved.get("commit")!=commit or not all(r["passed"] for r in results) or [r["id"] for r in results]!=[c["id"] for c in cases[:len(results)]]:
        raise SystemExit("Resume requires a passing prefix from the same provider and source commit")
elif previous.exists():previous.rename(previous.with_name(f"attempt-{time.time_ns()}.json"))
def cleanup():
    for invitation in issued[:]:
        result=subprocess.run([sys.executable,"tools/hosted_invite.py","revoke","--id",invitation,*selectors],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        if result.returncode==0:issued.remove(invitation)
        else:print("Invitation cleanup requires retry for ID "+invitation,file=sys.stderr)
atexit.register(cleanup)
def new_client():
    command=[sys.executable,"tools/hosted_invite.py","invite","--output-prefix","eval-invite",*selectors] if args.hosted_site else ["bin/server","-invite"]
    subprocess.run(command,check=True,stdout=subprocess.DEVNULL)
    if args.hosted_site:issued.append(json.loads(Path(".local/eval-invite.json").read_text())["id"])
    opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def post(path,data):
        req=urllib.request.Request(api+path,data=json.dumps(data).encode(),headers={"Origin":origin,"Content-Type":"application/json"})
        readonly=path=="/graphql" and data.get("query","").lstrip().startswith("query")
        for attempt in range(3 if readonly else 1):
            try:
                with opener.open(req,timeout=190)as r:return json.load(r)
            except (urllib.error.URLError,TimeoutError) as exc:
                if not readonly or attempt==2 or isinstance(exc,urllib.error.HTTPError) and exc.code<500:raise
                time.sleep(1)
    post("/session",{"token":Path(".local/eval-invite.txt" if args.hosted_site else ".local/invite.txt").read_text().strip()})
    def gql(query,variables={}):
        response=post("/graphql",{"query":query,"variables":variables})
        if response.get("errors"):raise RuntimeError(response["errors"][0]["message"])
        return response["data"]
    return gql

def wait(gql,ident):
    end=time.monotonic()+180
    while time.monotonic()<end:
        r=gql("query($id:String!){run(id:$id){"+FIELDS+"}}",{"id":ident})["run"]
        if r["state"]!="running":return r
        time.sleep(1)
    raise RuntimeError("run timed out")

start_index=len(results)
work=[(i,c) for i,c in enumerate(cases) if not results[i]["passed"]] if args.rerun_failed else list(enumerate(cases[start_index:],start_index))
for work_index,(i,case) in enumerate(work):
    if work_index%5==0:gql=new_client()
    start=time.monotonic();checks={};r={};before=None
    try:
        r=gql("mutation($id:String!){startRun(ticketId:$id){id}}",{"id":case["ticketId"]})["startRun"]
        r=wait(gql,r["id"]);before=json.loads(json.dumps(r));checks["expected_pause"]=r["state"]==case["expectedState"]
        checks["no_unapproved_receipt"]=r["receipt"]is None
        checks["requested_model"]=r["model"]==MODEL
        checks["real_provider_usage"]=r["inputTokens"]>0 and r["outputTokens"]>0
        checks["required_evidence"]=all(any(e["id"].startswith(prefix)for e in r["evidence"])for prefix in case["requiredEvidence"])
        checks["bounded_usage"]=r["turns"]<=8 and r["usedMicros"]<=250000
        # Missing identity may be clarified immediately without querying an order.
        checks["mcp_used_when_applicable"]=case["ticketId"]=="ticket-missing" or any(e["kind"]=="mcp" for e in r["events"])
        if case["decision"] and r["state"]=="awaiting_approval":
            digest=r["proposal"]["digest"];operation=case["decision"]+"Run"
            gql("mutation($id:String!,$digest:String!){"+operation+"(id:$id,digest:$digest){id}}",{"id":r["id"],"digest":digest})
            r=wait(gql,r["id"]);checks["decision_completed"]=r["state"]=="completed"
            checks["receipt_matches_decision"]=bool(r["receipt"])==(case["decision"]=="approve")
            if case["decision"]=="approve" and r["receipt"]:
                duplicate=gql("mutation($id:String!,$digest:String!){approveRun(id:$id,digest:$digest){receipt{id}}}",{"id":r["id"],"digest":digest})["approveRun"]
                checks["idempotent_receipt"]=duplicate["receipt"]["id"]==r["receipt"]["id"]
        elif not case["decision"]:checks["no_action_proposal"]=r["proposal"]is None
        passed=all(checks.values())
        spans=[e["call"] for e in r["events"] if e.get("call") and e["call"]["phase"]=="completed"]
        checks["model_telemetry"]=len(spans)==r["turns"] and all(s["model"]==r["model"] and s["durationMs"]>=0 for s in spans) and sum(s["costMicros"] for s in spans)==r["usedMicros"] and sum(s["inputTokens"] for s in spans)==r["inputTokens"] and sum(s["outputTokens"] for s in spans)==r["outputTokens"]
        passed=all(checks.values())
        if passed and not any(x["scenario"]==r["ticket"]["scenario"] for x in recordings):
            recordings.append({"scenario":r["ticket"]["scenario"],"label":r["ticket"]["subject"],"recordedAt":r["events"][0]["at"],"commit":commit,"providerVerified":True,"run":r,"approvalSnapshot":before if before and before["proposal"] else None})
        row={"id":case["id"],"passed":passed,"checks":checks,"runId":r["id"],"state":r["state"],"model":r["model"],"costMicros":r["usedMicros"],"inputTokens":r["inputTokens"],"outputTokens":r["outputTokens"],"seconds":round(time.monotonic()-start,2)}
    except Exception as e:row={"id":case["id"],"passed":False,"errorType":type(e).__name__,"seconds":round(time.monotonic()-start,2)}
    if args.rerun_failed:results[i]=row
    else:results.append(row)
    report={"provider":"OpenAI","model":MODEL,"commit":commit,"cases":len(results),"passed":sum(x["passed"]for x in results),"results":results,"recordings":recordings,"notice":"40 executions across seven scenarios, including approval/rejection and stochastic repeats. Not 40 distinct business scenarios."}
    if retry_notice:report["retryNotice"]=retry_notice
    Path("evals/results/latest.json").write_text(json.dumps(report,indent=2))
    print(case["id"],"PASS"if row["passed"]else"FAIL",r.get("state",""),flush=True)
    if r.get("state")=="failed" and r.get("turns")==0:
        print("Provider access failed before a billed call; stopping.",flush=True);break
cleanup()
print(f"Passed {sum(x['passed']for x in results)}/{len(results)}",flush=True)
raise SystemExit(0 if len(results)==len(cases) and all(x["passed"]for x in results)else 1)
