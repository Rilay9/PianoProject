"""U119: per failed test in a Playwright list log, its soft-failure messages and the hard failure. Usage: python failures.py <log>"""
import re
import sys

text = open(sys.argv[1], encoding='utf-8', errors='replace').read()
# Failure blocks start with "  N) path:line:col › ... ───"
blocks = re.split(r'\n  (\d+)\) ', text)
out = []
for i in range(1, len(blocks), 2):
    body = blocks[i + 1]
    title = body.split('\n', 1)[0]
    title = re.sub(r'\s*─+\s*$', '', title)
    title = title.split(' › ')[-1]
    msgs = []
    for m in re.finditer(r'Error: (.+)', body):
        line = m.group(1).strip()
        if line not in msgs:
            msgs.append(line)
    for m in re.finditer(r'(TimeoutError: [^\n]+)', body):
        msgs.append(m.group(1))
    inter = re.findall(r'<(\w+) id="([^"]+)"[^>]*>[^\n]*?intercepts pointer events', body)
    if inter:
        msgs.append('intercepted by: ' + ', '.join(sorted({f'#{b}' for _, b in inter})))
    # expected/received lines after toEqual failures
    for m in re.finditer(r'(\+ Received\s+\+\d+\n(?:.*\n){1,12})', body):
        pass
    for m in re.finditer(r'\n\s+\+\s+"([^"]+)",?', body):
        s = '  + ' + m.group(1)
        if s not in msgs:
            msgs.append(s)
    out.append(f'* {title}\n    ' + '\n    '.join(msgs))
print('\n'.join(out))
