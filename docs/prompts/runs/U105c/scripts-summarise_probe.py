"""U105c's probe summary, not for app/: one block per probe JSON (label given as the first argument):
the header's line before/during the refusal, the header's height, the frozen fit, overlaps, and the
corner chip once folded, with no refusal and with one. Run from the worktree root:
PYTHONIOENCODING=utf-8 python build/u105c/summarise_probe.py before|after."""
import json
import pathlib
import sys

label = sys.argv[1]
root = pathlib.Path("build/u105c")


def chip(m):
    if m is None:
        return "n/a"
    k = m["corner"]
    top = k["box"]["top"] if k["box"] else None
    bottom = k["box"]["bottom"] if k["box"] else None
    return (
        f"chrome={m['chrome']} corner '{k['text']}' lines {k['lines']} box {top}-{bottom} "
        f"reserveBottom {k.get('reserveBottom')} overReserve={k['overReserve']} "
        f"inkUnder {k.get('underCount')} {k.get('under')} zoom {m['fit']['zoom']} scale {m['scale']}"
    )


out = []
for path in sorted(root.glob(f"probe-*-{label}.json")):
    data = json.loads(path.read_text(encoding="utf-8"))
    if "during" not in data:
        out.append(f"{path.name}: {json.dumps(data['after'], ensure_ascii=False)}")
        continue
    b, d, f = data["before"], data["during"], data["folded"]
    out.append(
        f"{data['path']:<15} {data['condition']:<10} onBar={data.get('onBar')} "
        f"| before: '{b['text']}' head {b['head']['height']:.2f} lines {b['lines']} "
        f"| during: running={d['running']} hearing={d['hearing']} play={d['play']} refused={d['refused']} "
        f"ws={d['whiteSpace']} scroll {d['scrollWidth']} / client {d['clientWidth']} textInside={d['textInside']} "
        f"ellipsis={d['ellipsis']} lines {d['lines']} clear={d['clear']} inWindow={d['inWindow']} "
        f"head {d['head']['height']:.2f} (+{d['head']['height'] - b['head']['height']:.2f}) "
        f"stageTop {b['stage']['top']:.2f}->{d['stage']['top']:.2f} "
        f"zoom {b['fit']['zoom']}->{d['fit']['zoom']} scale {b['scale']}->{d['scale']} frozen {d['fit']['frozen']} "
        f"overStage={d['lineOverStage']} overBar={d['lineOverBar']} overInk={d['lineOverInk']}"
        f"\n    folded, no refusal: {chip(data.get('foldedBefore'))}"
        f"\n    folded, refused:    {chip(f)}"
    )
text = "\n".join(out) + "\n"
(root / f"probe-{label}-summary.txt").write_text(text, encoding="utf-8")
print(text)
