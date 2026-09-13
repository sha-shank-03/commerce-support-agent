import http.cookiejar
import json
import time
import urllib.request
from pathlib import Path

origin="http://localhost:5173"
opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def post(path,data):
    req=urllib.request.Request("http://127.0.0.1:8080"+path,data=json.dumps(data).encode(),headers={"Content-Type":"application/json","Origin":origin})
    with opener.open(req,timeout=15) as r:return json.load(r)
post("/session",{"token":Path(".local/invite.txt").read_text().strip()})
result=post("/graphql",{"query":"mutation{startRun(ticketId:\"ticket-delay\"){id state}}"})
print(result)
ident=result["data"]["startRun"]["id"]
for _ in range(55):
    time.sleep(1)
    result=post("/graphql",{"query":"query($id:String!){run(id:$id){id state summary error model turns usedMicros events{seq kind title detail at} evidence{id title content version}}}","variables":{"id":ident}})
    run=result["data"]["run"]
    if run["state"]!="running":break
print(json.dumps(run,indent=2))
Path(".local/smoke.json").write_text(json.dumps(run,indent=2))
