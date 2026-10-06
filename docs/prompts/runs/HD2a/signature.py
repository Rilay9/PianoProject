"""HD2a: the reused-voice signature, read bar by bar off the app's current model of each class-A file.

Reads the dumps `dump.probe.ts` writes (`app/build/HD2a/models/<id>.json`). Run from the repository root:

    python docs/prompts/runs/HD2a/signature.py              # writes app/build/HD2a/bars.json, prints the summary
    python docs/prompts/runs/HD2a/signature.py --withheld   # the same on the models built without the rows

**The candidate** is a bar-voice of the shape HD2's corpus diff called class A: in one printed bar (its first
pass), every note of voice v sits on one staff s, and the model reads every one of them as the other hand H,
cross-staff, because v's whole-piece home is the other staff.

**What the dump can establish about it** is physical, nothing heard: whether the hand the model gives the
notes can strike what the model asks of it. At every onset where v strikes notes (grace notes aside), the
model has hand H strike the set S: every note it gives H at that onset, v's and the rest. One hand cannot
strike a set spanning more than REACH semitones, or more than five keys. Per onset:

* *conflict*: S is beyond one hand, and S without v's notes is not: v's notes are what make the model's
  reading impossible there;
* *compatible*: H strikes other notes there and S is within one hand: the model's reading is possible;
* *unclear*: S without v's notes is already beyond one hand (a rolled chord, a reading wrong elsewhere);
* *free*: H strikes nothing else there.

And for the hand the row would give (H', the staff's own hand): *infeasible* where v's notes with every note
the model gives H' at that onset (struck there, or held from before) are beyond one hand.

**The outcome of a bar-voice:**

* ESTABLISHED: at least one conflict onset; no compatible, unclear or infeasible onset; and a second voice
  supplies H's notes in the bar (the signature, The Crave bar 40's shape). The model's hand cannot play
  the line as written, the other hand can, and the line is one voice on one staff through the bar (no
  staff change to mark a change of hand), so the bar-voice is H''s.
* FREE: H strikes nothing else at any of v's onsets: as far as the model shows, a single consistent line
  crossing the staves (the Moonlight shape); left alone.
* UNKNOWN: anything else, chiefly a line some of whose onsets H could strike with its own notes: the dump
  cannot tell the two readings apart; no row.

REACH is 16 semitones (a tenth): one hand strikes a tenth only at the edge of a large hand.
"""
import collections
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[4]
# `--withheld` reads the models built without the verified hand rows (the calibration on HD2's five bars).
WITHHELD = '--withheld' in sys.argv
MODELS = ROOT / 'app' / 'build' / 'HD2a' / ('models-withheld' if WITHHELD else 'models')
OUT = ROOT / 'app' / 'build' / 'HD2a' / ('bars-withheld.json' if WITHHELD else 'bars.json')
REACH = 16
KEYS = 5
OTHER = {1: 2, 2: 1}
HAND_OF = {1: 'R', 2: 'L'}
EPS = 1e-6


def first_pass(notes):
    """The notes of each source measure's first pass (repeats unrolled in the model)."""
    first = {}
    for n in notes:
        first[n['smi']] = min(first.get(n['smi'], n['mi']), n['mi'])
    return [n for n in notes if n['mi'] == first[n['smi']]]


def one_hand(midis):
    """Whether one hand can strike these keys at once."""
    keys = set(midis)
    return not keys or (max(keys) - min(keys) <= REACH and len(keys) <= KEYS)


def analyse(model):
    notes = [n for n in first_pass(model['notes']) if not n['g']]
    by_smi = collections.defaultdict(list)
    for n in notes:
        by_smi[n['smi']].append(n)
    by_hand = {'R': [n for n in notes if n['h'] == 'R'], 'L': [n for n in notes if n['h'] == 'L']}
    struck = {hand: collections.defaultdict(list) for hand in by_hand}
    for hand, pool in by_hand.items():
        for n in pool:
            struck[hand][round(n['son'], 6)].append(n)

    def held(hand, t):
        return [m for m in by_hand[hand] if m['son'] < t - EPS and m['son'] + m['dur'] > t + EPS]

    out = []
    for smi, here in sorted(by_smi.items()):
        voices = collections.defaultdict(list)
        for n in here:
            voices[n['v']].append(n)
        for v, vn in sorted(voices.items()):
            if len({n['st'] for n in vn}) != 1 or not all(n['x'] for n in vn):
                continue
            s = vn[0]['st']
            hand, target = vn[0]['h'], HAND_OF[s]
            if hand == target or any(n['h'] != hand for n in vn):
                continue
            second = sorted({m['v'] for m in here if m['v'] != v and m['st'] == OTHER[s] and not m['x'] and m['h'] == hand})
            counts = collections.Counter()
            examples = []
            onsets = sorted({round(n['son'], 6) for n in vn})
            for t in onsets:
                mine = [n['midi'] for n in vn if round(n['son'], 6) == t]
                rest = [m['midi'] for m in struck[hand][t] if not (m['v'] == v and m['st'] == s)]
                if not rest:
                    counts['free'] += 1
                elif not one_hand(rest):
                    counts['unclear'] += 1
                elif one_hand(rest + mine):
                    counts['compatible'] += 1
                else:
                    counts['conflict'] += 1
                    if len(examples) < 2:
                        examples.append(f"@{t:g} {hand} {sorted(rest)} + v{v} {sorted(mine)}")
                theirs = [m['midi'] for m in struck[target][t]] + [m['midi'] for m in held(target, t)]
                if not one_hand(theirs + mine):
                    counts['infeasible'] += 1
            if counts['conflict'] and not (counts['compatible'] or counts['unclear'] or counts['infeasible']) and second:
                outcome = 'ESTABLISHED'
            elif not (counts['conflict'] or counts['compatible'] or counts['unclear']):
                outcome = 'FREE'
            else:
                outcome = 'UNKNOWN'
            out.append({
                'bar': vn[0]['bar'], 'smi': smi, 'staff': s, 'voice': v, 'hand': hand, 'target': target,
                'notes': len(vn), 'onsets': len(onsets), 'counts': dict(counts), 'second': second,
                'outcome': outcome, 'examples': examples,
            })
    return out


def main():
    result = {}
    for path in sorted(MODELS.glob('*.json')):
        model = json.loads(path.read_text(encoding='utf-8'))
        if model['staves'] != 2:
            result[model['id']] = {'skipped': f"{model['staves']} staves", 'bars': []}
            continue
        result[model['id']] = {'bars': analyse(model)}
    OUT.write_text(json.dumps(result), encoding='utf-8')
    tally = collections.Counter()
    files = collections.defaultdict(set)
    for item, entry in result.items():
        for bar in entry['bars']:
            tally[bar['outcome']] += 1
            files[bar['outcome']].add(item)
    for outcome in ('ESTABLISHED', 'UNKNOWN', 'FREE'):
        print(f'{outcome}: {tally[outcome]} bar-voices in {len(files[outcome])} files')
    print('skipped:', [i for i, e in result.items() if 'skipped' in e])


if __name__ == '__main__':
    sys.exit(main())
