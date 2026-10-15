"""Step 2 of building the catalogue: choose the pieces and copy their files out of the archive.

Kept (read from the notes by scan.py, never from PDMX.csv's columns): piano on two staves (one part) and lead sheets
(one part, one staff, chord symbols). Uploads of one piece are grouped by their title and checked composer; groups are
taken in order of MuseScore views (the one CSV column used, and shown only as a view count) until the byte budget the
owner was told (about 25 MB) is spent: piano 21 MB with at most two uploads a piece, lead sheets 4 MB with one. The app's own scores are left out (they are PDMX
files already).

Composer: shown only when it matches composers.json (the old app's table, reused), and then as the full name only if
the file gave more than a bare surname ("Bach" stays "Bach": several Bachs). Otherwise blank, never guessed.

    python -I select_pieces.py <scan.jsonl> <PDMX.csv> <mxl.tar.gz> <app scores/index.json> <out dir>

Writes <out dir>/chosen.json (one row per file, with what scan.py read) and <out dir>/files/<sha12>.mxl.

full_set.py (the whole set for the phone) reuses composer_table, checked_composer and title_of. Two limits found there
at full scale that this catalogue's grouping still has: fold() keeps a-z and digits only, so titles in other scripts
fold to "" and group together; and title + composer alone groups different pieces under a generic title ("Minuet").
full_set.py folds with every script's letters and also asks the openings to agree.
"""

import csv
import json
import os
import re
import sys
import tarfile
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
BUDGET = {'piano': 21_000_000, 'lead': 4_000_000}  # bytes of MXL; ~25 MB in all (what the owner was told); piano first
PER_GROUP = {'piano': 2, 'lead': 1}  # lead sheets: many near-identical tune uploads, so one each

NOISE = re.compile(r"\b(composed by|composer|written by|music by|arranged by|arrangement by|transcribed by|transcription by|edited by|by)\b", re.I)
YEARS = re.compile(r"[\(\[]?\s*\b(1\d{3}|20\d{2})\b(\s*[-–—]\s*\b(1\d{3}|20\d{2}|\d{2})\b)?\s*[\)\]]?")


def fold(s):
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.split(r"\barr\b\.?|\barranged\b|\btranscr", s)[0]  # the composer, not the arranger after "arr."
    s = YEARS.sub(' ', s)
    s = NOISE.sub(' ', s)
    s = re.sub(r"[^a-z0-9 ]+", ' ', s)
    return ' '.join(s.split())


def composer_table():
    d = json.load(open(os.path.join(HERE, 'composers.json'), encoding='utf8'))
    table = {}
    for c in d['composers']:
        for a in c['aliases']:
            table[fold(a)] = c['canonical']
    trad = {fold(a) for a in d['traditionalAliases']}
    return table, trad


def checked_composer(raw, table, trad):
    f = fold(raw or '')
    if not f:
        return ''
    if f in trad:
        return 'Traditional'
    canon = table.get(f)
    if not canon:
        return ''
    if ' ' not in f:  # a bare surname: shown as such (several composers share one)
        return canon.split()[-1]
    return canon


def title_of(r, csv_row):
    t = r.get('titlePrinted') or r.get('workTitle') or r.get('movementTitle') or (csv_row or {}).get('title') or ''
    t = ' '.join(t.split()).strip('"“”~*_ ')  # (wrapping quotes and decoration an uploader added)
    if len(t) > 1 and t[0] in "'‘" and t[-1] in "'’":  # single quotes only when they wrap it ("Rockin'" keeps its own)
        t = t[1:-1].strip()
    return t if t and t.upper() != 'NA' else ''


def group_key(title, composer):
    t = fold(title)
    t = re.sub(r"\b(for )?(easy |simple |beginner )?(piano|solo|piano solo|version|arrangement|lead sheet)\b", ' ', t)
    return ' '.join(t.split()) + '|' + fold(composer)


def main(scan_path, csv_path, tar_path, app_index, out_dir):
    table, trad = composer_table()
    app_cids = {os.path.basename(p['source']['mxl'])[:-4] for p in json.load(open(app_index, encoding='utf8')) if p.get('source', {}).get('mxl')}
    meta = {}
    with open(csv_path, encoding='utf8', newline='') as f:
        for row in csv.DictReader(f):
            meta[row['mxl'].lstrip('./')] = {k: row[k] for k in ('title', 'composer_name', 'n_views', 'license', 'is_draft')}
    groups = {}
    with open(scan_path, encoding='utf8') as f:
        for line in f:
            r = json.loads(line)
            if 'error' in r or r['cid'] in app_cids or r.get('parts') != 1:
                continue
            kind = 'piano' if r['staves'] == 2 else 'lead' if r['staves'] == 1 and r['chords'] else None
            if not kind:
                continue
            m = meta.get(r['member'])
            if m and m['is_draft'] == 'True':
                continue
            title = title_of(r, m)
            if not title:
                continue
            composer = checked_composer(r.get('composer') or '', table, trad) or checked_composer((m or {}).get('composer_name', ''), table, trad)
            views = int(float(m['n_views'])) if m and m['n_views'] not in ('', 'NA') else 0
            licence = m['license'] if m and m['license'] not in ('', 'NA') else ''
            key = (kind, group_key(title, composer))
            groups.setdefault(key, []).append({**r, 'kind': kind, 'title': title, 'composerChecked': composer, 'views': views, 'licence': licence})
    chosen, spent, gid = [], {'piano': 0, 'lead': 0}, 0
    order = sorted(groups.items(), key=lambda kv: -max(x['views'] for x in kv[1]))
    seen_hash = set()
    for (kind, _), rows in order:
        if spent[kind] >= BUDGET[kind]:
            continue
        rows = sorted(rows, key=lambda x: -x['views'])
        picked = []
        for x in rows:
            if x['sha256'] in seen_hash:
                continue  # the same file uploaded twice
            picked.append(x)
            seen_hash.add(x['sha256'])
            if len(picked) == PER_GROUP[kind]:
                break
        size = sum(x['size'] for x in picked)
        if spent[kind] + size > BUDGET[kind]:
            continue
        spent[kind] += size
        for x in picked:
            chosen.append({**x, 'group': gid})
        gid += 1
    print(f"groups: {gid} ({sum(1 for c in chosen if c['kind'] == 'piano')} piano files, {sum(1 for c in chosen if c['kind'] == 'lead')} lead-sheet files); bytes {spent}", flush=True)
    os.makedirs(os.path.join(out_dir, 'files'), exist_ok=True)
    want = {c['member']: c for c in chosen}
    got = 0
    with tarfile.open(tar_path, 'r|gz') as tf:
        for m in tf:
            c = want.get(m.name)
            if not c:
                continue
            data = tf.extractfile(m).read()
            name = c['sha256'][:12] + '.mxl'
            with open(os.path.join(out_dir, 'files', name), 'wb') as out:
                out.write(data)
            c['file'] = name
            got += 1
            if got == len(want):
                break
    json.dump([c for c in chosen if 'file' in c], open(os.path.join(out_dir, 'chosen.json'), 'w', encoding='utf8'), ensure_ascii=False)
    print(f'copied {got} of {len(want)} files', flush=True)


if __name__ == '__main__':
    main(*sys.argv[1:6])
