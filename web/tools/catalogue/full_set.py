"""The full PDMX set for the phone (owner, 2026-10-15: a third tab in Music, Full PDMX; chosen at setup as piano + lead
sheets + melodies, or everything). PC side: flags read from each file's notes, versions folded, the phone's piece list
and the zip files the phone copies.

Everything here comes from scan.py's reading of the notes (the same reading as the app's facts.ts: on 5,990 random
files the two agree on kind, bars, key, time, chords and range). From PDMX.csv only what the catalogue takes: the
upload's title when the file has none, the composer typed by the uploader (shown only when it matches
composers.json), MuseScore's view count and the licence. Never PDMX's genre, difficulty, tags, ratings or its
validity columns.

    python -I full_set.py rows <scan.jsonl> <PDMX.csv> <out dir>      -> <out>/rows.jsonl (one line a readable file)
    python -I full_set.py zips <out dir> <mxl.tar.gz>                  -> <out>/pdmx-a1..3.zip, pdmx-b1..2.zip, index-<kind>.json
    python -I full_set.py index <out dir>                               rewrites index-<kind>.json from rows.jsonl + the zips
    python -I full_set.py verify <out dir> [n]                          reads n random files back by offset, and checks the
                                                                        lists inside the zips against the lists beside them
    python -I full_set.py retitle <out dir>                             rows.jsonl's title flags worked out again (then index)
    python -I full_set.py sample <full dir> <sample dir> [n]            a small set made the same way (n files a kind, 300
                                                                        by default) for the app's browser checks

The zips carry their own piece lists (owner, 2026-10-15: the list travels with the zips; nothing is downloaded): after
the .mxl files each zip holds pdmx-zip.json (which zip it is, its set, the build, every zip of the build, the counts)
and index-<kind>.json for each kind it holds (its own rows, the fields of the lists beside the zips). `zips` and
`index` write them.

Flags (FLAGS below): what was found in the file, in words a learner reads. None says anything about difficulty or
the quality of the music. (Tried and dropped: more than 10 notes struck at once. Half the files it caught were real
concert pieces with spread chords: Debussy, Ravel.) Each threshold is explained where it is set; the counts, what was seen when flagged files
were drawn, and PDMX's own columns as a cross-check are in docs/app-features.md §5c (Full PDMX set, PC side).
"""

import csv
import collections
import hashlib
import json
import os
import random
import re
import sys
import tarfile
import unicodedata
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from select_pieces import NOISE, YEARS, checked_composer, composer_table, title_of  # noqa: E402

FLAGS = {
    'empty': 'most bars empty',
    'short': 'under 4 bars of music',
    'overfull': 'most bars longer than the time signature',
    'range': 'notes outside the piano',
    'hand': 'one staff has no notes',
    'notitle': 'no title',
    'test': 'the title says test, draft or unfinished',
}

# Hidden in the app's list until asked for (owner, 2026-10-15: "hide by default the broken and junk ones"); the others
# are labelled on the row. The phone reads this list from each zip's manifest.
HIDE = ['empty', 'short', 'overfull', 'test']

# Titles that name nothing: MuseScore's defaults and the placeholder a choral collection printed ("#", 2,527 files,
# their real title is the upload's). "Gan ainm" / "No name" are the folk tradition's name for a tune without one: kept.
PLACEHOLDER = {'', '#', '- # -', 'title', 'untitled', 'untitled score', 'na', 'score', 'new score'}
HAS_WORD = re.compile(r'[^\W_]')  # a letter or a digit, in any script
TEST = re.compile(r"\btest(s|ing)?\b|\bdraft\b|\bwip\b|\bwork in progress\b|\bunfinished\b|\bincomplete\b", re.I)


def kind_of(r):
    """facts.ts's kind: several parts (or more than two staves), piano (two staves), lead sheet (chords), melody."""
    return 'parts' if r['parts'] > 1 or r['staves'] > 2 else 'piano' if r['staves'] == 2 else 'lead' if r['chords'] else 'melody'


def full_title(r, meta):
    """The catalogue's title (printed, work, movement, then the upload's), skipping placeholders at every step."""
    rr = {f: ('' if (r.get(f) or '').strip().lower() in PLACEHOLDER else r.get(f)) for f in ('titlePrinted', 'workTitle', 'movementTitle')}
    m = dict(meta or {})
    if (m.get('title') or '').strip().lower() in PLACEHOLDER:
        m['title'] = ''
    t = title_of(rr, m)
    return '' if t.strip().lower() in PLACEHOLDER else t


def flags_of(r, title):
    """The flags for one scan row (with scan.py's 2026-10-15 facts) and its title."""
    k = kind_of(r)
    f = []
    measures = max(1, r['measures'])
    # "Most" means more than half: the flag's own words set it.
    if r['emptyBars'] * 2 > measures:
        f.append('empty')
    # A phrase, the smallest complete unit of a tune, is four bars (the standard phrase; Caplin, Classical Form,
    # 1998). Fewer bars with notes than that is a fragment.
    short = measures - r['emptyBars'] < 4
    # Bars run over their time signature (in every part; the share counts part-bars). Among files with any over-long
    # bar the share is bimodal across PDMX: one odd bar (2,131 files at 0.10-0.15) or nearly all (1,763 at 0.9-1.0),
    # with the valley at 0.45-0.5 (85 files). "Most" (over half) sits in that valley.
    if r['overBars'] * 2 > measures * max(1, len(r.get('partNotes') or [1])):
        f.append('overfull')
    elif short:  # a whole piece crammed into one or two over-long bars is overfull, not short
        f.append('short')
    if k != 'parts':  # several parts: written pitches of transposing instruments are not the piano's
        if r['low'] < 21 or r['high'] > 108:  # a piano's keys: A0 (21) to C8 (108)
            f.append('range')
    if k == 'piano' and min(r['staffNotes']) == 0:  # a fact, no threshold (a staff with 1-3 notes is not caught)
        f.append('hand')
    return f + title_flags(title)


def title_flags(title):
    """No title (none, or no letter or digit in any script: "-", "------------", re-check 2026-10-15 P15), or one that says
    it is a test."""
    if not HAS_WORD.search(title or ''):
        return ['notitle']
    return ['test'] if TEST.search(title) else []


def retitle(out_dir):
    """rows.jsonl again with the title flags worked out anew (title_flags changed), nothing else; then `index`."""
    path = os.path.join(out_dir, 'rows.jsonl')
    rows = [json.loads(line) for line in open(path, encoding='utf8')]
    changed = 0
    for r in rows:
        flags = [x for x in r['flags'] if x not in ('notitle', 'test')] + title_flags(r['title'])
        if flags != r['flags']:
            changed += 1
            r['flags'] = flags
    with open(path, 'w', encoding='utf8') as out:
        for r in rows:
            out.write(json.dumps(r, ensure_ascii=False) + '\n')
    print(f'{changed} of {len(rows)} rows have new title flags', flush=True)


def fold(s):
    """select_pieces.fold, keeping letters of every script (it kept a-z only, so all CJK or Cyrillic titles were one)."""
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.split(r"\barr\b\.?|\barranged\b|\btranscr", s)[0]
    s = YEARS.sub(' ', s)
    s = NOISE.sub(' ', s)
    s = re.sub(r"[\W_]+", ' ', s)
    return ' '.join(s.split())


def title_key(title):
    t = fold(title)
    t = re.sub(r"\b(for )?(easy |simple |beginner )?(piano|solo|piano solo|version|arrangement|lead sheet)\b", ' ', t)
    return ' '.join(t.split())


OPENING = 4  # steps of the opening two same-titled uploads must share to fold (the knee measured in docs §5c)


class Groups:
    """Union-find over file indexes."""

    def __init__(self, n):
        self.up = list(range(n))

    def find(self, i):
        while self.up[i] != i:
            self.up[i] = self.up[self.up[i]]
            i = self.up[i]
        return i

    def join(self, a, b):
        a, b = self.find(a), self.find(b)
        if a != b:
            self.up[max(a, b)] = min(a, b)


def group(rows):
    """Uploads of one piece fold into one row: within a kind, the same title (folded) and checked composer whose
    openings agree, or the same notes whatever the title (re-uploads). Sets row['group'] to a number."""
    g = Groups(len(rows))
    first = {}
    for i, r in enumerate(rows):
        keys = [('notes', r['kind'], r['notesHash'])]
        if r['title'] and len(r['opening']) >= OPENING:  # no opening to compare (an empty first part): notes only
            keys.append(('title', r['kind'], title_key(r['title']), fold(r['composer']), tuple(r['opening'][:OPENING])))
        for k in keys:
            if k in first:
                g.join(first[k], i)
            else:
                first[k] = i
    ids = {}
    for i, r in enumerate(rows):
        r['group'] = ids.setdefault(g.find(i), len(ids))
    return len(ids)


LICENCE = {'publicdomain': 'Public Domain Mark', 'cc-zero': 'CC0'}  # as build_index.cjs words them


def make_rows(scan_path, csv_path, out_dir):
    table, trad = composer_table()
    meta = {}
    with open(csv_path, encoding='utf8', newline='') as f:
        for row in csv.DictReader(f):
            meta[row['mxl'].lstrip('./')] = {k: row[k] for k in ('title', 'composer_name', 'n_views', 'license')}
    rows, unreadable = [], 0
    with open(scan_path, encoding='utf8') as f:
        for line in f:
            r = json.loads(line)
            if 'error' in r:
                unreadable += 1  # the app couldn't read it either: left out
                continue
            m = meta.get(r['member']) or {}
            title = full_title(r, m)
            k = kind_of(r)
            composer = checked_composer(r.get('composer') or '', table, trad) or checked_composer(m.get('composer_name', ''), table, trad)
            views = int(float(m['n_views'])) if m.get('n_views') not in (None, '', 'NA') else 0
            licence = m.get('license') if m.get('license') not in (None, '', 'NA') else ''
            rows.append({
                'id': r['sha256'][:12], 'file': r['sha256'][:12] + '.mxl', 'title': title, 'composer': composer, 'kind': k,
                'fifths': r['fifths'], 'mode': r['mode'], 'keyChanges': int(r['keyChanges']), 'time': r['time'],
                'timeChanges': int(r['timeChanges']), 'bars': r['bars'],
                'low': None if k == 'parts' else r['low'], 'high': None if k == 'parts' else r['high'],  # as facts.ts
                'chords': int(r['chords']), 'views': views, 'licence': LICENCE.get(licence, licence), 'bytes': r['size'],
                'flags': flags_of(r, title), 'member': r['member'], 'sha256': r['sha256'],
                'notesHash': r['notesHash'], 'opening': r['opening'],
            })
    n = group(rows)
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'rows.jsonl'), 'w', encoding='utf8') as out:
        for r in rows:
            out.write(json.dumps(r, ensure_ascii=False) + '\n')
    print(f'{len(rows)} files ({unreadable} unreadable left out), {n} pieces after folding', flush=True)


# The phone's piece list: the catalogue index's fields (web/public/catalogue/index.json), then the flags and where the
# file sits: which zip, and the byte offset of its data in it (its length is `bytes`: the zips are stored, not
# compressed, so the bytes are the .mxl itself).
FIELDS = ['id', 'file', 'title', 'composer', 'kind', 'fifths', 'mode', 'keyChanges', 'time', 'timeChanges', 'bars', 'low',
          'high', 'chords', 'views', 'group', 'licence', 'bytes', 'flags', 'zip', 'offset']
ZIP_MAX_FILES = 65535  # a zip without the Zip64 extension holds at most 65,535 entries (PKWARE APPNOTE 4.4.21)
SETS = [('pdmx-a', ('piano', 'lead', 'melody')), ('pdmx-b', ('parts',))]  # setup: a = 0.8 GB choice; a + b = everything


def make_zips(out_dir, tar_path):
    rows = [json.loads(line) for line in open(os.path.join(out_dir, 'rows.jsonl'), encoding='utf8')]
    by_member = {r['member']: r for r in rows}
    zips, zip_set = [], {}  # names in order; each zip's setup choice
    where = {}  # member -> zip name
    for prefix, kinds in SETS:
        members = [r['member'] for r in rows if r['kind'] in kinds]
        k = -(-len(members) // ZIP_MAX_FILES)  # fewest zips that stay within the entry limit, files shared evenly
        per = -(-len(members) // k)
        for j in range(k):
            name = f'{prefix}{j + 1}.zip'
            zips.append(name)
            zip_set[name] = prefix
            for mem in members[j * per:(j + 1) * per]:
                where[mem] = name
    handles = {z: zipfile.ZipFile(os.path.join(out_dir, z), 'w', zipfile.ZIP_STORED, allowZip64=False) for z in zips}
    done = 0
    with tarfile.open(tar_path, 'r|gz') as tf:
        for m in tf:
            r = by_member.get(m.name)
            if not r:
                continue
            data = tf.extractfile(m).read()
            if hashlib.sha256(data).hexdigest() != r['sha256']:
                raise SystemExit(f'{m.name}: the archive changed since scan.py read it')
            info = zipfile.ZipInfo(r['file'], date_time=(2026, 10, 15, 0, 0, 0))
            info.compress_type = zipfile.ZIP_STORED
            handles[where[m.name]].writestr(info, data)
            done += 1
            if done % 20000 == 0:
                print(f'{done} of {len(rows)} packed', flush=True)
    for h in handles.values():
        h.close()
    for z in zips:
        print(z, os.path.getsize(os.path.join(out_dir, z)), 'bytes', sum(1 for r in rows if where[r['member']] == z), 'files', flush=True)
    write_index(out_dir)


def zip_names(out_dir):
    return [f'{prefix}{j}.zip' for prefix, _ in SETS for j in range(1, 100) if os.path.exists(os.path.join(out_dir, f'{prefix}{j}.zip'))]


# The piece list travels inside the zips (owner, 2026-10-15: nothing downloaded, nothing big in the repo): each zip
# ends with a small manifest naming itself and the whole build, and its own rows, one member a kind, so the phone
# reads only the kinds it shows. They are written after the .mxl files, so no file's offset moves; written again,
# the old ones are cut off first.
MANIFEST = 'pdmx-zip.json'
LIST = 'index-{}.json'


def is_list(name):
    return name == MANIFEST or (name.startswith('index-') and name.endswith('.json'))


def build_of(out_dir):
    """The build's name: the start of rows.jsonl's SHA-256 (groups and flags come from it), so the phone can refuse
    zips of two different builds mixed."""
    h = hashlib.sha256()
    with open(os.path.join(out_dir, 'rows.jsonl'), 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()[:12]


def write_lists(path, members):
    """Puts members (name -> bytes) at the end of the zip at path, after its .mxl files, replacing lists written
    before (cut off where the first of them began: they always follow every .mxl)."""
    zf = zipfile.ZipFile(path, 'a', zipfile.ZIP_STORED, allowZip64=False)
    try:
        old = [i for i in zf.infolist() if is_list(i.filename)]
        if old:
            cut = min(i.header_offset for i in old)
            if any(i.header_offset > cut for i in zf.infolist() if not is_list(i.filename)):
                raise SystemExit(f'{path}: a list sits before a score file; make the zips again')
            # (zipfile has no delete: forget the old entries and write from where the first began; the central
            # directory is written after the new ones and, in mode 'a', the file is cut there on close)
            for i in old:
                zf.filelist.remove(i)
                del zf.NameToInfo[i.filename]
            zf.start_dir = cut
            zf.fp.seek(cut)
            zf._didModify = True
        for name, data in members.items():
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 15, 0, 0, 0))
            info.compress_type = zipfile.ZIP_STORED
            zf.writestr(info, data)
    finally:
        zf.close()


def write_index(out_dir):
    """The piece lists, one a kind (index-piano.json ...): the phone set up with piano, lead sheets and melodies reads
    three and never parses the several-parts list. Each file's zip and data offset are read back from the zips
    themselves (the local header: 30 bytes + name + extra field). The same lists, each zip's own rows, go inside the
    zips (write_lists); the files beside them stay for the PC and for verify."""
    rows = [json.loads(line) for line in open(os.path.join(out_dir, 'rows.jsonl'), encoding='utf8')]
    zips = zip_names(out_dir)
    build = build_of(out_dir)
    found = {}
    for zi, z in enumerate(zips):
        with open(os.path.join(out_dir, z), 'rb') as raw, zipfile.ZipFile(os.path.join(out_dir, z)) as zf:
            for info in zf.infolist():
                if is_list(info.filename):
                    continue
                raw.seek(info.header_offset)
                head = raw.read(30)
                n, e = int.from_bytes(head[26:28], 'little'), int.from_bytes(head[28:30], 'little')
                if info.filename in found:
                    raise SystemExit(f'{info.filename} is in two zips (two files share a SHA-256 start)')
                found[info.filename] = (zi, info.header_offset + 30 + n + e, info.file_size)
    zip_set = {z: next(p for p, _ in SETS if z.startswith(p)) for z in zips}
    by_kind, by_zip_kind = {}, {}
    for r in rows:
        zi, off, size = found[r['file']]
        if size != r['bytes']:
            raise SystemExit(f"{r['file']}: {size} bytes in the zip, {r['bytes']} read by scan.py")
        r['zip'], r['offset'] = zi, off
        row = [' '.join(r['flags']) if f == 'flags' else r[f] for f in FIELDS]
        by_kind.setdefault(r['kind'], []).append(row)
        by_zip_kind.setdefault((zi, r['kind']), []).append(row)
    kinds = [k for k in ('piano', 'lead', 'melody', 'parts') if k in by_kind]
    gi = FIELDS.index('group')
    fi = FIELDS.index('flags')
    shown = lambda rows_: {row[gi] for row in rows_ if not set((row[fi] or '').split()) & set(HIDE)}  # noqa: E731
    counts = {k: {'files': len(by_kind[k]), 'pieces': len({row[gi] for row in by_kind[k]}), 'shown': len(shown(by_kind[k]))} for k in kinds}
    common = {'version': '2026-10-15', 'build': build, 'source': 'PDMX (MuseScore uploads), read by web/tools/catalogue/full_set.py',
              'fields': FIELDS, 'flags': FLAGS}
    zip_list = [{'name': z, 'set': zip_set[z], 'files': sum(len(rs) for (j, _), rs in by_zip_kind.items() if j == i)} for i, z in enumerate(zips)]
    for zi, z in enumerate(zips):
        mine = [k for k in kinds if (zi, k) in by_zip_kind]
        members = {MANIFEST: json.dumps({**common, 'zip': z, 'set': zip_set[z], 'zips': zip_list, 'kinds': mine, 'counts': counts, 'hide': HIDE,
                                         'sets': {p: list(ks) for p, ks in SETS}}, ensure_ascii=False, separators=(',', ':')).encode('utf8')}
        for k in mine:
            members[LIST.format(k)] = json.dumps({**common, 'zips': zip_list, 'kind': k, 'zip': z, 'rows': by_zip_kind[(zi, k)]},
                                                 ensure_ascii=False, separators=(',', ':')).encode('utf8')
        write_lists(os.path.join(out_dir, z), members)
        print(f'{z}: lists for {", ".join(mine)} written inside ({sum(len(v) for v in members.values())} bytes)', flush=True)
    head = {**common, 'zips': [{'name': z, 'bytes': os.path.getsize(os.path.join(out_dir, z)), 'set': zip_set[z]} for z in zips]}
    for k in kinds:
        with open(os.path.join(out_dir, f'index-{k}.json'), 'w', encoding='utf8') as out:
            json.dump({**head, 'kind': k, 'rows': by_kind[k]}, out, ensure_ascii=False, separators=(',', ':'))
        print(f'index-{k}.json: {len(by_kind[k])} files, {os.path.getsize(os.path.join(out_dir, f"index-{k}.json"))} bytes', flush=True)


def read_member(path, name):
    """A member's bytes, read as the phone reads them: found in the central directory, then the stored data."""
    with zipfile.ZipFile(path) as zf:
        info = zf.getinfo(name)
    with open(path, 'rb') as raw:
        raw.seek(info.header_offset)
        head = raw.read(30)
        n, e = int.from_bytes(head[26:28], 'little'), int.from_bytes(head[28:30], 'little')
        raw.seek(info.header_offset + 30 + n + e)
        return raw.read(info.file_size)


def verify(out_dir, n=50):
    """Read n random files back by offset and length, as the phone will, and compare their SHA-256 with scan.py's;
    then the lists inside each zip: the same rows as the lists beside them, each row in the zip that holds it, one
    build throughout, the lists after every score file."""
    index = {'rows': []}
    kinds = [k for k in ('piano', 'lead', 'melody', 'parts') if os.path.exists(os.path.join(out_dir, f'index-{k}.json'))]
    for k in kinds:
        part = json.load(open(os.path.join(out_dir, f'index-{k}.json'), encoding='utf8'))
        index = {**part, 'rows': index['rows'] + part['rows']}
    f = {name: i for i, name in enumerate(index['fields'])}
    sha = {}
    for line in open(os.path.join(out_dir, 'rows.jsonl'), encoding='utf8'):
        r = json.loads(line)
        sha[r['id'] + r['file']] = r['sha256']
    random.seed()
    bad = 0
    picked = random.sample(index['rows'], min(n, len(index['rows'])))
    for row in picked:
        z = index['zips'][row[f['zip']]]['name']
        with open(os.path.join(out_dir, z), 'rb') as raw:
            raw.seek(row[f['offset']])
            data = raw.read(row[f['bytes']])
        ok = hashlib.sha256(data).hexdigest() == sha[row[f['id']] + row[f['file']]]
        bad += not ok
        if not ok:
            print('MISMATCH', z, row[f['file']])
    print(f'{len(picked) - bad} of {len(picked)} read back by offset match their SHA-256 (zips: {", ".join(sorted({index["zips"][r[f["zip"]]]["name"] for r in picked}))})')
    inside, problems, builds = [], [], set()
    for zi, zd in enumerate(index['zips']):
        path = os.path.join(out_dir, zd['name'])
        m = json.loads(read_member(path, MANIFEST))
        builds.add(m['build'])
        if m['zip'] != zd['name'] or m['set'] != zd['set']:
            problems.append(f"{zd['name']}: its manifest says {m['zip']} / {m['set']}")
        n_rows = 0
        for k in m['kinds']:
            lst = json.loads(read_member(path, LIST.format(k)))
            if lst['fields'] != index['fields'] or lst['build'] != m['build']:
                problems.append(f"{zd['name']} {k}: fields or build differ")
            for row in lst['rows']:
                if row[f['zip']] != zi or row[f['kind']] != k:
                    problems.append(f"{zd['name']}: row {row[f['id']]} names zip {row[f['zip']]} kind {row[f['kind']]}")
            n_rows += len(lst['rows'])
            inside += lst['rows']
        if n_rows != m['zips'][zi]['files']:
            problems.append(f"{zd['name']}: {n_rows} rows inside, the manifest says {m['zips'][zi]['files']}")
        with zipfile.ZipFile(path) as zf:
            scores = [i for i in zf.infolist() if not is_list(i.filename)]
            last = max(i.header_offset for i in scores)
            if any(i.header_offset < last for i in zf.infolist() if is_list(i.filename)):
                problems.append(f"{zd['name']}: a list sits before a score file")
            if len(scores) != n_rows:
                problems.append(f"{zd['name']}: {len(scores)} score files, {n_rows} rows")
    as_text = [json.dumps(r, ensure_ascii=False) for r in inside]
    beside = [json.dumps(r, ensure_ascii=False) for r in index['rows']]
    if sorted(as_text) != sorted(beside):
        problems.append(f'the lists inside the zips ({len(inside)} rows) differ from the lists beside them ({len(index["rows"])})')
    if len(builds) != 1 or builds != {index.get('build')}:
        problems.append(f'builds: {builds} inside, {index.get("build")} beside')
    print(f'lists inside the zips: {len(inside)} rows in {len(index["zips"])} zips, build {index.get("build")}: '
          + ('all agree with the lists beside them' if not problems else 'PROBLEMS\n  ' + '\n  '.join(problems[:20])))
    if bad or problems:
        sys.exit(1)


def make_sample(full_dir, out_dir, n=300):
    """A small set made like the full one, for the app's committed browser checks (never the 2 GB): per kind, n files
    (the most viewed tenth, up to 5 of every flag, up to 4 whole groups of 3-8 versions, the rest at random; seeded,
    so the same every time), copied by offset out of the full set's zips into zips named and split as there (3 + 2),
    then listed as `index` lists them."""
    rows = [json.loads(line) for line in open(os.path.join(full_dir, 'rows.jsonl'), encoding='utf8')]
    full = {}
    for k in ('piano', 'lead', 'melody', 'parts'):
        part = json.load(open(os.path.join(full_dir, f'index-{k}.json'), encoding='utf8'))
        fi = {name: i for i, name in enumerate(part['fields'])}
        zips = [z['name'] for z in part['zips']]
        for row in part['rows']:
            full[row[fi['file']]] = (zips[row[fi['zip']]], row[fi['offset']], row[fi['bytes']])
    rnd = random.Random(20261015)
    chosen = []
    for kind in ('piano', 'lead', 'melody', 'parts'):
        mine = [r for r in rows if r['kind'] == kind]
        take = {}
        for r in sorted(mine, key=lambda r: -r['views'])[: n // 10]:
            take[r['file']] = r
        for flag in FLAGS:
            flagged = [r for r in mine if flag in r['flags']]
            for r in rnd.sample(flagged, min(5, len(flagged))):
                take[r['file']] = r
        groups = collections.defaultdict(list)
        for r in mine:
            groups[r['group']].append(r)
        multi = [g for g in groups.values() if 3 <= len(g) <= 8]
        for g in rnd.sample(multi, min(4, len(multi))):
            for r in g:
                take[r['file']] = r
        rest = [r for r in mine if r['file'] not in take]
        for r in rnd.sample(rest, max(0, n - len(take))):
            take[r['file']] = r
        chosen += list(take.values())
        print(f'{kind}: {len(take)} files', flush=True)
    os.makedirs(out_dir, exist_ok=True)
    for name in os.listdir(out_dir):
        if name.endswith('.zip') or name.endswith('.json') or name == 'rows.jsonl':
            os.remove(os.path.join(out_dir, name))
    with open(os.path.join(out_dir, 'rows.jsonl'), 'w', encoding='utf8') as out:
        for r in chosen:
            out.write(json.dumps(r, ensure_ascii=False) + '\n')
    for prefix, kinds in SETS:
        members = [r for r in chosen if r['kind'] in kinds]
        rnd.shuffle(members)  # (as in the full set, a kind's files spread over every zip of its set)
        k = len([z for z in zip_names(full_dir) if z.startswith(prefix)])
        per = -(-len(members) // k)
        for j in range(k):
            with zipfile.ZipFile(os.path.join(out_dir, f'{prefix}{j + 1}.zip'), 'w', zipfile.ZIP_STORED, allowZip64=False) as zf:
                for r in members[j * per:(j + 1) * per]:
                    z, off, size = full[r['file']]
                    with open(os.path.join(full_dir, z), 'rb') as raw:
                        raw.seek(off)
                        data = raw.read(size)
                    if hashlib.sha256(data).hexdigest() != r['sha256']:
                        raise SystemExit(f"{r['file']}: not the file scan.py read (make the full set's lists again)")
                    info = zipfile.ZipInfo(r['file'], date_time=(2026, 10, 15, 0, 0, 0))
                    info.compress_type = zipfile.ZIP_STORED
                    zf.writestr(info, data)
    write_index(out_dir)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'rows':
        make_rows(*sys.argv[2:5])
    elif cmd == 'zips':
        make_zips(*sys.argv[2:4])
    elif cmd == 'index':
        write_index(sys.argv[2])
    elif cmd == 'verify':
        verify(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 50)
    elif cmd == 'retitle':
        retitle(sys.argv[2])
    elif cmd == 'sample':
        make_sample(sys.argv[2], sys.argv[3], int(sys.argv[4]) if len(sys.argv) > 4 else 300)
    else:
        print(__doc__)
