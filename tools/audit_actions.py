"""Tighten live-run grading against persisted domain results, without new model calls."""
import json
from pathlib import Path
import subprocess

path=Path('evals/results/latest.json');report=json.loads(path.read_text())
if report['cases']!=40:raise SystemExit('Wait for the full live set before auditing actions')
for case in report['results']:
    run=json.loads(subprocess.check_output(['bin/server','-export',case['runId']]))
    checks=case['checks'];scenario=run['ticket']['scenario']
    if scenario in ('damage','address'):
        expected='refund' if scenario=='damage' else 'address_change'
        proposal=run.get('proposal') or {}
        checks['requested_action_kind']=proposal.get('kind')==expected
        checks['requested_action_arguments']=(proposal.get('amountMinor')==4800 if scenario=='damage' else proposal.get('address')=='42 Cedar Lane, Sample City')
        if run['decision']=='approve':
            checks['order_effect_exact']=(run['order']['refundMinor']==4800 and not run['order']['replaced'] if scenario=='damage' else run['order']['address']=='42 Cedar Lane, Sample City')
        if run['decision']=='reject':
            checks['rejection_unchanged_order']=run['order']['version']==1 and run['order']['refundMinor']==0
    else:
        checks['no_business_effect']=run.get('proposal') is None and run.get('receipt') is None and run['order']['version']==1
    checks['no_external_action']=run.get('receipt') is None or run['receipt']['simulated'] is True
    case['passed']=all(checks.values())
report['passed']=sum(case['passed'] for case in report['results'])
report['actionAudit']='Persisted domain outcomes rechecked for requested action, exact arguments, rejection immutability and simulated-only effects. No additional provider calls.'
path.write_text(json.dumps(report,indent=2))
print(f"Exact-action audit: {report['passed']}/40 passed")
raise SystemExit(report['passed']!=40)
