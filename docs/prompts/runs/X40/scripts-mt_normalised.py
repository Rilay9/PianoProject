"""Read-only: which MuseTrainer rows the importer normalises (converts) and which it copies verbatim,
with the source file's tempo statements beside the built file's (X40 item 2's 'source' side for MT)."""
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main_xml(path: Path) -> str:
    z = zipfile.ZipFile(path)
    try:
        name = re.search(r'full-path="([^"]+)"', z.read('META-INF/container.xml').decode()).group(1)
    except (KeyError, AttributeError):
        name = [n for n in z.namelist() if not n.startswith('META-INF')][0]
    return z.read(name).decode('utf-8', 'replace')


table = json.loads((ROOT / 'content/sources/musetrainer.json').read_text(encoding='utf-8'))['items']
catalog = {r['id']: r for r in json.loads((ROOT / 'app/public/content/catalog.json').read_text(encoding='utf-8'))
           if 'musetrainer' in (r.get('tags') or [])}
out = {}
for filename, spec in table.items():
    if 'id' not in spec:
        continue
    src = main_xml(ROOT / 'content/scores/imported/musetrainer/scores' / filename)
    row = catalog.get(spec['id'], {})
    reasons = []
    if src.count('<score-part ') > 1:
        reasons.append(f"{src.count('<score-part ')} separate parts")
    if '<sound tempo=' not in src and '<metronome' not in src:
        reasons.append('no tempo of its own')
    built = main_xml(ROOT / 'app/public/content' / row['file']) if row.get('file') else ''
    first_src = re.search(r'<sound tempo="([0-9.]+)"', src)
    out[spec['id']] = {
        'file': filename,
        'normalised': reasons,
        'verbatim': bool(built) and built == src,
        'sourceSoftware': re.findall(r'<software>([^<]*)</software>', src),
        'builtSoftware': re.findall(r'<software>([^<]*)</software>', built),
        'sourceSounds': len(re.findall(r'<sound[^>]*tempo=', src)),
        'builtSounds': len(re.findall(r'<sound[^>]*tempo=', built)),
        'sourceMetronomes': src.count('<metronome'),
        'builtMetronomes': built.count('<metronome'),
        'sourceFirstSound': float(first_src.group(1)) if first_src else None,
        'tags': row.get('tags'),
    }
Path(ROOT / 'build/x40/mt-sources.json').write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding='utf-8')
for rid, o in out.items():
    if o['normalised'] or not o['verbatim']:
        print(rid, o)
print(sum(1 for o in out.values() if o['verbatim']), 'verbatim of', len(out))
