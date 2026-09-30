"""Builds the non-vacuity probe folders for X40's check under build/x40/probes/ (read-only on the build):
  no-maple      - the personal build with Maple Leaf's MuseTrainer file removed;
  one-short     - the personal build with one kern file removed (Maple Leaf's kern edition);
  personal-gap  - the personal build whose catalogue drops g-minor-bach.alt's `file` (a personal row with no file
                  in the personal flavour must not be excused)."""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'app/public/content'
PROBES = ROOT / 'build/x40/probes'
catalog = json.loads((SRC / 'catalog.json').read_text(encoding='utf-8'))
wanted = [r for r in catalog if ('musetrainer' in (r.get('tags') or []) or 'kern' in (r.get('tags') or [])) and r.get('file')]


def make(name: str, drop_file: str | None = None, drop_field: str | None = None) -> None:
    out = PROBES / name
    if out.exists():
        shutil.rmtree(out)
    (out / 'scores/imported').mkdir(parents=True)
    rows = []
    for r in catalog:
        r = dict(r)
        if drop_field and r['id'] == drop_field:
            r.pop('file', None)
        rows.append(r)
    (out / 'catalog.json').write_text(json.dumps(rows), encoding='utf-8')
    for r in wanted:
        if r['file'] == drop_file:
            continue
        shutil.copy2(SRC / r['file'], out / r['file'])
    print(name, 'ready')


make('no-maple', drop_file='scores/imported/song.ragtime.joplin-maple-leaf-rag.mxl')
make('one-short', drop_file='scores/imported/song.ragtime.joplin-maple-leaf-rag.kern.mxl')
make('personal-gap', drop_field='song.beautiful.g-minor-bach.alt')
