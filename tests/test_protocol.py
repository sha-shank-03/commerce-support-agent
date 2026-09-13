"""Offline unit tests. These do not substitute for real-provider evaluation."""
import io
import json
import sys
from pathlib import Path
import pytest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from agent import worker
from agents.tool_context import ToolContext

@pytest.mark.parametrize('url,method',[
 ('https://carrier.example/tracking','GET'),
 ('http://127.0.0.1:9999/other','GET'),
 ('http://127.0.0.1:9999/tracking?redirect=https://evil.invalid','GET'),
 ('file:///etc/passwd','GET'),
 ('http://127.0.0.1:9999/tracking','POST'),
])
def test_browser_rejects_forbidden_destinations(url,method):
    assert not worker.carrier_destination_allowed(url,method,'http://127.0.0.1:9999/tracking')

def test_browser_allows_only_fixture_get():
    assert worker.carrier_destination_allowed('http://127.0.0.1:9999/tracking','GET','http://127.0.0.1:9999/tracking')

@pytest.mark.parametrize('reply',['','{}','{"v":2,"id":"1"}','{"v":1,"id":"wrong"}','{"v":1,"id":"1","error":"lease expired"}'])
def test_rpc_fails_closed(monkeypatch,reply):
    monkeypatch.setattr(worker,'_seq',0)
    monkeypatch.setattr(sys,'stdin',io.StringIO(reply+'\n' if reply else ''))
    with pytest.raises((RuntimeError,ValueError)):worker.rpc('tool',name='lookup_order',args={})

@pytest.mark.asyncio
async def test_execution_uses_server_identifier_not_model_transcription(monkeypatch):
    captured=[]
    monkeypatch.setattr(worker,'_proposal_digest','server-issued-digest')
    monkeypatch.setattr(worker,'tool',lambda name,**args:captured.append((name,args)) or {'simulated':True})
    result=await worker.execute_action.on_invoke_tool(ToolContext(None,tool_name='execute_action',tool_call_id='unit-call',tool_arguments='{}'),'{}')
    assert json.loads(result)['simulated']
    assert captured==[('execute_action',{'digest':'server-issued-digest'})]
    assert worker.execute_action.needs_approval is True

def test_resolution_schema_rejects_arbitrary_state():
    with pytest.raises(ValueError):worker.Resolution(state='send_payment',summary='invalid',evidence_ids=[])
