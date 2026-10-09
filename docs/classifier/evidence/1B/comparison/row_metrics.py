"""pitch.tone-row metrics: reads row_scan.json, row_cases.json, row_music21_results.json; writes frag_row.md and row_metrics.json.
Usage: python -X utf8 row_metrics.py"""
import json, statistics, collections
from pathlib import Path
HERE = Path(__file__).resolve().parent
scan = json.load(open(HERE / "row_scan.json"))
cases = {c["id"]: c for c in json.load(open(HERE / "row_cases.json"))}
M = json.load(open(HERE / "row_music21_results.json"))
ok = [r for r in scan if "cur" in r]
md = []


def ms(x):
    x = sorted(x)
    return f"{statistics.mean(x)*1000:.1f} / {statistics.median(x)*1000:.1f} / {x[-1]*1000:.1f}"


# ---------------------------------------------------------------- R1 catalogue pass
gen = [r for r in ok if r["p"] == "generated"]
real = [r for r in ok if r["p"] != "generated"]
def cnt(L, f):
    return sum(1 for r in L if f(r))
md.append(f"**Catalogue pass of the current detector (`row_scan.py`): {len(ok)} readable items ({len(gen)} generated, {len(real)} real); {len(scan) - len(ok)} not scanned (31 one-line-staff or unreadable-view items, 4 reader errors).**\n")
md.append("| count | generated | real | all |")
md.append("| --- | --- | --- | --- |")
for lbl, f in (("12 different pitch classes in 12 consecutive notes of a line (no scale-figure filter)", lambda r: bool(r["run12"])),
               ("at least one statement (page rule 1: the filter on)", lambda r: r["cur"]["n_statements"] >= 1),
               ("a row present (rule 3: two statements that are forms of one row)", lambda r: r["cur"]["present"]),
               ("two consecutive candidate windows (rule 4)", lambda r: bool(r["cur"]["consecutive_window_pairs"])),
               ("sent to the agent (two consecutive windows or a statement)", lambda r: r["cur"]["to_agent"])):
    md.append(f"| {lbl} | {cnt(gen, f)} | {cnt(real, f)} | {cnt(ok, f)} |")
md.append("")
flagged = [r for r in ok if r["run12"] or r["cur"]["to_agent"]]
md.append(f"The items flagged by either test: {len(flagged)} ({sum(1 for r in flagged if r['p']=='generated')} generated chromatic-scale drills, {sum(1 for r in flagged if r['p']!='generated')} real). They are the catalogue's candidates for a tone row; the table below states the row for each.\n")

# ---------------------------------------------------------------- R2 per item
md.append("**The flagged catalogue items, with the row stated from the score and what each method did.** `run12`: a line has 12 different pitch classes in 12 consecutive notes (steps by a second in that run, of 11, from music21-free note view). `cur`: statements / present / windows (consecutive pairs) / sent to the agent. music21 columns: statements found of the row chosen by `self` (the piece's own first 12-pitch-class run), `first12` (first 12 notes of the first staff), `hist` (the 71 rows of music21's table): rows found twice or more, or `timeout`. Row stated: `none` for all, on the basis in the last column.\n")
md.append("| item | bars | run12 | steps by second in the first 12-note run | cur: st / present / win (pairs) / agent | music21 self | music21 first12 | music21 hist | row (from the score) |")
md.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
n_self_found = n_first12_found = n_hist_found = n_hist_timeout = n_hist_ok = 0
for r in flagged:
    f = M.get(f"cat|{r['id']}|fast", {})
    h = M.get(f"cat|{r['id']}|hist", {})
    sc = f.get("choices", {}).get("self")
    fc = f.get("choices", {}).get("first12")
    hc = h.get("choices", {}).get("hist")
    c = r["cur"]
    selfs = "no run" if sc is None or sc["row"] is None else f"{sc['n_statements']} stmts" + (" FOUND" if sc["found"] else "")
    if sc and sc["found"]:
        n_self_found += 1
    f12 = "-" if fc is None else ("no row" if fc["row"] is None else f"{fc['n_statements']} stmts" + (" FOUND" if fc["found"] else ""))
    if fc and fc["found"]:
        n_first12_found += 1
    if hc:
        n_hist_ok += 1
        hs = "none" if not hc["found"] else "FOUND " + ",".join(hc["found_rows_ge2"])
        if hc["found"]:
            n_hist_found += 1
    elif "timeout" in h:
        hs = f"timeout ({h['timeout']} s)"
        n_hist_timeout += 1
    else:
        hs = "error" if h else "-"
    sec = sc["where"]["seconds_of_11"] if sc and sc.get("where") else None
    basis = ("a chromatic scale exercise (a generated drill)" if r["p"] == "generated" else f"{r.get('composer') or ''}, {r['title'][:45]}: tonal repertoire (key named in the title or the genre is tonal)")
    md.append(f"| {r['id']} | {r['bars']} | {'yes' if r['run12'] else 'no'} | {sec if sec is not None else '-'} | {c['n_statements']} / {'yes' if c['present'] else 'no'} / {len(c['windows'])} ({c['consecutive_window_pairs']}) / {'yes' if c['to_agent'] else 'no'} | {selfs} | {f12} | {hs} | none: {basis} |")
md.append("")
md.append(f"**Catalogue false finds (every flagged item is tonal or a chromatic drill, so any find is false).** Current detector: rows present 0 of {len(flagged)}; sent to the agent {sum(1 for r in flagged if r['cur']['to_agent'])}. music21 `search.serial` with the row chosen by `self`: found (two or more statements) {n_self_found} of {len(flagged)}; by `first12`: {n_first12_found}; by `hist` (71 table rows): {n_hist_found} found of {n_hist_ok} that finished within the limit, {n_hist_timeout} timed out.\n")

# ---------------------------------------------------------------- R3/R4 built
def res(cid):
    return M.get(f"built|{cid}|all", {})


def tally(prefix, label):
    ids = [c for c in cases if c.startswith(prefix)]
    n = len(ids)
    cur_present = sum(1 for c in ids if res(c).get("current", {}).get("present"))
    cur_flag = sum(1 for c in ids if res(c).get("current", {}).get("present") or res(c).get("current", {}).get("to_agent"))
    cur_st_ge1 = sum(1 for c in ids if res(c).get("current", {}).get("n_statements", 0) >= 1)
    o = {}
    for ch in ("oracle", "self", "first12"):
        o[ch] = sum(1 for c in ids if res(c).get("choices", {}).get(ch, {}).get("found"))
    hist_found = sum(1 for c in ids if res(c).get("choices", {}).get("hist", {}).get("found"))
    hist_right = sum(1 for c in ids if cases[c]["row"] and c.split("_", 1)[1] in res(c).get("choices", {}).get("hist", {}).get("found_rows_ge2", []))
    hist_timeout = sum(1 for c in ids if "timeout" in res(c))
    return n, cur_present, cur_flag, cur_st_ge1, o, hist_found, hist_right, hist_timeout


md.append("**Built positives (a row stated in the score by construction): found / total.** V1: one line, the row P then its inversion I then its retrograde R (3 statements); V2: the same row split between the hands as three-note chords, 8 bars (P and I split across both hands); V3: one line, every note struck twice. Rows are the 71 of music21's table of rows from named works (every sixth for V2 and V3). `cur present` = code alone reports a row (rule 3); `cur present or sent` = code alone or the trigger sends it to the agent; `cur >=1 statement` = rule 1 finds a statement. music21 columns: two or more statements of the row chosen by the named rule (`oracle` is the true row, unavailable for a real piece).\n")
md.append("| variant | scores | cur >=1 statement | cur present | cur present or sent | music21 oracle | music21 self | music21 first12 | music21 hist (any row found twice) | hist: the right row among those found | hist timed out |")
md.append("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")
bj = {}
for pref, lbl in (("V1", "V1 one line P, I, R"), ("V2", "V2 split between hands"), ("V3", "V3 repeated notes")):
    n, cp, cf, c1, o, hf, hr, ht = tally(pref, lbl)
    bj[pref] = {"n": n, "cur_present": cp, "cur_flag": cf, "cur_st1": c1, "m21": o, "hist_found": hf, "hist_right": hr, "hist_timeout": ht}
    md.append(f"| {lbl} | {n} | {c1}/{n} | {cp}/{n} | {cf}/{n} | {o['oracle']}/{n} | {o['self']}/{n} | {o['first12']}/{n} | {hf}/{n} | {hr}/{n} | {ht} |")
md.append("")
# V1 misses by the current detector
missed = [c for c in cases if c.startswith("V1") and not res(c).get("current", {}).get("present")]
md.append(f"V1 rows the current detector does not report as present ({len(missed)} of 71): " + (", ".join(
    f"{c[3:]} ({res(c).get('current', {}).get('n_statements')} statements)" for c in missed) if missed else "none") + ".\n")
miss_o = [c for c in cases if c.startswith("V") and cases[c]["row"] and not res(c).get("choices", {}).get("oracle", {}).get("found")]
md.append(f"Scores where music21 with the true row (`oracle`) does not find two statements ({len(miss_o)} of {sum(1 for c in cases if c.startswith('V'))}): " + (", ".join(c for c in miss_o[:30]) if miss_o else "none") + ".\n")

md.append("**Counterexamples: any find is false.** Built: a chromatic scale three times; a chromatic scale up and down over two octaves; the circle of fifths twice; the two whole-tone scales one after the other, twice. Real: Schoenberg, Op. 19 Nos. 2 and 6 (free atonal piano pieces before the twelve-tone method, music21 corpus; no row).\n")
md.append("| case | cur: statements / present / sent to agent | music21 self | music21 first12 | music21 hist |")
md.append("| --- | --- | --- | --- | --- |")
for c in cases:
    if not c.startswith("N"):
        continue
    r = res(c)
    cu = r.get("current", {})
    ch = r.get("choices", {})
    sc = ch.get("self", {})
    fc = ch.get("first12", {})
    hc = ch.get("hist", {})
    md.append(f"| {c} | {cu.get('n_statements')} / {'yes' if cu.get('present') else 'no'} / {'yes' if cu.get('to_agent') else 'no'} | "
              f"{'no run' if sc.get('row') is None else str(sc.get('n_statements')) + ' stmts' + (' FOUND' if sc.get('found') else '')} | "
              f"{'no row' if fc.get('row') is None else str(fc.get('n_statements')) + ' stmts' + (' FOUND' if fc.get('found') else '')} | "
              f"{('timeout' if 'timeout' in r else 'none' if not hc.get('found') else 'FOUND ' + ','.join(hc.get('found_rows_ge2', [])))} |")
md.append("")

# ---------------------------------------------------------------- runtime
cur_s = [r["cur"]["sec"] for r in ok]
parse_s = [v["sec_parse"] for k, v in M.items() if "sec_parse" in v]
def secs(ch, kinds=None):
    out = []
    for k, v in M.items():
        c = v.get("choices", {}).get(ch)
        if c and "sec" in c and (ch != "self" or c.get("row") is not None) and (ch != "first12" or c.get("row") is not None) and (ch != "oracle" or c.get("row") is not None):
            if kinds is None or k.startswith(kinds):
                out.append(c["sec"])
    return out
md.append("**Runtime (milliseconds: mean / median / max). Measured on this machine, 12 task processes at once; the music21 times include only the search call, parse is separate.**\n")
md.append("| step | scores | ms |")
md.append("| --- | --- | --- |")
md.append(f"| current detector (`rows` + `windows` after the score is read) | {len(cur_s)} catalogue items | {ms(cur_s)} |")
md.append(f"| music21 `converter.parse` | {len(parse_s)} | {ms(parse_s)} |")
for ch, lbl in (("self", "music21 search, row = `self`"), ("first12", "music21 search, row = `first12`"), ("oracle", "music21 search, row = true row")):
    for kinds, kl in (("cat", "flagged catalogue items"), ("built", "built and real cases")):
        s_ = secs(ch, kinds)
        if s_:
            md.append(f"| {lbl} | {len(s_)} {kl} | {ms(s_)} |")
for kinds, kl in (("cat", "flagged catalogue items"), ("built", "built and real cases")):
    s_ = [v["choices"]["hist"]["sec"] for k, v in M.items() if k.startswith(kinds) and v.get("choices", {}).get("hist")]
    if s_:
        md.append(f"| music21 search, 71 table rows | {len(s_)} {kl} (finished) | {ms(s_)} |")
md.append(f"| tasks that hit the time limit | {sum(1 for v in M.values() if 'timeout' in v)} | limit {max([v['timeout'] for v in M.values() if 'timeout' in v] or [0])} s |")
(HERE / "frag_row.md").write_text("\n".join(md), encoding="utf-8")
json.dump({"built": bj, "n_flagged": len(flagged), "catalogue_false": {"self": n_self_found, "first12": n_first12_found, "hist": n_hist_found, "hist_finished": n_hist_ok, "hist_timeout": n_hist_timeout}}, open(HERE / "row_metrics.json", "w"), indent=1)
print("\n".join(md))
