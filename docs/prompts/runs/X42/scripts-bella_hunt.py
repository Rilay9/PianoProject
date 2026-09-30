"""Read-only: search mxl files under the given folders for a Bella Ciao title or a `<sound tempo>` of 68.1 / 74.1."""
import re
import sys
import zipfile
from pathlib import Path

hits = 0
seen = 0
for folder in sys.argv[1:]:
    for path in Path(folder).rglob('*.mxl'):
        seen += 1
        try:
            with zipfile.ZipFile(path) as z:
                names = [n for n in z.namelist() if not n.startswith('META-INF') and n.endswith(('.xml', '.musicxml'))]
                text = z.read(names[0]).decode('utf-8', 'replace') if names else ''
        except Exception:
            continue
        title = ' '.join(re.findall(r'<(?:work-title|movement-title|credit-words)[^>]*>([^<]*)<', text))[:120]
        sounds = sorted(set(re.findall(r'<sound[^>]*\btempo="([^"]+)"', text)))
        odd = [s for s in sounds if re.fullmatch(r'\d+\.\d*[1-9]\d*', s) and not s.endswith('.5')]
        if 'bella ciao' in title.lower() or 'bella-ciao' in title.lower():
            hits += 1
            marks = re.findall(r'<per-minute>([^<]*)</per-minute>', text)
            sys.stdout.buffer.write(f"HIT {path.parent.name}/{path.name} | {title} | sounds {sounds[:20]} | marks {marks[:20]}\n".encode('utf-8'))
print('files', seen, 'hits', hits)
