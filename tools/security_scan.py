"""Conservative local scan: working tree, complete Git blobs and build artifacts.

Prints locations, never matched values. Not a substitute for professional review.
"""
from pathlib import Path
import re
import subprocess

patterns=[re.compile(rb'sk-(?:ant-|proj-)?[A-Za-z0-9_-]{24,}'),
          re.compile(rb'gh[pousr]_[A-Za-z0-9]{30,}'),
          re.compile(rb'github_pat_[A-Za-z0-9_]{30,}'),
          re.compile(rb'AKIA[0-9A-Z]{16}'),
          re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')]
findings=[];count=0
def scan(location,data):
    global count
    count+=1
    if any(p.search(data) for p in patterns):findings.append(location)
paths=subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard']).split(b'\0')
for raw in paths:
    if not raw:continue
    path=Path(raw.decode())
    if path.is_file():scan(str(path),path.read_bytes())
for path in Path('web/dist').rglob('*'):
    if path.is_file():scan(str(path),path.read_bytes())
objects=subprocess.check_output(['git','rev-list','--objects','--all']).decode().splitlines()
for line in objects:
    oid=line.split(' ',1)[0]
    kind=subprocess.check_output(['git','cat-file','-t',oid]).strip()
    if kind==b'blob':scan('git-blob:'+oid,subprocess.check_output(['git','cat-file','blob',oid]))
print(f'Scanned {count} working/history/build objects. Possible secret locations: {len(findings)}')
for finding in findings:print(finding)
raise SystemExit(bool(findings))
