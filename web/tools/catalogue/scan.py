"""Step 1 of building the library's catalogue (owner, 2026-10-13): read the notes of every score in PDMX.

Streams the local mxl.tar.gz (MuseScore MXL files, one per upload) and, for each, reads from the MusicXML itself
what the app's facts reader (web/src/library/facts.ts) reads: parts, staves, chord symbols, printed bars, key and
time signatures, the printed and work titles, the composer. Nothing comes from PDMX.csv here: its "piano", genre and
difficulty columns can't be trusted (library-plan research). Output: one JSON line per readable score, with the
file's SHA-256 (the app's id for a file is "u-" + its start, so a catalogue piece and the same file added by hand
are one piece).

Since 2026-10-15 (the full PDMX set's flags, tools/catalogue/full_set.py) it also reads, per file: the measures, and
those holding no note in any part (measures, emptyBars), each part's notes (partNotes) and the first part's notes per
staff (staffNotes), bars whose voices run past the time signature in force (overBars; overMax, the most any bar runs
over, in quarters), the first part's length in quarters and its distinct note starts (quarters, onsets), the most
notes struck at one moment in the first part (maxStack), and a hash of every note's start and pitch (notesHash: the
same music in two files, whatever their titles), and the opening: the first 16 steps, in semitones, of the first
part's top line (the highest note at each start), which is the same in two keys (a tune's incipit, as music
catalogues such as RISM identify a work by). The fields before these are as they were.

    python -I scan.py <mxl.tar.gz> <out.jsonl> [workers, default 3]

Rerunnable: it resumes after the members already written. Progress goes to <out.jsonl>.progress. With 3 workers the
whole archive (254,035 files) takes about 13 minutes on the owner's PC (780 s, 2026-10-15).
"""

import collections
import hashlib
import io
import json
import os
import sys
import tarfile
import time
import zipfile
from multiprocessing import Pool

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
    } | more(root)


def bar_length(t):
    """Quarters in a bar from a <time> element (composite and several-signature forms added up); None if unmetered."""
    if t is None or t.find('senza-misura') is not None:
        return None
    total = 0.0
    for b, bt in zip(t.findall('beats'), t.findall('beat-type')):
        try:
            total += sum(float(x) for x in text(b).split('+')) * 4 / float(text(bt))
        except (ValueError, ZeroDivisionError):
            return None
    return total or None


def duration(el, div):
    try:
        return float(text(el.find('duration')) or 0) / div
    except ValueError:
        return 0.0


def more(root):
    """The 2026-10-15 facts: empty bars, notes per part and staff, overfull bars, length, stacks, a notes hash."""
    parts = root.findall('part')
    with_notes, part_notes, staff_notes, events = set(), [], {}, []
    over, over_max, first_len, measures = 0, 0.0, 0.0, 0
    for pi, part in enumerate(parts):
        div, bar_len, t0, count = 1.0, None, 0.0, 0
        ms = part.findall('measure')
        measures = max(measures, len(ms))
        for mi, m in enumerate(ms):
            pos = maxpos = start = 0.0
            for el in m:
                tag = el.tag
                if tag == 'attributes':
                    d = el.find('divisions')
                    if d is not None:
                        try:
                            div = float(text(d)) or div
                        except ValueError:
                            pass
                    if el.find('time') is not None:
                        bar_len = bar_length(el.find('time'))
                elif tag == 'note':
                    grace = el.find('grace') is not None
                    if el.find('chord') is None:  # a chord's later notes start with the one before
                        start = pos
                        pos += 0.0 if grace else duration(el, div)
                        maxpos = max(maxpos, pos)
                    p = el.find('pitch')
                    step = STEP.get(text(p.find('step'))) if p is not None else None
                    if step is None or grace:
                        continue
                    try:
                        midi = 12 * (int(text(p.find('octave'))) + 1) + step + int(float(text(p.find('alter')) or 0))
                    except ValueError:
                        continue
                    count += 1
                    with_notes.add(mi)
                    events.append((round(t0 + start, 4), midi, pi))
                    if pi == 0:
                        st = text(el.find('staff')) or '1'
                        staff_notes[st] = staff_notes.get(st, 0) + 1
                elif tag in ('backup', 'forward'):
                    pos += duration(el, div) if tag == 'forward' else -duration(el, div)
                    maxpos = max(maxpos, pos)
            if bar_len and maxpos - bar_len > 1e-3:
                over += 1
                over_max = max(over_max, maxpos - bar_len)
            t0 += maxpos
        part_notes.append(count)
        if pi == 0:
            first_len = t0
    stacks = collections.Counter(t for t, k in {(t, k) for t, k, pi in events if pi == 0})
    staves = max([int(text(s) or 1) for s in parts[0].iter('staves')] or [1]) if parts else 1
    top = {}
    for t, k, pi in events:
        if pi == 0:
            top[t] = max(top.get(t, k), k)
    line = [top[t] for t in sorted(top)[:17]]
    return {
        'measures': measures,
        'emptyBars': measures - len(with_notes),
        'partNotes': part_notes,
        'staffNotes': [staff_notes.get(str(i + 1), 0) for i in range(staves)],
        'overBars': over,
        'overMax': round(over_max, 3),
        'quarters': round(first_len, 3),
        'onsets': len(stacks),
        'maxStack': max(stacks.values()) if stacks else 0,
        'notesHash': hashlib.sha1(repr(sorted((t, k) for t, k, _ in events)).encode()).hexdigest()[:16],
        'opening': [b - a for a, b in zip(line, line[1:])],
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


def facts_of(data):
    """In a worker: the facts of one file, and the reason it couldn't be read, if it couldn't."""
    try:
        xml = unzip(data)
        return (read(xml) if xml else None), None
    except Exception as e:  # a damaged file: noted, not read
        return None, type(e).__name__


def main(tar_path, out_path, workers=3):
    done = set()
    if os.path.exists(out_path):
        with open(out_path, encoding='utf8') as f:
            for line in f:
                try:
                    done.add(json.loads(line)['member'])
                except (ValueError, KeyError):
                    pass
    seen = bad = 0
    began = time.time()

    def note(msg):
        with open(out_path + '.progress', 'w') as pf:
            pf.write(msg + '\n')

    with tarfile.open(tar_path, 'r|gz') as tf, open(out_path, 'a', encoding='utf8') as out, Pool(workers) as pool:
        pending = collections.deque()  # in tar order; a few hundred files in memory at most

        def write_first():
            nonlocal bad
            row, res = pending.popleft()
            facts, err = res.get()
            if err:
                row['error'] = err
            if facts:
                row.update(facts)
            else:
                bad += 1
                row.setdefault('error', 'unreadable')
            out.write(json.dumps(row, ensure_ascii=False) + '\n')

        for m in tf:
            if not m.isfile() or not m.name.endswith('.mxl'):
                continue
            seen += 1
            if m.name in done:
                continue
            data = tf.extractfile(m).read()
            row = {'member': m.name, 'cid': os.path.basename(m.name)[:-4], 'size': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
            pending.append((row, pool.apply_async(facts_of, (data,))))
            while len(pending) > 64 * workers or (pending and pending[0][1].ready()):
                write_first()
            if seen % 5000 == 0:
                out.flush()
                note(f'{seen} read, {bad} unreadable, {time.time() - began:.0f} s')
        while pending:
            write_first()
    note(f'done: {seen} files, {bad} unreadable, {time.time() - began:.0f} s')
    print(f'done: {seen} files, {bad} unreadable, {time.time() - began:.0f} s', flush=True)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 3)
