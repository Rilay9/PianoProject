"""The song course's music (owner, 2026-11-11: the same ground as the step-by-step course, "just less boring", through
songs like Numb, Hurt, The Sound of Silence, The Final Countdown and Smells Like Teen Spirit).

Everything comes from the PDMX catalogue files themselves (web/public/catalogue/<id>.mxl), never typed by hand:
  1. it CHECKS each fact the lessons state (the notes of a passage, its rhythm, its chords): one that is not so stops it;
  2. it writes the song-made drill cards: letter-name cards (sets/song-*-names.json) and rhythm cards (sets/song-*.musicxml
     with their sets), each cut from the passage the lesson plays.

    python3 -I web/tools/songs/build_songs.py      (from the repo root; needs music21 and lxml)

The pieces (PDMX ids): The Final Countdown 779bb4f3a816 (a lead sheet), Hurt b4fb760e5610, Smells Like Teen Spirit
51c9fb34f31b, The Sound of Silence 287be7009063, Numb cf6fbd42ea9b, Always With Me (Spirited Away) d40ea5d27757.
"""
import collections, json, os, zipfile
from lxml import etree
from music21 import clef, key, metadata, meter, note, stream

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
CAT, SETS = os.path.join(ROOT, 'public', 'catalogue'), os.path.join(ROOT, 'public', 'content', 'sets')
ACC = {-1: 'b', 0: '', 1: '#'}
FC, HURT, TEEN, SOS, NUMB, AWM = '779bb4f3a816', 'b4fb760e5610', '51c9fb34f31b', '287be7009063', 'cf6fbd42ea9b', 'd40ea5d27757'


def t(e):
    return (e.text or '').strip() if e is not None else ''


_cache = {}
def read(cid):
    """bar -> staff -> [(start, name or None, quarters, tied_on)]; bar -> [chord symbols]; bar -> (beats, beat type)."""
    if cid in _cache: return _cache[cid]
    z = zipfile.ZipFile(os.path.join(CAT, cid + '.mxl'))
    part = etree.fromstring(z.read([n for n in z.namelist() if not n.startswith('META') and n.endswith('.xml')][0])).find('part')
    div, ts, bars, harm, times = 1, None, {}, {}, {}
    for m in part.findall('measure'):
        no = int(m.get('number')); st = collections.defaultdict(list); pos = last = 0; h = []
        for e in m:
            if e.tag == 'attributes':
                if e.find('divisions') is not None: div = int(t(e.find('divisions')))
                if e.find('time/beats') is not None: ts = (int(t(e.find('time/beats'))), int(t(e.find('time/beat-type'))))
            elif e.tag == 'backup': pos -= int(t(e.find('duration')))
            elif e.tag == 'forward': pos += int(t(e.find('duration')))
            elif e.tag == 'harmony':
                h.append(t(e.find('root/root-step')) + ACC[int(float(t(e.find('root/root-alter')) or 0))] + {'major': '', 'minor': 'm', 'dominant': '7'}.get(t(e.find('kind')), ':' + t(e.find('kind'))))
            elif e.tag == 'note' and e.find('grace') is None:
                d = int(t(e.find('duration'))); ch = e.find('chord') is not None; start = last if ch else pos
                if not ch: last = pos; pos += d
                s = int(t(e.find('staff')) or 1)
                if e.find('rest') is not None: st[s].append((start / div, None, d / div, False)); continue
                p = e.find('pitch'); a = int(float(t(p.find('alter')) or 0))
                st[s].append((start / div, t(p.find('step')) + ACC[a] + t(p.find('octave')), d / div, any(x.get('type') == 'stop' for x in e.findall('tie'))))
        bars[no], harm[no], times[no] = st, h, ts
    _cache[cid] = (bars, harm, times)
    return _cache[cid]


def order(n):
    return (int(n[-1]), 'CDEFGAB'.index(n[0]), len(n))


def events(cid, staff, a, b):
    """The notes struck in bars a..b of a staff, in time: [bar, start, [names], quarters held]; a tied note's length
    runs on into the note it is tied to (in the bar or the next)."""
    bars, _, times = read(cid); out = []; at = 0.0; ends = {}
    for no in range(a, b + 2):
        if no not in bars: break
        by = collections.OrderedDict()
        for (s, n, q, tied) in sorted(bars[no][staff], key=lambda x: x[0]):
            if n is None: continue
            if tied:
                ev = ends.get((n, round(at + s, 3)))
                if ev is not None:
                    ev[3] += q; ends[(n, round(at + s + q, 3))] = ev
                continue
            if no > b: continue
            by.setdefault(s, [no, s, [], q])[2].append(n)
        for s, ev in by.items():
            ev[2].sort(key=order); out.append(ev)
            for n in ev[2]: ends[(n, round(at + s + ev[3], 3))] = ev
        num, den = times[no]
        bar_len = max([x[0] + x[2] for x in bars[no][staff]] + [0])
        at += bar_len if no == 0 else num * 4 / den
    return out


def melody(cid, staff, a, b):
    return [(ev[2][0] if len(ev[2]) == 1 else '+'.join(ev[2])) for ev in events(cid, staff, a, b)]


def notes_in(cid, staff, a, b):
    return sorted({n for ev in events(cid, staff, a, b) for n in ev[2]}, key=order)


def values(cid, staff, a, b, rests=False):
    bars = read(cid)[0]
    return sorted({q for no in range(a, b + 1) for (_, n, q, _) in bars[no][staff] if (n is None) == rests})


def chords(cid, a, b):
    h = read(cid)[1]
    return [(no, s) for no in range(a, b + 1) for s in h.get(no, [])]


def check(what, got, want):
    if got != want: raise SystemExit(f'FACT NOT SO: {what}\n  the file: {got}\n  the lesson: {want}')
    print('ok  ', what)


def facts():
    fc = melody(FC, 1, 1, 8)
    check('Final Countdown, bars 1-8: the riff', fc, 'E5 D5 E5 A4 F5 E5 F5 E5 D5 E5 D5 E5 A4 D5 C5 D5 C5 B4 D5'.split())
    check('Final Countdown, bars 1-8: the riff uses only A B C D E F', notes_in(FC, 1, 1, 8), ['A4', 'B4', 'C5', 'D5', 'E5', 'F5'])
    check('Final Countdown, bars 1-8: note values (eighth, quarter, half)', values(FC, 1, 1, 8), [0.5, 1.0, 2.0])
    check('Final Countdown, bars 1-8: rests (quarter and half)', values(FC, 1, 1, 8, rests=True), [1.0, 2.0])
    check('Final Countdown, bars 9-16: a dotted half and whole notes come in', [q for q in values(FC, 1, 9, 16) if q >= 3], [3.0, 4.0])
    check('Final Countdown: the chords, bars 1-8', chords(FC, 1, 8), [(1, 'Am'), (3, 'F'), (5, 'Dm'), (7, 'G')])
    check('Final Countdown: 4/4', read(FC)[2][1], (4, 4))
    check('Hurt, bars 1-4: the left hand', melody(HURT, 2, 1, 4), 'A2 E3 A3 C3 G3 C4 D3 A3 D4 A2 E3 A3 C3 G3 C4 D3 A3 D4'.split())
    check('Hurt, bar 1: the left hand is eighth, eighth, dotted half', [ev[3] for ev in events(HURT, 2, 1, 1)], [0.5, 0.5, 3.0])
    check('Hurt, bar 2: eighth, eighth, quarter, twice', [ev[3] for ev in events(HURT, 2, 2, 2)], [0.5, 0.5, 1.0, 0.5, 0.5, 1.0])
    check('Hurt, bars 1-4: the right hand rests', notes_in(HURT, 1, 1, 4), [])
    check('Hurt, bars 5-12: the right hand uses A C D E G', notes_in(HURT, 1, 5, 12), ['A4', 'C5', 'D5', 'E5', 'G5'])
    check('Hurt, bars 5-12: the left hand repeats bars 1-2', melody(HURT, 2, 5, 12), melody(HURT, 2, 1, 2) * 4)
    check('Hurt, bars 5-8: the right hand', melody(HURT, 1, 5, 8), 'E5 G5 E5 D5 C5 E5 A4 C5 C5 C5 D5'.split())
    check('Teen Spirit, bars 3-9: the left hand is E minor (E G B) and C (C E G)', sorted({tuple(ev[2]) for ev in events(TEEN, 2, 4, 9)}), [('C3', 'E3', 'G3'), ('E3', 'G3', 'B3')])
    check('Teen Spirit, bars 4-9: the left hand, one chord a bar', [' '.join(ev[2]) for ev in events(TEEN, 2, 4, 9)], ['C3 E3 G3', 'E3 G3 B3', 'C3 E3 G3', 'E3 G3 B3', 'C3 E3 G3', 'E3 G3 B3'])
    check('Teen Spirit, bars 4-9: whole notes', [ev[3] for ev in events(TEEN, 2, 4, 9)], [4.0] * 6)
    check('Teen Spirit, bars 3-6: the right hand uses F# G A B C D E', notes_in(TEEN, 1, 3, 6), ['F#4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'])
    check('Teen Spirit: key signature one sharp, 4/4', read(TEEN)[2][1], (4, 4))
    check('Sound of Silence, bars 3-7: the right hand', melody(SOS, 1, 3, 7), 'D4 D4 F4 F4 A4 A4 G4 C4 C4 E4 E4 G4 G4 F4 F4 F4 A4 A4 C5 C5'.split())
    check('Sound of Silence, bars 3-7: the right hand is eighths and halves', values(SOS, 1, 3, 7), [0.5, 2.0])
    check('Sound of Silence, bars 3-6: the left hand', melody(SOS, 2, 3, 6), 'D3 A3 F3 A3 D3 A3 F3 A3 C3 G3 E3 G3 C3 G3 E3 G3 C3 G3 E3 G3 C3 G3 E3 G3 D3 A3 F3 A3 D3 A3 F3 A3'.split())
    check('Sound of Silence, bar 8: the left hand plays B flat', 'Bb3' in notes_in(SOS, 2, 8, 8), True)
    check('Numb, bars 0-4: the right hand uses E G A B C', notes_in(NUMB, 1, 0, 4), ['E5', 'G5', 'A5', 'B5', 'C6'])
    check('Numb, bars 1-4: the left hand, A then F then C then G, each up its chord', [ev[2][0] for ev in events(NUMB, 2, 1, 4)][::6], ['A2', 'F2', 'C2', 'G2'])
    check('Numb, bar 1: the left hand A E A C A E', melody(NUMB, 2, 1, 1), 'A2 E3 A3 C4 A3 E3'.split())
    check('Always With Me: 3/4, one flat', read(AWM)[2][1], (3, 4))
    check('Always With Me, bars 1-10: the chords', chords(AWM, 1, 10), [(1, 'F'), (2, 'F'), (3, 'F'), (4, 'C'), (5, 'Dm'), (6, 'Am'), (7, 'Bb'), (8, 'F'), (9, 'Gm'), (10, 'C')])
    check('Always With Me, bars 1-4: the left hand, a bass note then the chord twice', [' '.join(ev[2]) for ev in events(AWM, 2, 1, 1)], ['F2', 'F3 A3 C4', 'F3 A3 C4'])
    check('Always With Me, bars 2-8: the right hand uses C D E F G A C', notes_in(AWM, 1, 2, 8), ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'C5'])
    check('Always With Me, bars 2-8: the right hand', melody(AWM, 1, 2, 8), 'F4 G4 A4 F4 C5 A4 G4 C5 G4 F4 D4 A4 F4 E4 E4 D4 E4 F4 G4 C4 F4 G4 A4'.split())


def names_card(cid, staff, phrases, hand):
    """A letter-name card: the notes of each (first, last) bar range, '/' between, with each note's beats."""
    ns, bs = [], []
    for (a, b) in phrases:
        evs = events(cid, staff, a, b)
        ns.append(', '.join(ev[2][-1] for ev in evs)); bs.append(' '.join(f'{ev[3]:g}' for ev in evs))
    return {"notes": ' / '.join(ns), "beats": ' / '.join(bs), "hand": hand}


def rhythm_file(cid, staff, a, b, out, title):
    p = stream.Part(); bars = read(cid)[0]; num, den = read(cid)[2][a]
    for i, no in enumerate(range(a, b + 1)):
        m = stream.Measure(number=i + 1)
        if i == 0: m.append(clef.TrebleClef()); m.append(key.KeySignature(0)); m.append(meter.TimeSignature(f'{num}/{den}'))
        seen = set()
        for (s, n, q, tied) in sorted(bars[no][staff], key=lambda x: x[0]):
            if s in seen: continue
            seen.add(s)
            m.append(note.Rest(quarterLength=q) if n is None else note.Note('B4', quarterLength=q))
        p.append(m)
    sc = stream.Score(); sc.insert(0, metadata.Metadata(title=title)); sc.insert(0, p)
    sc.write('musicxml', fp=os.path.join(SETS, out))


def put(name, obj):
    with open(os.path.join(SETS, name), 'w', encoding='utf-8') as f: f.write(json.dumps(obj, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    facts()
    put('song-fc-names.json', {"title": "The Final Countdown riff, by key names", "kind": "melodies", "view": "names", "order": "passage", "tempo": 100,
        "items": {"1": {**names_card(FC, 1, [(1, 4), (5, 8)], 'right'), "name": "The riff, bars 1–8"}}})
    put('song-hurt-names.json', {"title": "Hurt, the intro, by key names", "kind": "melodies", "view": "names", "order": "passage", "tempo": 80,
        "items": {"1": {**names_card(HURT, 2, [(1, 2), (3, 4)], 'left'), "name": "Left hand, bars 1–4"}}})
    rhythm_file(FC, 1, 1, 2, 'song-fc-rhythm-1-2.musicxml', 'The Final Countdown, bars 1-2')
    rhythm_file(FC, 1, 3, 4, 'song-fc-rhythm-3-4.musicxml', 'The Final Countdown, bars 3-4')
    rhythm_file(FC, 1, 7, 8, 'song-fc-rhythm-7-8.musicxml', 'The Final Countdown, bars 7-8')
    rhythm_file(FC, 1, 9, 10, 'song-fc-rhythm-9-10.musicxml', 'The Final Countdown, bars 9-10')
    rhythm_file(HURT, 2, 1, 2, 'song-hurt-rhythm-1-2.musicxml', 'Hurt, bars 1-2, left hand')
    rhythm_file(HURT, 1, 5, 6, 'song-hurt-rhythm-5-6.musicxml', 'Hurt, bars 5-6, right hand')
    rhythm_file(HURT, 1, 7, 8, 'song-hurt-rhythm-7-8.musicxml', 'Hurt, bars 7-8, right hand')
    rhythm_file(AWM, 1, 2, 3, 'song-awm-rhythm-2-3.musicxml', 'Always With Me, bars 2-3')
    rhythm_file(AWM, 1, 4, 5, 'song-awm-rhythm-4-5.musicxml', 'Always With Me, bars 4-5')
    rhythm_file(AWM, 1, 7, 8, 'song-awm-rhythm-7-8.musicxml', 'Always With Me, bars 7-8')
    rhythm_file(TEEN, 1, 3, 4, 'song-teen-rhythm-3-4.musicxml', 'Smells Like Teen Spirit, bars 3-4')
    rhythm_file(TEEN, 1, 5, 6, 'song-teen-rhythm-5-6.musicxml', 'Smells Like Teen Spirit, bars 5-6')
    rhythm_file(NUMB, 1, 1, 2, 'song-numb-rhythm-1-2.musicxml', 'Numb, bars 1-2')
    rhythm_file(NUMB, 1, 3, 4, 'song-numb-rhythm-3-4.musicxml', 'Numb, bars 3-4')
    print('written: song letter cards and rhythm cards in content/sets')
