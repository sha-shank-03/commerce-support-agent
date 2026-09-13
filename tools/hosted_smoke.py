"""Explicitly invoked, bounded real-provider hosted smoke and restart check."""
import argparse, http.cookiejar, json, subprocess, time, urllib.request
from pathlib import Path

p=argparse.ArgumentParser();p.add_argument("phase",choices=["prepare","complete","inspect","disabled"]);p.add_argument("--base-url",required=True);args=p.parse_args()
base=args.base_url.rstrip("/");assert base.startswith("https://")
root=Path(__file__).resolve().parents[1];report_path=root/".local/hosted-smoke.json"
report=json.loads(report_path.read_text()) if report_path.exists() else {"baseUrl":base,"checks":{}}
assert report["baseUrl"]==base
jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def post(path,data):
    req=urllib.request.Request(base+"/api"+path,data=json.dumps(data).encode(),headers={"Origin":base,"Content-Type":"application/json"})
    with client.open(req,timeout=30) as response:return json.load(response)
def raw_gql(query,variables=None):return post("/graphql",{"query":query,"variables":variables or {}})
def gql(query,variables=None):
    result=raw_gql(query,variables)
    if result.get("errors"):raise RuntimeError("GraphQL operation failed")
    return result["data"]
fields="id state summary error turns usedMicros events{kind title} evidence{id} proposal{digest kind amountMinor} receipt{id simulated} order{version}"
def get(ident):return gql("query($id:String!){run(id:$id){"+fields+"}}",{"id":ident})["run"]
def wait(ident):
    end=time.monotonic()+170
    while time.monotonic()<end:
        run=get(ident)
        if run["state"]!="running":return run
        time.sleep(1)
    raise TimeoutError("Hosted run timed out")
def check(name,condition):
    report["checks"][name]=bool(condition);report_path.write_text(json.dumps(report,indent=2))
    print(name,"PASS" if condition else "FAIL",flush=True)
    assert condition,name

post("/session",{"token":(root/".local/hosted-invite.txt").read_text().strip()})
check("secure_httponly_session",all(c.secure and c.has_nonstandard_attr("HttpOnly") for c in jar) and len(jar)>0)
if args.phase=="inspect":
    print(json.dumps(get(report["browserRunId"]),indent=2));raise SystemExit(0)
if args.phase=="disabled":
    with client.open(base+"/api/ready",timeout=30) as response:ready=json.load(response)
    assert ready["liveEnabled"] is False
    result=raw_gql('mutation{startRun(ticketId:"ticket-delay"){id}}')
    check("live_kill_switch",any("disabled" in e["message"].lower() for e in result.get("errors",[])))
    raise SystemExit(0)
if args.phase=="prepare":
    run=wait(report.get("browserRunId") or gql('mutation{startRun(ticketId:"ticket-browser"){id}}')["startRun"]["id"])
    report["browserRunId"]=run["id"]
    check("hosted_browser_and_mcp",run["state"]=="completed" and any(e["id"].startswith("browser:") for e in run["evidence"]) and any(e["title"]=="browser_result" for e in run["events"]) and any(e["kind"]=="mcp" for e in run["events"]))
    check("bounded_provider_usage",run["turns"]<=8 and run["usedMicros"]<=250000)
    run=wait(report.get("pausedRunId") or gql('mutation{startRun(ticketId:"ticket-damage"){id}}')["startRun"]["id"])
    report["pausedRunId"]=run["id"];report["digest"]=run["proposal"]["digest"]
    check("paused_without_action",run["state"]=="awaiting_approval" and run["receipt"] is None)
    check("wrong_digest_denied",bool(raw_gql('mutation($id:String!){approveRun(id:$id,digest:"wrong"){id}}',{"id":run["id"]}).get("errors")))
    print("Ready for backend restart; run checkpoint is persisted.")
else:
    run=get(report["pausedRunId"])
    check("restart_preserved_pending_approval",run["state"]=="awaiting_approval" and run["proposal"]["digest"]==report["digest"] and run["receipt"] is None)
    query='mutation($id:String!,$digest:String!){approveRun(id:$id,digest:$digest){receipt{id}}}'
    variables={"id":run["id"],"digest":report["digest"]}
    gql(query,variables);run=wait(run["id"])
    check("approved_simulated_receipt",run["state"]=="completed" and bool(run["receipt"]) and run["receipt"]["simulated"] and run["order"]["version"]==2)
    duplicate=gql(query,variables)["approveRun"]["receipt"]
    check("duplicate_approval_idempotent",duplicate["id"]==run["receipt"]["id"])
    check("five_run_invitation_enforced",bool(raw_gql('mutation{startRun(ticketId:"ticket-delay"){id}}').get("errors")))
    metadata=json.loads((root/".local/hosted-invite.json").read_text())
    selectors=["--project",metadata["project"],"--environment",metadata["environment"],"--service",metadata["service"]]
    subprocess.run([__import__("sys").executable,"tools/hosted_invite.py","invite",*selectors],cwd=root,stdout=subprocess.DEVNULL,check=True)
    post("/session",{"token":(root/".local/hosted-invite.txt").read_text().strip()})
    check("reviewer_isolation",bool(raw_gql('query($id:String!){run(id:$id){id}}',{"id":run["id"]}).get("errors")))
    for ident in (metadata["id"],json.loads((root/".local/hosted-invite.json").read_text())["id"]):
        subprocess.run([__import__("sys").executable,"tools/hosted_invite.py","revoke","--id",ident,*selectors],cwd=root,stdout=subprocess.DEVNULL,check=True)
    try:
        result=raw_gql('query{runs{id}}');denied=bool(result.get("errors"))
    except urllib.error.HTTPError as exc:denied=exc.code in (401,403)
    check("revoked_session_denied",denied)
    print("Hosted restart/action/isolation smoke complete; testing invitations revoked.")
