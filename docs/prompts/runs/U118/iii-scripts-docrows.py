"""U118: the doc rows (08 §4.1 SLOTS, beside CHUNK's T38 bullet) and the test-map rows. Idempotent by marker;
keeps each file's own line endings."""
from pathlib import Path


def edit(path: str, marker: str, old: str, new: str) -> None:
    p = Path(path)
    raw = p.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    if marker in text:
        print(f"{path}: already has {marker!r}")
        return
    assert text.count(old) == 1, f"{path}: anchor found {text.count(old)} times"
    text = text.replace(old, new)
    if crlf:
        text = text.replace("\n", "\r\n")
    p.write_bytes(text.encode("utf-8"))
    print(f"{path}: edited")


SLOTS_ANCHOR = """- **The slots pack from the top** when the fit leaves room, with 24 px between them, like a
  page; the spare space is at the bottom. When the music fills its share, the shares stand.
"""
SLOTS_ROW = SLOTS_ANCHOR + """- **Below the folded chip (U118).** On a phone, while the folded chrome draws the `bar n / m`
  chip at the stage's top, the stacked slots start below the band the chip owns, never inside
  it, and stack within what is left of the stage. The band is the chip's tallest legitimate
  state at this geometry: `bar n / m` joined to every line the run can write while folded, each
  at its longest for the piece, laid out under the chip's own rule (its `top`, padding, type and
  line height, at the width the stage leaves it) — one line where every sentence fits one, more
  where any needs more. It is held for the stage's width and the chip's type, so a change of
  what the chip says never moves the slots or re-prices a run (`ScoreScreen` `cornerTexts` and
  `foldedCornerReserve`, handed to the renderer as `foldedReserve`). **A run that starts
  unfolded is not priced for the band**, unlike CHUNK's room below: upright the fold also takes
  the header away, which gives the stage more height than the band takes, so the fold places
  the slots (`placeSlots`) and leaves the shape, the engraving and the size the run froze.
  Priced from the run's start, the band changed six of 112 measured shapes and the drawn size
  of 28, 27 of them smaller, for room the fold gives back (`runs/U118`; the reviewer's ruling,
  `responses/questions-e9aa51ae.md`).
  **A size taken while the chip is already drawn** — a turn while folded — is priced and fitted
  below the band (`priceWindowShape`, `sheetShift`), so the bottom system stays on the stage.
  Not on a tablet, where the chip is not drawn.
"""

WR_ANCHOR = """  bounded, for `data-settled` before the stability poll (Q30's part for this file; Q30 stays
  open), because the shape holds still while a long piece's later sheets load.
"""
WR_ROW = WR_ANCHOR + """  U118 adds the stacked slots under the folded chip, beside CHUNK's folded case (the response's
  five checks, `responses/questions-e9aa51ae.md`): upright at 342 x 740 on Hot Cross Buns (U105c's
  layout) and on the five-finger exercise at four bars (sized by the height), a Wait run frozen,
  paused and left to fold — no chip and the first slot at the top unfolded, then the first slot
  below the band, the first system's ink below the chip, no mark of the score under it, the
  slots in first-bar order with the greyed row below, every mark on the stage, and the shape,
  engraving zoom, held size and scale unchanged through the fold; after a crossing into the
  third bar (checks 1, 2 and 4; the held size gives way across at the first fit after that
  crossing, T38, which there is the fold's); a size taken while folded (turned and turned back)
  keeps the bottom system on the stage; what the chip says (waiting for the first note, nothing,
  paused) moves neither the band, the slots nor the size; at 1024 x 768, where every sentence
  fits one line, the band is one line; a tablet folds with no chip and no band.
"""

STAGE_ANCHOR = """checked both ways round and against the chooser's own reservation when that count is asked on its own at 100 % (U113)."""
STAGE_ROW = STAGE_ANCHOR + """ The stacked slots and the folded chip's band (U118), with the band set by the test where the Score screen would answer it: placed below the band and back at the top with nothing fitted or engraved, a fractional band starting the first slot on the pixel below it, an ordinary fold during a frozen run holding the shape, the held scale and the engraving while the stage gains the header's row, a size taken while the band is drawn (turned back while folded) drawing what a stage short by the band draws, placed under it, and the sliding sheet sideways left to the stylesheet."""

GALLERY_ANCHOR = """- `gallery.ts` — shooting a cell, checking it against the record, building the sheet."""
GALLERY_ROW = """- `gallery.ts` — shooting a cell, checking it against the record, building the sheet. Since U118 the folded corner chip is judged, not left out of the sweep: on every cell where it is drawn (a folded phone; never unfolded or on a tablet) `chipOverInk` reports any mark of the front sheets its box meets — clef, stave, notes, fingerings — as `§4.1 the folded chip over the score's ink`, and the chip's own box inside the stage is not judged (`responses/questions-e9aa51ae.md`)."""

edit("docs/08-score-render-states.md", "**Below the folded chip (U118).**", SLOTS_ANCHOR, SLOTS_ROW)
edit("docs/08-test-map.md", "U118 adds the stacked slots under the folded chip", WR_ANCHOR, WR_ROW)
edit("docs/08-test-map.md", "The stacked slots and the folded chip's band (U118)", STAGE_ANCHOR, STAGE_ROW)
edit("docs/08-test-map.md", "Since U118 the folded corner chip is judged", GALLERY_ANCHOR, GALLERY_ROW)
