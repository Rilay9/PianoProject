"""Cells where the candidates' run staves differ (from music.txt), to rerun for the freeze's own spread."""
import os
import re

here = os.path.dirname(os.path.abspath(__file__))
cur = None
rows = {}
for line in open(os.path.join(here, 'music.txt'), encoding='utf-8'):
    if line.startswith('## '):
        cur = line[3:].strip()
        rows[cur] = {}
    m = re.match(r'\s+(c\d) rest:.*\| run: stage\s+(\S+) stave\s+(\S+)', line)
    if m and cur:
        rows[cur][m.group(1)] = float(m.group(3)) if m.group(3) != '-' else None
for cell, r in rows.items():
    vals = [v for v in r.values() if v is not None]
    if vals and max(vals) - min(vals) > 0.5:
        print(cell, r)
