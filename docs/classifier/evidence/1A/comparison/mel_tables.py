"""Markdown tables from mel_metrics.json -> frag_mel_*.md and frag_agree.md (assembled into melody.md by build_melody.py)."""
from mel_common import *

M = jload(HERE / "mel_metrics.json")
NAMES = {"const_R": "always the right hand (no look at the notes)", "current": "current detector (r_melody rules 1, 2, 3)", "skyline_plain": "skyline, plain (top note at each onset)",
         "skyline_repo": "skyline, MidiBERT repo (notes >= 60, 8th grid)", "midibert": "MidiBERT-Piano, class 1 = melody",
         "midibert_12": "MidiBERT-Piano, class 1 or 2 = melody or bridge"}


def f(x, d=1):
    return "-" if x is None else f"{100 * x:.{d}f}%"


def s(x):
    return "-" if x is None else f"{x:.2f}"


def table(ds, variant, subset):
    out = ["| method | pieces | bars with a melody | answered (coverage) | correct / bars (UNKNOWN wrong) | correct / answered | left-hand bars found / present | right-hand bars named left | note P | note R | note F1 | note accuracy | F1 inside bars it answered | seconds per piece mean / median / max | s per 1000 notes |",
           "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
    for m in NAMES:
        k = f"{variant}|{m}|{subset}"
        v = M[ds].get(k)
        if not v or not v["pieces"]:
            out.append(f"| {NAMES[m]} | 0 | - | did not run on this set | | | | | | | | | | | |")
            continue
        note = m != "const_R"
        out.append(f"| {NAMES[m]} | {v['pieces']} | {v['truth_bars']} | {v['answered']} ({f(v['coverage'])}) | {v['correct']} ({f(v['agreement'])}) | {f(v['acc_answered'])} | {v['L_found']} / {v['L_truth_bars']} | {v['R_bars_named_L']} | "
                   + (f"{f(v['P'])} | {f(v['R'])} | {f(v['F1'])} | {f(v['acc'])} | {f(v['settled_F1'])} | " if note else "n/a | n/a | n/a | n/a | n/a | ")
                   + (f"{s(v['sec_mean'])} / {s(v['sec_median'])} / {s(v['sec_max'])} | {s(v['sec_per_1000_notes'])} |" if v["sec_mean"] is not None and m != "const_R" else "- | - |"))
    return "\n".join(out)


def w(name, text):
    (HERE / f"frag_mel_{name}.md").write_text(text, encoding="utf-8")


w("pop_M", table("pop", "M", "all"))
w("pop_MB", table("pop", "M+B", "all"))
w("moz", table("moz", "melody", "all"))
w("moz_duple", table("moz", "melody", "dupletime"))
rows = ["| set | bars with a melody | the rule | accepted (hand named by all) | accepted and right | accepted and wrong | sent to the agent | left-hand bars | accepted as left / of those right |", "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"]
for k, v in M["agree"].items():
    ds, combo, sub = k.split("|")
    if sub != "all":
        continue
    rows.append(f"| {'POP909 (M)' if ds == 'pop' else 'Mozart'} | {v['truth_bars']} | {' = '.join(combo.split('+'))} | {v['accepted']} | {v['accepted_right']} | {v['accepted_wrong']} | {v['sent_to_agent']} | {v['left_truth_bars']} | {v['accepted_as_left']} / {v['accepted_as_left_right']} |")
(HERE / "frag_agree.md").write_text("\n".join(rows), encoding="utf-8")
print("ok")
