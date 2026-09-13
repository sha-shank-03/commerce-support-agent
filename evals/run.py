import argparse
import http.cookiejar
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.request

FIELDS = "id state summary error model promptVersion turns usedMicros inputTokens outputTokens ticket{id subject message orderId scenario} order{id status totalMinor currency address version} events{seq kind title detail at} evidence{id title content version} proposal{id kind digest amountMinor address reason expires} receipt{id detail simulated}"
parser=argparse.ArgumentParser();parser.add_argument("--limit",type=int,default=40);parser.add_argument("--scenario",default="");args=parser.parse_args()
cases=[json.loads(l) for l in Path("evals/cases.jsonl").read_text().splitlines()]
cases=[c for c in cases if not args.scenario or c["id"].startswith(args.scenario)][:args.limit]
results=[];recordings=[];Path("evals/results").mkdir(parents=True,exist_ok=True)
commit=subprocess.check_output(["git","rev-parse","HEAD"],text=True).strip()
def new_client():
    subprocess.run(["bin/server","-invite"],check=True,stdout=subprocess.DEVNULL)
    opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    def post(path,data):
        req=urllib.request.Request("http://127.0.0.1:8080"+path,data=json.dumps(data).encode(),headers={"Origin":"http://localhost:5173","Content-Type":"application/json"})
        with opener.open(req,timeout=20)as r:return json.load(r)
    post("/session",{"token":Path(".local/invite.txt").read_text().strip()})
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

for i,case in enumerate(cases):
    if i%5==0:gql=new_client()
    start=time.monotonic();checks={};r={};before=None
    try:
        r=gql("mutation($id:String!){startRun(ticketId:$id){id}}",{"id":case["ticketId"]})["startRun"]
        r=wait(gql,r["id"]);before=json.loads(json.dumps(r));checks["expected_pause"]=r["state"]==case["expectedState"]
        checks["no_unapproved_receipt"]=r["receipt"]is None
        checks["required_evidence"]=all(any(e["id"].startswith(prefix)for e in r["evidence"])for prefix in case["requiredEvidence"])
        checks["bounded_usage"]=r["turns"]<=8 and r["usedMicros"]<=250000
        checks["mcp_used"]=any(e["kind"]=="mcp" for e in r["events"])
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
        if passed and not any(x["scenario"]==r["ticket"]["scenario"] for x in recordings):
            recordings.append({"scenario":r["ticket"]["scenario"],"label":r["ticket"]["subject"],"recordedAt":r["events"][0]["at"],"commit":commit,"providerVerified":True,"run":r,"approvalSnapshot":before if before and before["proposal"] else None})
        results.append({"id":case["id"],"passed":passed,"checks":checks,"runId":r["id"],"state":r["state"],"model":r["model"],"costMicros":r["usedMicros"],"inputTokens":r["inputTokens"],"outputTokens":r["outputTokens"],"seconds":round(time.monotonic()-start,2)})
    except Exception as e:results.append({"id":case["id"],"passed":False,"error":str(e)[:300],"seconds":round(time.monotonic()-start,2)})
    report={"provider":"OpenAI","commit":commit,"cases":len(results),"passed":sum(x["passed"]for x in results),"results":results,"recordings":recordings,"notice":"40 executions across seven scenarios, including approval/rejection and stochastic repeats. Not 40 distinct business scenarios."}
    Path("evals/results/latest.json").write_text(json.dumps(report,indent=2))
    print(case["id"],"PASS"if results[-1]["passed"]else"FAIL",r.get("state",""),flush=True)
print(f"Passed {sum(x['passed']for x in results)}/{len(results)}",flush=True)
raise SystemExit(0 if all(x["passed"]for x in results)else 1)
