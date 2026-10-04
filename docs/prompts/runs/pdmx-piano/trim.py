"""Trim PDMX.csv to licence-safe, valid, deduplicated (best unique arrangement), piano-only rows, for the reviewer to browse.
Piano-only: every track's General MIDI program is 0-7 (the piano family). Metadata nominates; it never approves."""
import csv, re, pathlib
SRC = pathlib.Path(r"C:\Users\yalir\repos\Piano Stuff\PDMX.csv")
OUT = pathlib.Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject\build\pdmx-piano")
T = lambda v: str(v).strip().lower() in ("true", "1")
KEEP = ["cid", "title", "subtitle", "song_name", "artist_name", "composer_name", "genres", "tags", "license", "rating", "n_ratings",
        "n_favorites", "n_views", "complexity", "n_tracks", "tracks", "song_length.bars", "n_notes", "notes_per_bar", "has_lyrics",
        "pitch_class_entropy", "scale_consistency", "groove_consistency"]
rows = []
with open(SRC, encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        if not (T(r["subset:no_license_conflict"]) and T(r["subset:valid_mxl_pdf"]) and T(r["is_best_unique_arrangement"])):
            continue
        progs = [p for p in r["tracks"].split("-") if p.strip() != ""]
        if not progs or not all(p.strip().isdigit() and 0 <= int(p) <= 7 for p in progs):
            continue
        m = re.search(r"(Qm[1-9A-HJ-NP-Za-km-z]{44})", r["path"] + " " + r["mxl"])
        r["cid"] = m.group(1) if m else r["path"]
        rows.append({k: r.get(k, "") for k in KEEP})
rows.sort(key=lambda r: ((r["title"] or r["song_name"]).strip().lower(), r["artist_name"].lower()))
def write(name, rs):
    with open(OUT / name, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=KEEP); w.writeheader(); w.writerows(rs)
CH = 2500
for i in range(0, len(rows), CH):
    first = (rows[i]["title"] or "?")[:1].upper(); last = (rows[min(i+CH, len(rows))-1]["title"] or "?")[:1].upper()
    write(f"piano-{i//CH+1:02d}.csv", rows[i:i+CH])
rated = [r for r in rows if r["n_ratings"] not in ("", "0", "0.0")]
write("piano-rated.csv", rated)
(OUT / "README.md").write_text(
    f"# PDMX, piano only, licence-safe, deduplicated\n\nFrom `PDMX.csv` (254,077 rows): kept rows with `subset:no_license_conflict`, `subset:valid_mxl_pdf` and `is_best_unique_arrangement` all true, "
    f"and every track a General MIDI piano program (0 to 7). **{len(rows)} rows**, sorted by title, split into `piano-NN.csv` files of {CH} rows; "
    f"`piano-rated.csv` holds the {len(rated)} rows with at least one rating.\n\n`cid` fetches the score (the orchestrator extracts the MusicXML on request). "
    "Columns are uploader metadata plus PDMX's three computed features: they nominate candidates and never establish what the music contains.\n", encoding="utf-8")
print("rows", len(rows), "rated", len(rated), "files", len(range(0, len(rows), CH)) + 1)
