"""labels.py: rewrite the label cell of each threshold row of area-1C.md with this pass's basis (build helper)."""
import re
from pathlib import Path
P = Path(__file__).resolve().parents[2] / "docs/classifier/rules/area-1C.md"
L = {
"T1": "open: the pair and final clauses validated (Bagatelle, Mozart K. 1e, K. 1f); the section-pickup clause has no code test (Radetzky unmarked; *Rêverie*, *Wake Me Up*)",
"T2": "failing: measured one-bar changes called cadenza bars (*Mariage d'amour*, *Scarborough Fair*, *The Lonely Man*, *Holy, Holy, Holy*); the words clause right on Op. 9 No. 2",
"T3": "sourced", "T4": "sourced", "T5": "sourced",
"T6": "validated: every sub-128th value sits in a bar with a quantisation ratio, in 5 PDMX files; none in rep or generated files",
"T7": "sourced, as an order of beats (music21 `getAccentWeight` measured on 12 metres; it gives 0.5, not less, to the other beats of two-, three-, five- and seven-beat bars)",
"T8": "validated (re-run)", "T9": "validated (re-run)", "T10": "validated (re-run)", "T11": "validated (re-run)",
"T12": "failing: 17 artefact ratios outside 5 per cent stay tuplets (*Malagueña*, *O mio babbino caro*, *Ain't Misbehavin'*, *Silent Night*); the fewer-notes test misses 480:371 and flags 576 real brackets",
"T13": "validated (re-run; downstream of T12)",
"T14": "validated (re-run: runs of 6 or more only in Chopin's NIFC fioriture and Moonlight III (alt) no. 188)",
"T15": "open: no published list read; 9 items found, one a pedalling instruction",
"T16": "open: no source; a written-value bound, not a speed",
"T17": "validated (re-run)", "T18": "sourced", "T19": "validated (re-run)", "T20": "sourced", "T21": "sourced",
"T22": "validated", "T23": "sourced", "T24": "validated (re-run: `exercise.stride.c` none)", "T25": "sourced",
"T26": "open: no source and no counterexample test",
"T27": "validated (re-run)", "T28": "sourced", "T29": "sourced", "T30": "validated (re-run)", "T31": "sourced",
"T32": "open: the named abbreviations match; no search for a non-tempo word caught",
"T33": "open: no source or test",
"T34": "validated (re-run)", "T35": "validated (re-run)",
"T36": "open: no source; the clave's own rests count as silences",
"T37": "open: a reading; its consequence measured: no 6/4 grouping is reachable (T49)",
"T38": "validated (re-run)", "T39": "validated (re-run)",
"T40": "validated on generated items only (re-run); repertoire open",
"T41": "validated: finds every case the check showed failing; rejects strong-beat ties, equal-weight holds and the generated families that write no syncopation; final held notes open",
"T42": "sourced, as an order of beats (music21 measured on 12 metres; the comparisons use only the order)",
"T43": "open: sf/sfz/fz read and run; an accent on beat 3 of 3/4 counts and on beat 2 does not (mazurka accents), unverified as music",
"T44": "failing: splits one figure by an octave bass (Tarantella) and fires in a right-hand melody (Mazurka Op. 68 No. 4)",
"T45": "validated (re-run)", "T46": "validated (re-run)",
"T47": "open: \"alternate\" is not defined",
"T48": "open: the field is `tracks`; under it `exercise.meter.12-8` is a shuffle, against this page's example",
"T49": "open: no route gives a grouping in any of the 11 files with 6/4",
"T50": "failing: the mapped file is the app's own file; rep items with cue notes would answer UNKNOWN",
"T51": "open: no case in the catalogue",
"T52": "open: not run; brackets holding rests and long-short pairs are common (576)",
}
t = P.read_text(encoding="utf-8")
n = 0
def rep(m):
    global n
    n += 1
    return f"| {m.group(1)} | {m.group(2)} | {m.group(3)} | {L[m.group(1)]} |"
t = re.sub(r"^\| (T\d+) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \|$", rep, t, flags=re.M)
P.write_text(t, encoding="utf-8")
print("rows relabelled", n)
