"""misc.py RULE ID ... : independent minimal implementations of the unchanged area-1C rules, as the page states them,
for re-running their named examples (build only).
RULE in: stream, share, repeated, patterns, poly, endurance, velocity, silence, anacrusis, dotted, tuplets, tempo, words, grouping"""
import re, sys, json, warnings
from collections import Counter, defaultdict
from fractions import Fraction as F
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import load, fr, beat_len, is_compound, item_xml, EPS
warnings.simplefilter("ignore")
from rules import rhythm as R


def hand_onsets(sc):
    """hand -> sorted list of (onset, longest duration, pitches) over all notes (chords and voices merged)."""
    n = sc.notes
    by = {"R": defaultdict(list), "L": defaultdict(list)}
    for i in range(len(n)):
        if n["duration_quarter"][i] <= 0:
            continue
        by[str(sc.hand[i])][fr(n["onset_quarter"][i])].append((fr(n["duration_quarter"][i]), int(n["pitch"][i]), int(n["voice"][i]) if "voice" in n.dtype.names else 0))
    return {h: sorted((o, max(x[0] for x in v), [x[1] for x in v], [x[2] for x in v]) for o, v in d.items()) for h, d in by.items()}


def stream(sc):
    """longest run of equal inter-onset interval d <= an eighth, each onset's note lasting >= d/2; per hand and merged."""
    ho = hand_onsets(sc)
    def longest(ons):
        best = (0, None, None); cnt8 = 0
        i = 0
        while i < len(ons) - 1:
            d = ons[i + 1][0] - ons[i][0]
            if d > F(1, 2) or d <= 0:
                i += 1; continue
            j = i
            while j + 1 < len(ons) and ons[j + 1][0] - ons[j][0] == d and ons[j][1] >= d / 2:
                j += 1
            k = j - i + 1
            if k >= 8: cnt8 += 1
            if k > best[0]: best = (k, str(d), str(ons[i][0]))
            i = j if j > i else i + 1
        return best, cnt8
    merged = defaultdict(lambda: F(0))
    for h in "RL":
        for o, d, p, v in ho[h]:
            merged[o] = max(merged[o], d)
    mo = sorted((o, d, [], []) for o, d in merged.items())
    return {"R": longest(ho["R"]), "L": longest(ho["L"]), "merged": longest(mo)}


def share(sc):
    b = R.Bars(sc)
    on = set()
    for h in "RL":
        for m, d in b.onsets[h].items():
            for o in d:
                on.add((m, o))
    beats = hits = down = downhits = 0
    for m in b.readable:
        bt, tt = b.metre[m]; B = beat_len(bt, tt)
        nb = int(b.length[m] / B)
        for k in range(nb):
            beats += 1; hits += (m, k * B) in on
        down += 1; downhits += (m, F(0)) in on
    return {"beats": beats, "on": hits, "share": round(hits / beats, 3) if beats else None, "downbeats": down, "down_on": downhits}


def repeated(sc):
    n = sc.notes
    out = {}
    for h in "RL":
        voices = defaultdict(lambda: defaultdict(list))
        for i in range(len(n)):
            if str(sc.hand[i]) != h or n["duration_quarter"][i] <= 0:
                continue
            voices[(int(n["staff"][i]), int(n["voice"][i]))][fr(n["onset_quarter"][i])].append(int(n["pitch"][i]))
        pairs = 0; longest = 0
        for key, d in voices.items():
            seq = [d[o] for o in sorted(d)]
            run = 1
            for a, b_ in zip(seq, seq[1:]):
                if len(a) == 1 and len(b_) == 1 and a[0] == b_[0]:
                    pairs += 1; run += 1; longest = max(longest, run)
                else:
                    run = 1
        out[h] = {"pairs": pairs, "longest_run": longest}
    return out


def patterns(sc):
    b = R.Bars(sc)
    out = {}
    for staff in (1, 2):
        h = "R" if staff == 1 else "L"
        strs = Counter()
        for m in sorted(b.readable):
            on = b.onsets[h].get(m, {})
            if not on:
                continue
            s = tuple((o, min(b.durations[h][m][o], b.length[m] - o)) for o in sorted(on))
            strs[s] += 1
        tot = sum(strs.values())
        if tot:
            out[h] = {"distinct": len(strs), "bars": tot, "top_share": round(strs.most_common(1)[0][1] / tot, 2)}
    return out


def poly(sc):
    b = R.Bars(sc)
    found = Counter(); where = []
    def div(fs):
        n = len(fs)
        return n if n and fs == {F(i, n) for i in range(n)} else None
    for m in sorted(b.readable):
        bt, tt = b.metre[m]; B = beat_len(bt, tt); L = b.length[m]
        spans = [(k * B, B) for k in range(int(L / B))]
        nb = int(L / B)
        if nb % 2 == 0 and nb > 2:
            spans += [(k * 2 * B, 2 * B) for k in range(nb // 2)]
        spans += [(F(0), L)]
        done = []
        for (s, ln) in spans:
            if any(s >= a and s + ln <= a + l2 for a, l2 in done):
                continue
            fr_ = {}
            for h in "RL":
                fr_[h] = div({(o - s) / ln for o in b.onsets[h].get(m, {}) if s <= o < s + ln})
            p, q = fr_["R"], fr_["L"]
            if p and q and p != q and p % q and q % p:
                from math import gcd
                g = gcd(p, q)
                found[f"{p // g}:{q // g}"] += 1; done.append((s, ln)); where.append(m)
    return {"ratios": dict(found), "bars": sorted(set(where))[:10]}


def tempo_marks(iid):
    t = item_xml(iid)
    mets = re.findall(r"<metronome[^>]*>(.*?)</metronome>", t, re.S)
    out = []
    for m in mets[:3]:
        out.append((re.findall(r"<beat-unit>(\w+)</beat-unit>", m), m.count("<beat-unit-dot"), re.findall(r"<per-minute>([^<]+)</per-minute>", m)))
    snd = re.findall(r'<sound[^>]*tempo="([^"]+)"', t)[:3]
    return {"metronome": out, "sound_tempo": snd}


def words(iid):
    t = item_xml(iid)
    out = []
    for mm in re.finditer(r'<measure\b[^>]*number="([^"]*)"[^>]*>(.*?)</measure>', re.search(r"<part\b.*?</part>", t, re.S).group(0), re.S):
        for w in re.findall(r"<words[^>]*>([^<]*)</words>", mm.group(2)):
            out.append((mm.group(1), w.strip()))
    return out[:25]


def velocity(sc, iid):
    tm = tempo_marks(iid)
    if not tm["metronome"]:
        return {"tempo": None}
    unit = {"quarter": 1, "half": 2, "eighth": F(1, 2), "whole": 4, "16th": F(1, 4)}[tm["metronome"][0][0][0]]
    if tm["metronome"][0][1]:
        unit = unit * F(3, 2)
    qbpm = float(F(tm["metronome"][0][2][0]) * unit)
    ho = hand_onsets(sc)
    out = {"quarter_bpm": qbpm}
    for h in "RL":
        if ho[h]:
            span = float(ho[h][-1][0] + ho[h][-1][1] - ho[h][0][0])
            out[h] = round(len(ho[h]) / (span * 60 / qbpm), 2)
    return out


def endurance(sc):
    b = R.Bars(sc)
    ho = hand_onsets(sc)
    out = {}
    for h in "RL":
        ons = ho[h]
        if not ons:
            continue
        best = (0, 0); start = 0; end_sound = ons[0][0] + ons[0][1]
        for i in range(1, len(ons)):
            o = ons[i][0]
            met = sc.notes["ts_beats"][0], sc.notes["ts_beat_type"][0]
            B = beat_len(int(met[0]), int(met[1]))
            if o > end_sound + EPS or o - ons[i - 1][0] > B:
                start = i
            end_sound = max(end_sound if start != i else F(0), o + ons[i][1])
            k = i - start + 1
            q = ons[i][0] + ons[i][1] - ons[start][0]
            if k > best[0]:
                best = (k, float(q))
        out[h] = {"onsets": best[0], "quarters": best[1]}
    return out


def silence(sc):
    n = sc.notes
    iv = sorted((fr(n["onset_quarter"][i]), fr(n["onset_quarter"][i] + n["duration_quarter"][i])) for i in range(len(n)) if n["duration_quarter"][i] > 0)
    met = int(n["ts_beats"][0]), int(n["ts_beat_type"][0]); B = beat_len(*met)
    out = []; end = iv[0][1]
    starts = sc.measure_starts
    for o, e in iv[1:]:
        if o - end >= B:
            m = max(j for j in range(len(starts)) if starts[j] <= float(end) + 1e-9)
            out.append((m, float((o - end) / B)))
        end = max(end, e)
    return {"count": len(out), "first": out[:6], "longest_beats": max((x[1] for x in out), default=0)}


def dotted(iid):
    sc = load(iid)
    c = Counter()
    for part in sc.part_score.parts:
        q = part.quarter_map
        seq = defaultdict(list)
        for nt in part.notes:
            sd = nt.symbolic_duration or {}
            seq[(nt.staff, nt.voice)].append((fr(q(nt.start.t)), fr(q(nt.end.t)), sd.get("type"), sd.get("dots", 0)))
        for k, v in seq.items():
            v.sort()
            for a, b_ in zip(v, v[1:]):
                if a[3] == 1 and b_[0] == a[1]:
                    c[f"dotted {a[2]} then {b_[2]}"] += 1
    return dict(c.most_common(6))


if __name__ == "__main__":
    rule = sys.argv[1]
    for iid in sys.argv[2:]:
        try:
            if rule in ("tempo",):
                r = tempo_marks(iid)
            elif rule == "words":
                r = words(iid)
            elif rule == "dotted":
                r = dotted(iid)
            elif rule == "velocity":
                r = velocity(load(iid), iid)
            else:
                r = globals()[rule](load(iid))
        except Exception as ex:
            r = "ERROR " + repr(ex)[:200]
        print(iid, json.dumps(r, default=str))
