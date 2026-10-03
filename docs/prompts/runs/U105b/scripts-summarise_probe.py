"""U105b's probe summariser, not for app/: one line per probe JSON of the given label.
Run from the worktree root: python build/u105b/summarise_probe.py before|after"""
import json
import pathlib
import sys

label = sys.argv[1]
here = pathlib.Path(__file__).parent
for path in sorted(here.glob(f"probe-*-{label}.json")):
    d = json.loads(path.read_text(encoding="utf-8"))
    face = "wider" if "Verdana" in d["fontFamily"] else "stack"
    print(
        f"{path.stem}: running={d['running']} marked={d['marked']} face={face} root={d['rootFontSize']} "
        f"white-space={d['whiteSpace']} text-overflow={d['textOverflow']} "
        f"scrollWidth={d['scrollWidth']} clientWidth={d['clientWidth']} cut={d['cut']} textInside={d['textInside']} "
        f"textRuns={d['textRuns']} lineHeight={round(d['lineBox']['height'], 2)} "
        f"head {d['headBefore']:.2f}->{d['headHeight']:.2f} "
        f"stageTop {d['stageBefore']['top']:.2f}->{d['stage']['top']:.2f} stageHeight {d['stageBefore']['height']:.2f}->{d['stage']['height']:.2f} "
        f"lineAboveSheet={d['lineAboveSheet']}"
    )
