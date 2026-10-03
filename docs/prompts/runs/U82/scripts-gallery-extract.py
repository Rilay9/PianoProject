"""U82: the state gallery's sideways cells, reduced to what the window rule decides, and compared.

`extract <states.json> <out.json>` keeps, per cell drawn as one system (`arrangement` `single`:
the sliding Window layout and Scroll) and per rotation cell, the renderer's priced window (count shown, scale, room, five-line staff),
the engraving zoom, the cursor sheet's CSS scale and bars engraved, the music's share of the stage
and whether the cell broke a check. `compare <a.json> <b.json>` prints one line per cell in either,
with each field that differs. Run from the repository root.
"""

import json
import sys


def reduce(cell: dict) -> dict:
    state = cell.get("state") or {}
    fit = state.get("fit") or {}
    priced = fit.get("priced") or {}
    cursor = next((s for s in state.get("slots") or [] if s.get("cursor")), {})
    return {
        "viewport": state.get("viewport"),
        "stage": state.get("stage"),
        "layout": state.get("layout"),
        "shown": priced.get("shown"),
        "staffPx": priced.get("staffPx"),
        "pricedScale": round(priced["scale"], 4) if isinstance(priced.get("scale"), (int, float)) else None,
        "room": priced.get("room"),
        "zoom": fit.get("zoom"),
        "sheetScale": cursor.get("scale"),
        "measures": cursor.get("measures"),
        "musicShare": state.get("musicShare"),
        "where": state.get("where"),
        "broke": cell.get("broke") or [],
    }


def main() -> int:
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action == "extract":
        cells = json.load(open(sys.argv[2], encoding="utf-8"))
        out = {
            c["cell"]: reduce(c)
            for c in cells
            if (c.get("state") or {}).get("arrangement") == "single" or "rotation" in c["cell"]
        }
        with open(sys.argv[3], "w", encoding="utf-8") as f:
            json.dump(out, f, indent=2, ensure_ascii=False)
        print(f"{len(out)} sideways cell(s) of {len(cells)} written to {sys.argv[3]}")
        return 0
    if action == "compare":
        a = json.load(open(sys.argv[2], encoding="utf-8"))
        b = json.load(open(sys.argv[3], encoding="utf-8"))
        same = 0
        for name in sorted(set(a) | set(b)):
            x, y = a.get(name), b.get(name)
            if x is None or y is None:
                print(f"{name}: only in {'the second' if x is None else 'the first'}")
                continue
            diff = [k for k in x if k != "broke" and x[k] != y.get(k)]
            if x["broke"] != y["broke"]:
                diff.append("broke")
            if not diff:
                same += 1
                print(
                    f"{name}: same — {x['shown']} shown, staff {x['staffPx']} px, scale {x['sheetScale']}, "
                    f"zoom {x['zoom']}, share {x['musicShare']}, {x['layout']}"
                )
            else:
                parts = ", ".join(f"{k} {x.get(k)!r} -> {y.get(k)!r}" for k in diff)
                print(f"{name}: DIFFERS — {parts}")
        print(f"{same} of {len(set(a) | set(b))} cell(s) the same")
        return 0
    print("usage: scripts-gallery-extract.py extract <states.json> <out.json> | compare <a.json> <b.json>")
    return 2


if __name__ == "__main__":
    sys.exit(main())
