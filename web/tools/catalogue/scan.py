"""Step 1 of building the library's catalogue (owner, 2026-10-13): read the notes of every score in PDMX.

Streams the local mxl.tar.gz (MuseScore MXL files, one per upload) and, for each, reads from the MusicXML itself
what the app's facts reader (web/src/library/facts.ts) reads: parts, staves, chord symbols, printed bars, key and
time signatures, the printed and work titles, the composer. Nothing comes from PDMX.csv here: its "piano", genre and
difficulty columns can't be trusted (library-plan research). Output: one JSON line per readable score, with the
file's SHA-256 (the app's id for a file is "u-" + its start, so a catalogue piece and the same file added by hand
are one piece).

    python -I scan.py <mxl.tar.gz> <out.jsonl>

Rerunnable: it resumes after the last member already written.
"""

import hashlib
import io
import json
import os
import sys
import tarfile
import zipfile

from lxml import etree

STEP = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def text(el):
    return (el.text or '').strip() if el is not None else ''


def credit(root, kind):
    for c in root.iter('credit'):
        if any(text(t) == kind for t in c.iter('credit-type')):
            w = c.find('credit-words')
            return text(w).splitlines()[0].strip() if text(w) else ''
    return ''


def read(xml):
    root = etree.fromstring(xml, parser=etree.XMLParser(recover=False, huge_tree=True, resolve_entities=False, no_network=True))
    if root.tag != 'score-partwise':
        return None
    parts = root.findall('part')
    score_parts = root.findall('part-list/score-part')
    first = parts[0] if parts else None
    if first is None:
        return None
    staves = max([int(text(s) or 1) for s in first.iter('staves')] or [1])
    measures = first.findall('measure')
    bars = sum(1 for i, m in enumerate(measures) if i == 0 or m.get('implicit') != 'yes')
    keys = [text(k.find('fifths')) for k in first.iter('key')]
    modes = [text(k.find('mode')) for k in first.iter('key')]
    times = [f"{text(t.find('beats'))}/{text(t.find('beat-type'))}" for t in first.iter('time') if t.find('beats') is not None]
    notes = 0
    low = high = None
    for p in root.iter('pitch'):
        step = STEP.get(text(p.find('step')))
        if step is None:
            continue
        try:
            midi = 12 * (int(text(p.find('octave'))) + 1) + step + int(float(text(p.find('alter')) or 0))
        except ValueError:
            continue
        notes += 1
        low = midi if low is None else min(low, midi)
        high = midi if high is None else max(high, midi)
    if not notes:
        return None
    creator = ''
    for c in root.iter('creator'):
        if c.get('type') == 'composer':
            creator = text(c).splitlines()[0].strip() if text(c) else ''
            break
    return {
        'parts': max(len(parts), len(score_parts)),
        'partNames': [text(sp.find('part-name')) for sp in score_parts][:6],
        'staves': staves,
        'chords': root.find('.//harmony') is not None,
        'lyrics': root.find('.//lyric') is not None,
        'bars': bars,
        'notes': notes,
        'low': low, 'high': high,
        'fifths': int(keys[0]) if keys and keys[0].lstrip('-').isdigit() else None,
        'mode': modes[0] if modes and modes[0] in ('major', 'minor') else None,
        'keyChanges': len(set(keys)) > 1,
        'transposing': first.find('.//attributes/transpose') is not None,
        'time': times[0] if times else None,
        'timeChanges': len(set(times)) > 1,
        'titlePrinted': credit(root, 'title'),
        'workTitle': text(root.find('work/work-title')),
        'movementTitle': text(root.find('movement-title')),
        'composer': creator or credit(root, 'composer'),
    }


def unzip(data):
    z = zipfile.ZipFile(io.BytesIO(data))
    name = None
    if 'META-INF/container.xml' in z.namelist():
        c = etree.fromstring(z.read('META-INF/container.xml'))
        for rf in c.iter('{*}rootfile', 'rootfile'):
            name = rf.get('full-path')
            break
    if not name:
        name = next((n for n in z.namelist() if not n.startswith('META-INF/') and n.lower().endswith(('.xml', '.musicxml'))), None)
    return z.read(name) if name else None


def main(tar_path, out_path):
    done = set()
    if os.path.exists(out_path):
        with open(out_path, encoding='utf8') as f:
            for line in f:
                try:
                    done.add(json.loads(line)['member'])
                except (ValueError, KeyError):
                    pass
    seen = bad = 0
    with tarfile.open(tar_path, 'r|gz') as tf, open(out_path, 'a', encoding='utf8') as out:
        for m in tf:
            if not m.isfile() or not m.name.endswith('.mxl'):
                continue
            seen += 1
            if m.name in done:
                continue
            data = tf.extractfile(m).read()
            row = {'member': m.name, 'cid': os.path.basename(m.name)[:-4], 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
            try:
                xml = unzip(data)
                facts = read(xml) if xml else None
            except Exception as e:  # a damaged file: noted, not read
                facts, row['error'] = None, type(e).__name__
            if facts:
                row.update(facts)
            else:
                bad += 1
                row.setdefault('error', 'unreadable')
            out.write(json.dumps(row, ensure_ascii=False) + '\n')
            if seen % 5000 == 0:
                out.flush()
                print(f'{seen} read, {bad} unreadable', flush=True)
    print(f'done: {seen} files, {bad} unreadable', flush=True)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
