"""Run a local command with a key loaded in memory from an explicitly selected file.

Never copies a secret to the repository or prints it. Source file remains unchanged.
"""
import os
import re
import subprocess
import sys
from pathlib import Path
from dotenv import dotenv_values

if len(sys.argv) < 4:
    raise SystemExit("Usage: with_provider.py PATH KEY_VARIABLE COMMAND [ARGS...]")
source, variable, *command = sys.argv[1:]
if variable not in {"OPENAI_API_KEY", "ANTHROPIC_API_KEY"}:
    raise SystemExit("Unsupported credential variable")
data = Path(source).read_text()
pattern = r"sk-ant-[A-Za-z0-9_-]{20,}" if variable == "ANTHROPIC_API_KEY" else r"sk-(?:proj-)?[A-Za-z0-9_-]{20,}"
value = dotenv_values(source).get(variable)
if not value:
    matches = re.findall(pattern, data)
    if len(matches) == 1:
        value = matches[0]
if not value:
    raise SystemExit("No unambiguous credential found in selected file")
environment = os.environ.copy(); environment[variable] = value
raise SystemExit(subprocess.call(command, env=environment))
