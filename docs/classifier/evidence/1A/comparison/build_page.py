"""Assembles repeat-times.md from the JSON results in this folder (every figure in the tables is read from them) and the prose below.
Run after rep_*.py and tm_*.py: build_page.py  ->  repeat-times.md"""
import json, collections, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
L = lambda n: json.load(open(HERE / n, encoding="utf8"))
R, S, RD, AN, SM = L("rep_readers.json"), L("rep_structure.json"), L("rep_readings.json"), L("rep_analysis.json"), L("rep_summary.json")
TR, TC, TS, TE = L("tm_results.json"), L("tm_current.json"), L("tm_summary.json"), L("expected_times_named.json")
EXP = L("expected_repeat_named.json")
F, SPOT = RD["files"], RD["spot"]
from importlib.metadata import version as _v  # versions from package metadata (no import of the libraries)
PYV = sys.version.split()[0]


class _M:
    pass


music21 = _M(); music21.__version__ = _v("music21")
partitura = _M(); partitura.__version__ = _v("partitura")


def esc(s):
    return str(s).replace("|", "\\|")


def short(i):
    return i.replace("song.", "")


def cell(v):
    if v is None:
        return "none"
    if isinstance(v, str):
        return "error"
    return str(v)


# ---- repeat tables
def agreement_table():
    rows = ["| pair | files | agree | disagree | one reader gave no count |", "| --- | --- | --- | --- | --- |"]
    names = {"unroller~music21": "unroller / music21", "unroller_cp~music21": "unroller with the coda-pair fix / music21",
             "unroller~pt_max_noleap": "unroller / partitura maximal (no repeats after a leap)", "unroller_cp~pt_max_noleap": "unroller with fix / partitura maximal (no leaps)",
             "unroller~pt_max": "unroller / partitura maximal (default)", "music21~pt_max_noleap": "music21 / partitura maximal (no leaps)", "unroller~pt_min": "unroller / partitura minimal"}
    for k, nm in names.items():
        a = AN["pairs"][k]["all"]
        tot = sum(a.values())
        rows.append(f"| {nm} | {tot} | {a.get('agree', 0)} | {a.get('disagree', 0)} | {a.get('cannot (one reader gave no count)', 0)} |")
    return "\n".join(rows)


def agreement_groups():
    rows = ["| group (pipeline, jump words in the file) | files | unroller = music21 | unroller ≠ music21 | music21 gave no count | unroller = partitura (no leaps) | unroller ≠ partitura | partitura gave no count |", "| --- | --- | --- | --- | --- | --- | --- | --- |"]
    a, b = AN["pairs"]["unroller~music21"], AN["pairs"]["unroller~pt_max_noleap"]
    for g in sorted(k for k in a if k != "all"):
        x, y = a[g], b[g]
        rows.append(f"| {g.replace('|', ', ')} | {sum(x.values())} | {x.get('agree', 0)} | {x.get('disagree', 0)} | {x.get('cannot (one reader gave no count)', 0)} | {y.get('agree', 0)} | {y.get('disagree', 0)} | {y.get('cannot (one reader gave no count)', 0)} |")
    return "\n".join(rows)


def coverage_table():
    ran = AN["ran"]
    desc = {"unroller": "unroller (`r_repeat.unroll`)", "unroller_cp": "unroller with the coda-pair fix", "music21": "music21 `repeat.Expander` (part 0)",
            "pt_max": "partitura `unfold_part_maximal` (default `ignore_leaps=True`)", "pt_max_noleap": "partitura `unfold_part_maximal(ignore_leaps=False)`", "pt_min": "partitura `unfold_part_minimal`"}
    rows = ["| reader | gave a count | error | no count (not expandable) |", "| --- | --- | --- | --- |"]
    for k, d in desc.items():
        rows.append(f"| {d} | {ran[k]['count']} | {ran[k]['error']} | {ran[k]['none']} |")
    return "\n".join(rows)


def named_table():
    rows = ["| item | expected (reading, written before the readers ran) | unroller | unroller + fix | music21 | partitura maximal (no leaps) | partitura minimal |", "| --- | --- | --- | --- | --- | --- | --- |"]
    for i, r in SM["named"].items():
        def c(k):
            v, ver = r[k]
            return f"{cell(v)} ({ver})"
        exp = "none stated" if r["expected"] is None else (f"{r['expected']}" + (f" (or {r['alternative']})" if r["alternative"] else ""))
        rows.append(f"| {short(i)} | {exp} | {c('unroller')} | {c('unroller_cp')} | {c('music21')} | {c('pt_max_noleap')} | {c('pt_min')} |")
    return "\n".join(rows)


CAUSE = {
    "unbalanced repeat signs (a |: with no :|, several |: before one :|)": ["blues.aunt-hagars-blues", "blues.jazz-me-blues", "blues.st-james-infirmary", "classical.chopin-mazurka-op24-3.nifc", "classical.chopin-mazurka-op6-1.nifc",
        "classical.chopin-mazurka-op6-2.nifc", "classical.mozart-minuet-in-c-major-fragment-k-15rr.pdmx", "folk.dark-eyes.pdmx", "pop.after-you-ve-gone.pdmx", "pop.avalon.pdmx", "pop.margie.pdmx",
        "ragtime.joplin-cascades", "ragtime.joplin-elite-syncopations", "ragtime.joplin-eugenia", "ragtime.joplin-rose-leaf-rag", "ragtime.joplin-stoptime-rag"],
    "a :| straight after another :| (a one-bar section)": ["classical.chopin-mazurka-op68-2.nifc", "ragtime.joplin-march-majestic", "ragtime.joplin-pleasant-moments"],
    "lone :| read as ending the section after the previous :|": ["classical.haydn-sonata-in-g-major-hob-xvi-8.pdmx"],
    "volta bracket stops before the :| (or no second volta)": ["classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx", "folk.carioquinha.pdmx"],
    "jump taken to a sign or words the file does not hold (no Fine, no segno, no coda, bare D.C.)": ["classical.ah-vous-dirais-je-maman.pdmx", "classical.radetzky-march-for-easy-piano.pdmx", "classical.st-louis-blues.pdmx",
        "jazz.the-crave", "pop.toby-fox-sans-from-undertale-for-piano.pdmx", "classical.pachelbel-pachelbel-chaconne-in-f-minor.pdmx"],
    "jump words that need a reading (plain D.S., D.C. mid-piece, coda sign position, repeats inside the coda, a D.C. whose Fine is in a volta)": ["beautiful.merry-christmas-mr-lawrence", "pop.coldplay-clocks-coldplay.pdmx",
        "classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx", "jazz.vince-guaraldi-skating.pdmx", "classical.nazareth-carioca-1913.pdmx"],
    "`times` on a :| (music21 and the unroller read 3 as three plays; partitura as two)": ["pop.eiffel-65-i-m-blue.pdmx"],
}
cause_of = {"song." + i: c for c, ids in CAUSE.items() for i in ids}
amb = {i for i, e in F.items() if e["kind"] in ("convention", "undetermined")}
assert set(cause_of) == amb, (sorted(amb - set(cause_of)), sorted(set(cause_of) - amb))


def cause_table():
    rows = ["| why the count depends on a reading or is not stated | files |", "| --- | --- |"]
    for c, ids in CAUSE.items():
        rows.append(f"| {esc(c)} | {len(ids)} |")
    rows.append(f"| all | {len(amb)} |")
    return "\n".join(rows)


def readings_table():
    rows = ["| # | file | printed bars; structure printed in the score (`\\|:` forward repeat, `:\\|` backward, `V1` volta, signs and jump words; bar numbers 1-based) | right count (reading) | unroller | + fix | music21 | partitura (no leaps) | note |",
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    n = 0
    for i in sorted(F, key=lambda x: (F[x]["pipeline"], x)):
        e = F[i]
        n += 1
        st = S[i]["structure"]
        if len(st) > 230:
            st = st[:230] + " ..."
        if e["kind"] == "undetermined":
            right = "not stated (" + ", ".join(f"{k}: {v}" for k, v in e["alts"].items()) + ")"
        else:
            right = str(e["reading"])
            if e["alts"]:
                right += " (" + "; ".join(f"{v} if {k}" for k, v in e["alts"].items()) + ")"
        note = e["note"]
        rows.append(f"| {n} | {esc(short(i))} | {e['printed']}; `{esc(st)}` | {esc(right)} | {cell(e['unroller'])} | {cell(e['unroller_cp'])} | {cell(e['music21'])} | {cell(e['pt_max_noleap'])} | {esc(note)} |")
    return "\n".join(rows)


def verdict_table():
    v = SM["verdict_88"]
    rows = ["| reader | right | wrong | gave no count | of |", "| --- | --- | --- | --- | --- |"]
    desc = {"unroller": "unroller", "unroller_cp": "unroller + coda-pair fix", "music21": "music21 `Expander`", "pt_max_noleap": "partitura maximal (no leaps)", "pt_max": "partitura maximal (default)", "pt_min": "partitura minimal"}
    for k, d in desc.items():
        c = v[k]
        rows.append(f"| {d} | {c.get('right', 0)} | {c.get('wrong', 0)} | {c.get('no count', 0)} | {sum(c.get(x, 0) for x in ('right', 'wrong', 'no count'))} |")
    return "\n".join(rows)


def fix_table():
    rows = ["| file | unroller | + fix | music21 | right count (reading) |", "| --- | --- | --- | --- | --- |"]
    for f in SM["fix"]:
        e = F.get(f["id"])
        right = "not stated" if (e is None or e["kind"] == "undetermined") else str(e["reading"])
        if e and e["alts"]:
            right += " (" + "; ".join(str(v) for v in e["alts"].values()) + " by the alternative)"
        rows.append(f"| {short(f['id'])} | {f['before']} | {f['after']} | {cell(f['music21'])} | {right} |")
    return "\n".join(rows)


# ---- times tables
def times_named():
    rows = ["| item | expected (reading) | signature changes in the file | current detector: changes of metre / named bars | current + fix | music21 plain read | partitura plain read |", "| --- | --- | --- | --- | --- | --- | --- |"]
    for i, r in TS["named"].items():
        def c(m):
            x = r[m]
            nb = "right" if x["named_bars_right"] else "wrong"
            ic = "right" if x["item_right"] else "wrong"
            return f"{x['changes_of_metre']} ({ic}); named bars {nb}"
        rows.append(f"| {short(i)} | {r['expected_class']}, {r['expected_changes_of_metre']} change(s) of metre | {r['n_sig_changes']} | {c('current')} | {c('fix')} | {c('music21')} | {c('partitura')} |")
    return "\n".join(rows)


def times_named_bars():
    rows = ["| item | named bars (0-based index): label under the current detector | label under current + fix |", "| --- | --- | --- |"]
    for i, r in TS["named"].items():
        a = ", ".join(f"{k}: {v}" for k, v in r["current"]["named_bars"].items())
        b = ", ".join(f"{k}: {v}" for k, v in r["fix"]["named_bars"].items())
        rows.append(f"| {short(i)} | {esc(a)} | {esc(b)} |")
    return "\n".join(rows)


def times_totals():
    t = TS["totals"]
    rows = ["| count over the 49 items with a signature change | signature changes / changes of metre |", "| --- | --- |",
            f"| signature changes, raw reader (`times.classify`) | {t['raw signature changes (times.classify)']} |",
            f"| signature changes, music21 plain read | {t['music21 plain read changes']} |",
            f"| signature changes, partitura plain read | {t['partitura plain read changes']} |",
            f"| current detector: counted as changes of metre | {t['current:change']} |",
            f"| current detector: reported apart as cadenza bar by words | {t['current:cadenza-words']} |",
            f"| current detector: reported apart as cadenza bar by the longer-bar clause | {t['current:cadenza-longer']} |",
            f"| current detector: reported apart as device (pair or final bar) | {t['current:device']} |",
            f"| current detector: reported apart as device? (one short bar at a boundary) | {t['current:device?']} |",
            f"| current + fix (longer-bar clause dropped): counted as changes of metre | {t['fix:change']} |",
            f"| items where the plain read and the current detector give a different count | {TS['items_differing']} of 49 |",
            f"| items whose count the fix changes | {TS['items_fix_changes']} of 49 |"]
    return "\n".join(rows)


def firings():
    cnt = collections.Counter(f["id"] for f in TS["clause_firings"])
    rows = ["| file | bars the clause calls cadenza bars | signatures (before, bar, after) of the first |", "| --- | --- | --- |"]
    first = {}
    for f in TS["clause_firings"]:
        first.setdefault(f["id"], f)
    for i, n in cnt.items():
        f = first[i]
        rows.append(f"| {short(i)} | {n} | {f['prev']}, {f['sig']}, {f['next']} (idx {f['idx']}) |")
    rows.append(f"| all | {sum(cnt.values())} in {len(cnt)} files | |")
    return "\n".join(rows)


T = TS["named_summary"]
tot = TS["totals"]
vr = SM["verdict_88"]
rule = SM["rule_music21_unroller_cp"]
rule0 = SM["rule_music21_unroller"]
amb_acc = SM["ambiguous"]["accepted_by_rule"]
n_amb = SM["ambiguous"]["n"]

PAGE = f"""# mark.repeat and notation.times: the current detectors against the library readers (step 3, two characteristics), 2026-10-08

**What this is.** One of the bounded comparisons of handoff step 3 (`docs/prompts/handoff-2026-10-08.md`), on two characteristics only: `mark.repeat` (area 1A, validation status failing) and `notation.times` (area 1C, failing). It follows the method of the pilot (`docs/classifier/evidence/1B/comparison/key.md`): the expected answers for the named items are stated before the readers are run, every figure below comes from a script in this folder, what did not run is listed, and the page ends in one recommendation line per characteristic. Nothing is rewritten and no rule page, survey or validation file is edited. Base commit c47f18c7; no file outside `docs/classifier/evidence/1A/comparison/` changed (scratch caches are under `build/cmp1A/`, ignored by git).

**Labels.** *measured*: a script in this folder produced it on the data named. *reading*: my reading of a score's printed structure (repeat signs, voltas, jump words, bar lengths), a hand-written bar path that `rep_readings.py` only adds up, or a reading of a source file; not run as a reader. Nothing here has been heard.

## 1. What was compared

**Catalogue.** The built catalogue `app/public/content` of the main checkout, read in place (`catalog.json`, 2,100 items; 2,020 with a notated file). Python {PYV}, music21 {music21.__version__}, partitura {partitura.__version__} (the repo's `.venv`).

**mark.repeat.**
- *Current detector*: the unroller of `evidence/1A/validation/r_repeat.py` (`unroll`, written to the spec in `rules/area-1A.md` section 23), run unchanged on the validators' raw MusicXML walk (`walk.py`, `common.py`). Both are executed from their source with two path substitutions in `walk.py` (the catalogue folder instead of the validators' build folder; the cache under `build/cmp1A/`), see `rcommon.py`.
- *Fix the validation row points to*: the two-coda-signs convention, which the validators already implemented as `unroll(w, coda_pair=True)` (the first of two coda signs with no "To Coda" words is the jump point). Measured by re-running the same function with it, and nothing more.
- *music21*: `repeat.Expander(part 0)`, defaults (`repeatAfterJump=False`), through the validators' own `m21_played`; `None` = `isExpandable()` is false.
- *partitura*: `score.unfold_part_maximal(part)` (default `ignore_leaps=True`), `unfold_part_maximal(part, ignore_leaps=False)` (no repeats after a leap, the nearest to the page's convention) and `unfold_part_minimal(part)`, found in the installed `partitura/score.py` (the module also has `iter_unfolded_parts`, `unfold_paths`, `unfold_part_alignment`); count = number of `Measure` objects of the unfolded part, a fresh `load_musicxml` for each call because `get_paths` adds segments to the part.
- *Files*: every catalogue file with repeat structure, by the predicate of the validators' `survey_repeat.py` (a forward or backward repeat barline, an ending, a segno, a coda, or a jump / Fine / Coda word in part 0): **{len(R)} files** (`rep_structure.py`: {sum(1 for v in S.values() if v['pipeline']=='pdmx')} PDMX ids, {sum(1 for v in S.values() if v['pipeline']=='other')} other, 0 generated; {sum(1 for v in S.values() if v['jump_words'])} with jump words). The rules page (section 23, "Validation") counts 211 PDMX and 120 other; this run finds 118 other. The 2-file difference is not traced (the validators' copy of the catalogue was taken earlier the same day; their file list is not in the repo).
- *Right count*: for the named items, stated before running (`expected_repeat_named.json`); for every file where the readers disagree, a bar path read from the printed structure by hand (`rep_readings.py`), with the convention it needs named. The reading rules (R1 to R4 at the top of `rep_readings.py`) are the page's rules plus the usual engraving rules, so the unroller agreeing with the reading is partly by construction; the information is in the files where it does not, and in the files where a reading depends on a convention or the file does not say.

**notation.times.**
- *Current detector*: `evidence/1C/validation/times.py` (`measures`, `classify`, `device_runs`), unchanged, through `tcommon.py` (one path substitution in `common.py`: the built catalogue instead of the validators' `content` copy).
- *Fix the validation row points to*: drop the clause "a one-bar signature longer than the bars around it is a cadenza bar". Measured by re-running `times.py`'s source with its one label `cadenza bar (one longer bar)` replaced by `change`, and nothing more (`tm_run.py`).
- *Plain read, music21*: part 0's `Measure` list, the `meter.TimeSignature` in each measure (`ratioString`), carried forward; a change is a bar whose signature differs from the one before.
- *Plain read, partitura*: part 0's `TimeSignature` objects (`beats`, `beat_type`) placed at their `Measure`'s start, carried forward, same change rule.
- *Items*: the 49 catalogue items with a signature change (the validation row's number; reproduced, `tm_changes.py`), and the nine named ones.
- *Expected answers*: `expected_times_named.json`, written from the validation row and the rule page. **Order, stated plainly:** the current detector's labels for all 49 items (`tm_changes.txt`) and the bar-by-bar view (`tm_detail.py`) had been printed before that file was written; the expectations come from the row's wording and the bar lengths, not from those labels.

## 2. What did not run, and the limits

- **Nothing was heard**; no printed page was seen. Every "right count" is a reading of a score file's structure. Where a printed edition could differ (a coda sign at the start or end of a bar, a volta bracket that stops before its `:|`), the table says so.
- **The unroller's agreement with my reading is partly by construction** (same rules). It is not an independent check of the rules; it checks the code against its own spec and exposes where the spec leaves a choice.
- **The {len(R) - len(F)} files where the readers that gave a count agree were not read one by one.** A random sample of 12 of them (seed 7, drawn by `rep_spot.py`, read in `rep_readings.py`) was read: the agreed count equals the reading in {SM['spot_ok']} of 12. Agreement can be wrong (the Romance, where music21 and partitura both give 64), so this is a sample, not a clearance; in this set only one file has jump words (`tango-la-cumparsita...`, a bare Fine).
- **partitura errors**: `unfold_part_maximal` raised `IndexError('list index out of range')` on {AN['ran']['pt_max']['error']} files (in `list_of_destinations_from_last_segment`, reached through a 400-deep recursion of `unfold_paths`; seen in a traceback on `song.folk.so-danco-samba.pdmx`; cause not traced), `unfold_part_minimal` on {AN['ran']['pt_min']['error']}. They count as "no count".
- **music21 errors**: one file does not parse (`song.classical.mozart-k545-i.alt`: `MusicXMLImportException: incorrect accidental 9.0 for pitch F3`); {AN['ran']['music21']['none']} files are not expandable (`isExpandable()` false).
- **Neither library takes a D.C., D.S. or coda from the words in the catalogue except music21 for the words it recognises**: partitura builds jump objects only from `<sound>` attributes; {len(json.load(open(HERE / 'rep_pt_paths.json', encoding='utf8')))} of {len(R)} files carry any (the Hungarian Sonata; there `unfold_part_maximal` returns the 49 printed bars and `get_paths` with `all_repeats=False` raises the same IndexError; `rep_pt_paths.py`).
- **Timing** (measured, 8 worker processes at once on this PC, so the relation matters, not the figures): per file, mean over the {len(R)} files, unroller under 0.01 s after the raw walk (`rep_structure.py`, which walks all 2,020 files and fills the cache, took 53 s once), music21 parse + `Expander` {SM['timing']['t_music21'][0]} s (maximum {SM['timing']['t_music21'][1]} s), partitura three loads and unfoldings {SM['timing']['t_partitura'][0]} s (maximum {SM['timing']['t_partitura'][1]} s).
- Not run: any other library's repeat expansion (the survey names none); the printed-page check; a larger sample of the agreed files.

## 3. mark.repeat

### 3.1 Which readers gave a count (`rep_readers.py`, summarised by `rep_analysis.py`)

{coverage_table()}

### 3.2 The named items

Expected counts were written to `expected_repeat_named.json` from the printed structure and the sign positions (`rep_structure.py`, `rep_signs.py`) before `rep_readers.py` was run. Right = the reader's count equals the expected one. Carioca has no single right count (see below).

{named_table()}

- **Romance (80)**: only the unroller takes the "D.C. al Fine" (the words carry an empty `<font>` markup); music21 and partitura both give 64 and agree on a wrong count. (*measured*, `rep_readers.json`.)
- **Haydn Hob. XVI:8 (194)**: music21 gives 956, partitura 194 and the unroller 194. Eight sections end in `:|`; four have a `|:` (18 to 46, 55 to 62, 68 to 73, 82 to 97) and four are closed by a lone `:|` (bars 17, 54, 67, 81), read as repeating the section since the previous `:|` (or bar 1); if a lone `:|` returned further back the count would be larger.
- **Bagatelle Op. 119 No. 3 (115)**: the unroller as it is gives 133; music21 115; partitura 97 (it ignores the D.C. al Coda). With the coda-pair fix the unroller gives 115. The first coda sign is written at offset 0.00 of bar 18 (`rep_signs.txt`); read literally the jump comes before bar 18 and the count is 114, music21 and the page read it as 115.
- **Down by the Riverside .2 (78)**: unroller 122, fix 78, music21 78, partitura 66. The coda sign is at the end of bar 16, so bars 5 to 16 are played.
- **Carioca (no single right count)**: the printed structure is bar 1, A with voltas 1 and 2 (bars 17, 18), B with voltas (50, 51) and "D.S. al Coda" at the end of 51, then the coda from 53 with its own `|:` and voltas (69, 70), then "D.C. al" at bar 78 whose Fine is the end of bar 18, volta 2 of an A section whose first volta is numbered "1,3". Up to the D.C. the reading gives 153 bars with the coda's own repeats played (137 if they are not played after the jump); the D.C. tail is 16, 17 or 33 bars depending on how volta "1,3" and the Fine in volta 2 are read, so the total is 169, 170 or 186 with the coda's repeats; the file does not say which. The unroller gives 169 (`rep_trace.txt`: the coda sign at bar 16 is not marked "To Coda", so after the D.S. it plays on through the whole piece; it takes only one jump, so the D.C. at bar 78 is never taken; the number is near a reading by coincidence), with the fix 136 (it skips both coda voltas, bars 69 and 70, by asking for volta 3, and still never takes the D.C.); 136 is below the smallest reading before the D.C. (137), so it is wrong under every reading. music21 cannot expand it; partitura gives 155 (repeats only, no jumps). Reported as the validation row did: unconfirmed.
- **Joplin rags (music21 over-expands)**: {SM['ragtime']['all']} files under `song.ragtime.*` have repeat structure; music21 expands {SM['ragtime']['m21_count']} and equals the unroller on {SM['ragtime']['m21_equal_unroller']}. Of the 13 ragtime files in the disagreement set where music21 gave a count, it differs from the reading in all 13: 12 over-expansions (1.2 to 9.0 times the reading; *School of Ragtime*, 33 printed bars, reading 66 bars, music21 592) and one under-expansion (*Maple Leaf Rag*, 130 against 145). The over-expanded files close their sections with a lone `:|` or have `|:` signs the reading pairs differently; music21's mechanism was not traced (a first guess, every lone `:|` returning to bar 1 once, gives 135 for *School of Ragtime*, not 592, so that is not it).

### 3.3 Agreement between the readers, all {len(R)} files

{agreement_table()}

By group (pipeline, whether the file has jump words):

{agreement_groups()}

All three of unroller + fix, music21 and partitura (no leaps) give the same count on {AN['three_way_cp']['all three equal']} files, are not all equal on {AN['three_way_cp']['not all equal']}, and on {AN['three_way_cp']['a reader gave no count']} a reader gave no count. The unroller as it is gives the same three-way split (the fix changes 7 files, none of which is one of the 233).

### 3.4 The {len(F)} files where the readers disagree: structure read, right count stated

A file is in this table when the counts given by the unroller, the unroller with the fix, music21 and partitura (no leaps) are not all equal. The partitura column is mostly a blind spot (it takes no jump words); music21 is not. "Right count (reading)" is my hand-written bar path (full paths and alternatives in `rep_readings.json`); *kind* is in `rep_readings.json` too: right = one count follows; convention = one count follows under the stated rule, the alternative is given; undetermined = the file does not say. Of the {len(F)}: {sum(1 for e in F.values() if e['kind']=='right')} right, {sum(1 for e in F.values() if e['kind']=='convention')} convention, {sum(1 for e in F.values() if e['kind']=='undetermined')} undetermined.

{readings_table()}

Why {n_amb} of the {len(F)} depend on a reading or are not stated:

{cause_table()}

### 3.5 The readers against the reading (`rep_summary.py`), on the {len(F) - vr['unroller']['file undetermined']} determinable files of those {len(F)}

(Undetermined files, {vr['unroller']['file undetermined']}, are left out. "Right" counts a convention file as right when the reader gives the primary reading.)

{verdict_table()}

- music21 is wrong on {vr['music21']['wrong']} files: {SM['m21_wrong'].get('over|no jump words', 0) + SM['m21_wrong'].get('over|jump words', 0)} over-expansions (more bars than the reading; the largest is *School of Ragtime*, 592 against 66) and {SM['m21_wrong'].get('under|no jump words', 0) + SM['m21_wrong'].get('under|jump words', 0)} under-expansions (for example Für Elise, 106 against 127, and O Holy Night, 96 against 123: its count equals the printed bar count, no repeat taken). It gave no count on {vr['music21']['no count']} of these files. Split by jump words (*measured*, `rep_summary.txt`; the {len(F)} files are selected for disagreement, so these are not catalogue rates): with jump words {SM['verdict_split']['music21']['jump words|right']} right, {SM['verdict_split']['music21']['jump words|wrong']} wrong, {SM['verdict_split']['music21']['jump words|no count']} no count; without {SM['verdict_split']['music21']['no jump words|right']} right, {SM['verdict_split']['music21']['no jump words|wrong']} wrong, {SM['verdict_split']['music21']['no jump words|no count']} no count. Over the whole catalogue it gave a count on 290 files and equals the fixed unroller on 260 of them; the 30 others are the 30 wrong ones (the agreed 260 are taken as right, 12 of them sampled).
- partitura (no leaps), same split: with jump words {SM['verdict_split']['pt_max_noleap']['jump words|wrong']} wrong of {SM['verdict_split']['pt_max_noleap']['jump words|wrong'] + SM['verdict_split']['pt_max_noleap'].get('jump words|no count', 0)} (it takes none), without {SM['verdict_split']['pt_max_noleap']['no jump words|right']} right and {SM['verdict_split']['pt_max_noleap']['no jump words|wrong']} wrong; it equals one of the listed alternative readings (typically a lone `|:` repeated to the end) on {len(SM['alt_equal']['pt_max_noleap'])} of the {sum(1 for e in F.values() if e['alts'])} files that have one, music21 on {len(SM['alt_equal']['music21'])}.
- The unroller as it is is wrong on 6 files; all six have two coda signs and no "To Coda" words, which is the case the fix addresses.

### 3.6 The fix (`unroll(w, coda_pair=True)`)

{fix_table()}

Measured: the fix corrects 5 of the 6 files the unroller got wrong against the reading (Bagatelle, Down by the Riverside .2, Weary Blues, Margaritaville, Skating) and leaves Carioquinha wrong. Carioquinha is a different fault: the unroller resets its pass counter at the `:|` of bar 38, which sits after the first-ending bracket (stopped at bar 37) and before the second ending (bar 39), so it never plays bar 39 (`rep_trace.txt`: path `7-36 38 40-72`); its 137 equals the reading's alternative (bar 38 inside volta 1, 137), but by a path that plays bar 38 and drops bar 39, so it is right for the wrong reason under that alternative and 1 short of the primary reading (138). Carioca's count goes from 169 to 136 (section 3.2): the fix does not touch the one-jump limit or the volta-by-number rule that break it. After the fix the unroller is wrong against the reading on 1 of {len(F) - vr['unroller']['file undetermined']} determinable files (Carioquinha) and is wrong or unconfirmable on Carioca.

### 3.7 The page's two-witness rule, measured

The rule on `rules/area-1A.md` section 23: the unroller and music21 agree, then accept (`two-witnesses`); otherwise UNKNOWN or `one-witness`, flagged. With the fix, music21 as the witness:
- accepted (unroller + fix = music21): {rule['accepted']} of {len(R)} files; of those, {rule['accepted_read']} were read (they are in the disagreement set, mostly jump files) and {len(rule['accepted_wrong'])} are wrong by the reading; the other {rule['accepted'] - rule['accepted_read']} were not individually read (sample of 12: all right).
- flagged (they disagree, or music21 cannot expand): {rule['flagged']} files; of the {rule['flagged_read']} of those that were read and have a determinable count, the fixed unroller's count is right in {rule['flagged_unroller_right']}; {rule['flagged_not_read']} flagged files were not read (music21 gave no count and the unroller and partitura agree).
- of the {n_amb} files whose count depends on a reading or is not stated, the rule flags {n_amb - len(amb_acc)} and accepts {len(amb_acc)} ({', '.join(short(i) for i in amb_acc)}): the Bagatelle (115 against 114 by the sign position) and *I'm Blue* (`times=3`, read as three plays by both music21 and the unroller).
- Without the fix the same rule accepts {rule0['accepted']}, flags {rule0['flagged']}; no accepted file that was read is wrong.
- partitura (no leaps) as the witness: agrees with the fixed unroller on {SM['rule_pt']['agree']} of {len(R)} files, none of the read ones wrong ({len(SM['rule_pt']['agree_wrong'])}), but it agrees only where there is nothing to jump.

### 3.8 What the numbers say

- *The current unroller with the validation row's fix is the most accurate reader on our catalogue* against my reading: right on {vr['unroller_cp']['right']} of {vr['unroller_cp']['right'] + vr['unroller_cp']['wrong']} determinable disagreement files, against music21's {vr['music21']['right']} of {vr['music21']['right'] + vr['music21']['wrong'] + vr['music21']['no count']} (and {vr['music21']['no count']} with no count) and partitura's {vr['pt_max_noleap']['right']} of {vr['pt_max_noleap']['right'] + vr['pt_max_noleap']['wrong'] + vr['pt_max_noleap']['no count']}. It is the only reader whose count follows the jump words, except in files with two jumps (it takes one).
- *The fix is measured*: Bagatelle 133 to 115 and Down by the Riverside .2 122 to 78, as the row says; it also corrects Weary Blues (90 to 77), Margaritaville (132 to 127) and Skating (227 to 179), and makes Carioca worse (169 to 136).
- *But a count is only as good as the reading rules*: {n_amb} of the {len(F)} disagreement files (and, among the 241 unread agreed files, any like them) depend on a convention (unbalanced repeat signs, a one-bar `:|` section, a plain D.S., repeats inside a coda, `times`) or on words the file does not complete (a D.C. al Fine with no Fine). Library agreement does not settle those: music21 passes 2 of the {n_amb}.
- *music21's disagreements are informative*: it flags {n_amb - len(amb_acc)} of those {n_amb}, but within the {len(F)} disagreement files it is wrong on {vr['music21']['wrong']} of the {vr['music21']['right'] + vr['music21']['wrong']} where it gave a count, so as a second reader it sends many right counts to the agent (flagged files whose unroller count is right: {rule['flagged_unroller_right']} of {rule['flagged_read']} read).

## 4. notation.times

### 4.1 The 49 items with a signature change (`tm_changes.py`, `tm_run.py`, `tm_summary.py`)

{times_totals()}

*measured.* The plain reads of music21 and partitura agree with the raw reader on all 49 items: same bar count, same signature per bar, same change indices (187 changes). So as a read of signatures and their bars they are interchangeable with the validators' walk. The current detector reports 116 of the 187 as changes of metre and sets 71 apart: 32 by the longer-bar clause, 25 as "device?" candidates, 9 as devices (pairs and final bars), 5 as cadenza bars by words.

### 4.2 The named items

Expected answers: `expected_times_named.json`. Two criteria are given: *item*, the number of changes of metre counted for the file equals the expected number; *named bars*, every named bar that is a signature change carries the expected class (a "device?" candidate counts as device). The plain reads cannot class a bar, so they count every signature change.

{times_named()}

Named bars, by label:

{times_named_bars()}

Right out of the nine items: {', '.join(f"{m}: item {T[m]['item_changes_of_metre_right']}, named bars {T[m]['named_bars_right']}" for m in ('current', 'fix', 'music21', 'partitura'))}.

- **The four rows' failures reproduce** (*measured*): *Mariage d'amour* idx 2 and six more 5/4 bars, *Scarborough Fair* idx 101, *The Lonely Man* idx 3 and *Holy, Holy, Holy* idx 15 are called cadenza bars by the longer-bar clause, so the detector counts 15 of 22, 1 of 2, 1 of 2 and 0 of 1 changes. Dropping the clause gives 22, 2, 2 and 1: right on all four.
- **The clause fires on 32 bars in 8 files** (section 4.3). The four named files, the two other *Mariage d'amour* variants (same bars; `.alt` also a 5/4 then 6/4 pair at idx 80 and 81), *Levi's Choice* idx 32 (a 5/4 bar ending on a double barline, *reading*: a measured change) and *Super Mario Land 2* idx 3, 172, 304 and 308 (12/4, 8/4, 11/8 and 33/16, one bar each; the 12/4 bar follows "poco rit." and the 33/16 bar carries "A tempo": *reading*, plausibly long free bars, which is the rule's own example; undetermined without the printed page).
- **Where the row says the pair clause is right, the measured labels differ**: on the Bagatelle the named pair and final-bar bars that are signature changes (6) are all labelled device or "device?", but the three bars that return to 3/8 (idx 10, 28, 37) are counted as changes, so the item shows 3 changes of metre where the page says none (the row's wording note); on Mozart K. 1e and K. 1f the 2/4 bar is only a "device?" candidate and its 1-beat partner (3/4 signature, one beat long) is counted as a change (3 and 1 changes). Cause (*reading* of `times.py`): the pair test adds the two bars' signature lengths (2 + 3), not the notated lengths (2 + 1), so a pair whose second bar keeps the signature never matches.
- **Radetzky (idx 71, a 1/4 bar)**: every method counts it and its return bar as 2 changes; the row says code has no test for a section pickup, and the measured labels agree ("change (short bar, no boundary)").
- **Op. 9 No. 2**: the words clause is right (0 changes of metre, 3 cadenza bars); the plain reads, which cannot see "Senza tempo", report 3 changes.

### 4.3 Every use of the longer-bar clause (`tm_summary.py`)

{firings()}

### 4.4 What the numbers say

- A plain read of the signatures is exact: both libraries equal the raw reader on 187 changes in 49 items. What the libraries cannot give is the class of a change (device, pickup, cadenza), which needs the bar's notated length, the barlines and the words.
- The current detector's class labels are wrong on the four named measured changes (15 of 22, 1 of 2, 1 of 2, 0 of 1 counted) and its pair clause does not fire on Mozart K. 1e and K. 1f; with the clause dropped it is right on {T['fix']['named_bars_right']} of 9 named items by named bars and {T['fix']['item_changes_of_metre_right']} of 9 by item count, against {T['current']['named_bars_right']} and {T['current']['item_changes_of_metre_right']} now and {T['music21']['named_bars_right']} and {T['music21']['item_changes_of_metre_right']} for either plain read.
- What is left after the fix is the device and pickup class (Radetzky, K. 1e, K. 1f, the Bagatelle's return bars): signatures held for one or two bars next to a repeat, a double barline or a Fine, where the notated length differs from the signature. The row already calls the pickup undecidable by code.

## 5. Scripts and data in this folder

| file | what it does | writes |
| --- | --- | --- |
| `rcommon.py` | loads the 1A validators' `walk.py`, `common.py`, `r_repeat.py` from source with two path substitutions | - |
| `rep_structure.py` | selects the {len(R)} files with repeat structure; prints each file's printed structure | `rep_structure.json` |
| `rep_signs.py` | where segno / coda / Fine signs sit in their bars | `rep_signs.txt` |
| `expected_repeat_named.json` | the expected counts of the named items, written before the readers ran | - |
| `rep_readers.py` | the played-bar count of each file by the unroller (and with the fix), music21 `Expander`, partitura unfolding | `rep_readers.json` (per-item counts, errors, times) |
| `rep_analysis.py` | agreement tables, the disagreement list | `rep_analysis.json`, `rep_disagreements.json`, `rep_analysis.txt` |
| `rep_readings.py` | my hand-written bar paths for the {len(F)} disagreement files, summed and compared with the readers; 12-file spot check | `rep_readings.json`, `rep_readings.txt` |
| `rep_spot.py` | draws the 12-file spot-check sample (seed 7) and checks it against `rep_readings.py` | `rep_spot.txt` |
| `rep_summary.py` | named-item verdicts, reader verdicts, the fix, the two-witness rule | `rep_summary.json`, `rep_summary.txt` |
| `rep_trace.py` | the bar path the unroller follows (diagnosis of Carioquinha and Carioca) | `rep_trace.txt` |
| `rep_pt_paths.py` | files where partitura could see a jump (`<sound>` attributes) | `rep_pt_paths.json`, `rep_pt_paths.txt` |
| `tcommon.py` | loads the 1C validators' `common.py` and `times.py` from source with one path substitution | - |
| `tm_changes.py`, `tm_detail.py` | the current detector's output on all 2,020 files; the bar-by-bar view | `tm_current.json`, `tm_changes.txt` |
| `expected_times_named.json` | the expected classes of the named times items | - |
| `tm_run.py` | current detector, the fix (one label replaced), music21 and partitura plain reads on the 49 items | `tm_results.json`, `tm_run.txt` |
| `tm_summary.py` | the times tables and the clause's firings | `tm_summary.json`, `tm_summary.txt` |
| `build_page.py` | assembles this page from the JSON files | `repeat-times.md` |

To reproduce: with the main checkout's `.venv` and `-X utf8`, run the scripts in the order of the table from this worktree (they read `app/public/content` of the main checkout in place); `rep_readers.py --all` takes about a minute with 8 processes, `tm_run.py` about 80 seconds.

## 6. Recommendation

mark.repeat: code + agent (code counts with the unroller plus the coda-pair fix and flags a file when music21 disagrees or cannot expand it, when its repeat signs are unbalanced, or when a jump word has no sign to go to; the agent decides the count then) — the fixed unroller is right on {vr['unroller_cp']['right']} of {vr['unroller_cp']['right'] + vr['unroller_cp']['wrong']} determinable files where the readers differ (music21 {vr['music21']['right']} right, {vr['music21']['wrong']} wrong, {vr['music21']['no count']} no count; partitura {vr['pt_max_noleap']['right']} right), but {n_amb} of the {len(F)} depend on a reading the file does not settle and music21's disagreement flags {n_amb - len(amb_acc)} of them.
notation.times: code + agent (code lists every signature with its bar by the plain music21 TimeSignature read and flags bars whose notated length differs from the signature, signatures held for one or two bars, and changes inside a words passage; the agent decides change of metre, device, pickup or cadenza) — the plain read gives {tot['raw signature changes (times.classify)']} changes in 49 items, identical in music21, partitura and the raw reader, the current detector counts {tot['current:change']} of them as changes of metre (right on {T['current']['item_changes_of_metre_right']} of 9 named items), dropping the longer-bar clause gives {tot['fix:change']} (right on {T['fix']['item_changes_of_metre_right']} of 9) and still gets the pair and pickup cases wrong.
"""
(HERE / "repeat-times.md").write_text(PAGE, encoding="utf-8")
print("written", len(PAGE), "chars")
