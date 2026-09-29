"""Prints what the built catalogue holds for Stage 9's song options and Hot Cross Buns: file,
identity, measured bars — which the browser spec and the pictures rely on."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
catalog = json.loads((ROOT / 'app/public/content/catalog.json').read_text(encoding='utf-8'))
items = catalog['items'] if isinstance(catalog, dict) else catalog
by_id = {item['id']: item for item in items}
stage9 = json.loads((ROOT / 'content/curriculum/stage-9.json').read_text(encoding='utf-8'))
ids = ['song.folk.hot-cross-buns']
for stage in stage9['stages']:
    for unit in stage['units']:
        for lesson in unit['lessons']:
            ids += lesson['songOptions']
for item_id in ids:
    item = by_id.get(item_id)
    if item is None:
        print(item_id, 'NOT IN CATALOGUE')
        continue
    identity = (item.get('provenance') or {}).get('identity') or {}
    print(item_id, '| file:', item.get('file'), '| identity:', identity.get('kind'), '| bars:', (item.get('measurement') or {}).get('bars'))
