"""Read-only: the title of each named PDMX pool file (to see which piece writes 68.1 / 74.1 beside a printed 68 / 74)."""
import re
import sys
import zipfile
from pathlib import Path

roots = [Path(p) for p in sys.argv[2:]]
for name in sys.argv[1].split(','):
    for root in roots:
        hits = list(root.rglob(name))
        if not hits:
            continue
        with zipfile.ZipFile(hits[0]) as z:
            inner = [n for n in z.namelist() if not n.startswith('META-INF') and n.endswith(('.xml', '.musicxml'))]
            text = z.read(inner[0]).decode('utf-8', 'replace')
        title = ' | '.join(re.findall(r'<(?:work-title|movement-title)[^>]*>([^<]*)<', text))
        software = ' | '.join(re.findall(r'<software>([^<]*)<', text))
        sys.stdout.buffer.write(f"{name}: {title} ({software})\n".encode('utf-8'))
        break
