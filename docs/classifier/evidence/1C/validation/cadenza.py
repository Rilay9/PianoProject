"""rhythm.cadenza candidates as corrected, read from the item's own file (every pipeline): runs of consecutive cue-size
notes (<type size="cue"> or <cue/>) in one staff and voice, with their summed duration against the felt beat; grace
runs; irregular tuplets (11+ actual, or 9+ at more than twice the normal density, not 12/16/24/32); cadenza words.
Prints per item the candidate bars by route."""
import re, sys
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import CAT, CONTENT, xml_text, beat_len

WORDS = re.compile(r"\b(cadenza|quasi cadenza|ad\.? ?lib\.?|ad libitum|a piacere|senza tempo|colla voce|liberamente|freely)", re.I)


def scan(iid, file):
    t = xml_text(file)
    part = re.search(r"<part\b.*?</part>", t, re.S).group(0)
    div = 1; sig = (4, 4)
    cue_runs = []; grace_runs = []; irr = []; words = []
    run = defaultdict(lambda: [F(0), 0, None])  # (staff, voice) -> [dur, count, first bar]
    grun = defaultdict(lambda: [0, None])
    for mm in re.finditer(r'<measure\b[^>]*number="([^"]*)"[^>]*>(.*?)</measure>', part, re.S):
        no, body = mm.group(1), mm.group(2)
        d = re.search(r"<divisions>(\d+)", body)
        if d: div = int(d.group(1))
        b = re.search(r"<beats>(\d+)</beats>\s*<beat-type>(\d+)", body)
        if b: sig = (int(b.group(1)), int(b.group(2)))
        for w in re.findall(r"<words[^>]*>([^<]*)</words>", body):
            if WORDS.search(w): words.append((no, w.strip()))
        for nm in re.finditer(r"<note\b.*?</note>", body, re.S):
            n = nm.group(0)
            st = (re.search(r"<staff>(\d+)", n) or [0, "1"])[1]; vo = (re.search(r"<voice>(\d+)", n) or [0, "1"])[1]
            key = (st, vo)
            chord = "<chord" in n
            grace = "<grace" in n
            cue = bool(re.search(r'<type[^>]*size="cue"', n)) or "<cue" in n
            if grace:
                if not chord:
                    g = grun[key]; g[0] += 1; g[1] = g[1] or no
                continue
            if grun[key][0]:
                if grun[key][0] >= 6: grace_runs.append((grun[key][1], grun[key][0]))
                grun[key] = [0, None]
            if chord:
                continue
            dur = F(int((re.search(r"<duration>(\d+)", n) or [0, "0"])[1]), div)
            r = run[key]
            if cue:
                r[0] += dur; r[1] += 1; r[2] = r[2] or no
            else:
                if r[1]:
                    cue_runs.append((r[2], r[1], r[0], r[0] >= beat_len(*sig)))
                run[key] = [F(0), 0, None]
            tm = re.search(r"<actual-notes>(\d+)</actual-notes>\s*<normal-notes>(\d+)", n)
            if tm and re.search(r'<tuplet[^>]*type="start"', n):
                a, nn = int(tm.group(1)), int(tm.group(2))
                if a not in (12, 16, 24, 32) and (a >= 11 or (a >= 9 and a > 2 * nn)):
                    irr.append((no, f"{a}:{nn}"))
    for key, r in run.items():
        if r[1]:
            cue_runs.append((r[2], r[1], r[0], r[0] >= beat_len(*sig)))
    return cue_runs, grace_runs, irr, words


if __name__ == "__main__":
    ids = sys.argv[1:] or [i["id"] for i in CAT if i.get("file")]
    for iid in ids:
        it = [i for i in CAT if i["id"] == iid][0]
        cr, gr, irr, wd = scan(iid, CONTENT / it["file"])
        cand = [c for c in cr if c[3]]
        if not (cand or gr or irr or wd) and len(sys.argv) == 1:
            continue
        print(f"{iid}: cue runs >= a beat {len(cand)} (of {len(cr)} cue runs) at bars {[c[0] for c in cand][:12]} sizes {[c[1] for c in cand][:12]}"
              f" | grace>=6 {gr[:6]} | irregular tuplets {sorted(set(x[1] for x in irr))} bars {[x[0] for x in irr][:8]} | words {wd[:4]}")
