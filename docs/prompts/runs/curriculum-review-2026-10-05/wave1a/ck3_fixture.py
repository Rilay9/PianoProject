"""CK-3's oracle (wave 1(a) seam 1a.8): the pitch-class sets of the modulation row, from music21.

usage: python docs/prompts/runs/curriculum-review-2026-10-05/wave1a/ck3_fixture.py

Writes `ck3-fixture.json` beside this script. Each progression is a list of `"key:numeral"` tokens,
read the way `fromCatalog.ts` `dictationChords` reads them (a token's key is the letter before the
colon, upper case major and lower case minor; the numeral is music21's `RomanNumeral` in that key).
The app's own `anyRomanToChord` is never the witness: `app/tests/unit/modulationRow.test.ts` compares
what the drill builder sounds with these sets.

`before` is the row at a83a4167 (step 1: the run that confirms the present sound); `after` is the row
the seam writes (step 3).
"""
from __future__ import annotations

import json
from pathlib import Path

from music21 import roman

ROWS = {
    "before": ["C:I", "C:vi", "A:V7/V", "D:V", "D:I"],
    "after": ["C:I", "C:vi", "G:V7", "G:I"],
}


def pitch_classes(token: str) -> dict:
    key, numeral = token.split(":")
    rn = roman.RomanNumeral(numeral, key)
    return {
        "token": token,
        "root": rn.root().name,
        "pitches": [p.name for p in rn.pitches],
        "pitchClasses": sorted({p.pitchClass for p in rn.pitches}),
    }


def main() -> None:
    import music21

    out = {
        "_comment": "Written by ck3_fixture.py from music21.roman.RomanNumeral; never edited by hand.",
        "music21": music21.__version__,
        "rows": {name: [pitch_classes(t) for t in tokens] for name, tokens in ROWS.items()},
        "label": " – ".join(ROWS["after"]),
    }
    path = Path(__file__).with_name("ck3-fixture.json")
    path.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for name, rows in out["rows"].items():
        print(name, [(r["token"], r["pitches"], r["pitchClasses"]) for r in rows])


if __name__ == "__main__":
    main()
