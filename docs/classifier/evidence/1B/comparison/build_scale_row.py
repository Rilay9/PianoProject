"""Assembles scale-row.md from scale_row_template.md, frag_scale.md, frag_scale_timing.md, frag_row.md and narrative.md.
Usage: python -X utf8 build_scale_row.py"""
from pathlib import Path
HERE = Path(__file__).resolve().parent
t = (HERE / "scale_row_template.md").read_text(encoding="utf-8")
def frag(name):
    return (HERE / name).read_text(encoding="utf-8").strip()
sc = frag("frag_scale.md")
# the scale fragment holds sections in order: generated, real, modal, passage, runtime; add headings
t = t.replace("@@FRAG_SCALE@@", "## 3. scale.collection results\n\nThe tables below are written by `scale_metrics.py` (per-item data in `scale_results.json`, `scale_tonal_out.json`). Method names: *tonic: detected key* = the tonic the project's key detector found; *tonic: reference* = the recipe's or the title's tonic; *as returned* = every full match `deriveRanked` gave; *+ equality check* = only the matches whose scale has exactly the item's pitch classes (the project's rule, which music21 does not apply); *names of 8 to 11 pitch classes dropped* = Tonal's exact matches with the project's size rule applied.\n\n" + sc)
t = t.replace("@@FRAG_SCALE_TIMING@@", frag("frag_scale_timing.md"))
t = t.replace("@@FRAG_ROW@@", "## 4. pitch.tone-row results\n\nThe tables below are written by `row_metrics.py` (per-item data in `row_scan.json`, `row_music21_results.json`, `row_cases.json`). Found = two or more statements (P, I, R or RI forms) of one row, the page's rule 3.\n\n" + frag("frag_row.md") + "\n\n" + frag("frag_row_diag.md") + "\n\n" + frag("frag_row_fix.md"))
t = t.replace("@@NARRATIVE@@", frag("narrative.md"))
t = t.rstrip() + "\n\n" + frag("narrative_rec.md") + "\n"
(HERE / "scale-row.md").write_text(t, encoding="utf-8")
print(len(t), "characters written to scale-row.md")
