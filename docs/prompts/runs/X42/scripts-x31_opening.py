"""
X42, premise 12: what X31's build-side opening reader (`tools/content/difficulty.py` opening_quarter_bpm, music21)
returns for Satie's and Maple Leaf's built files, beside the app's opening before and after X42 (census before/after).
Read-only; nothing in tools/content changes.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, 'tools/content')
from music21 import converter  # noqa: E402

import difficulty  # noqa: E402

before = {json.loads(l)['id']: json.loads(l) for l in Path('build/x42/census/before.jsonl').read_text(encoding='utf-8').splitlines()}
after = {json.loads(l)['id']: json.loads(l) for l in Path('build/x42/census/after.jsonl').read_text(encoding='utf-8').splitlines()}
for ident in ('song.classical.satie-gymnopedie-1', 'song.ragtime.joplin-maple-leaf-rag'):
    score = converter.parse(f'app/public/content/scores/imported/{ident}.mxl')
    marks = [(float(m.getOffsetInHierarchy(score)), m.number, getattr(m, 'text', None)) for m in score.recurse().getElementsByClass('MetronomeMark')][:6]
    build = difficulty.opening_quarter_bpm(score)
    app_before = next((e['bpm'] for e in before[ident]['events'] if e['at'] == '0:0'), None)
    app_after = next((e['bpm'] for e in after[ident]['events'] if e['at'] == '0:0'), None)
    print(f"{ident}: X31 opening_quarter_bpm {build!r}; app opening before {app_before!r}, after {app_after!r}; "
          f"equal before {build == app_before}, after {build == app_after}; music21's first marks (offset, number, text) {marks}")
