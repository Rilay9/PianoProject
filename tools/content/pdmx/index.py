"""
The whole archive, browsable — every candidate, not just the quota's pick.

`select.py` answers "which three hundred should I review next". This answers a
different question: **what is in there at all, at my level, in the style I feel
like today**. It applies the same gates and then keeps *everything* that
passes — 37,499 rows — with a level on each one, and writes a static page that
searches and filters them.

No conversion, no browser, no music21. The level comes from a small model
fitted on the candidates the quarry has already levelled properly: given the
CSV's `n_notes`, `notes_per_bar`, `bars` and `complexity`, predict what
`difficulty.py` would say after conversion. Measured leave-one-out on the 368
quarried files: Spearman 0.93, median error 0.46 stages. That is good enough to
sort a shelf by difficulty and nowhere near good enough to put in the catalog —
so nothing here is a catalog level, and anything picked off this page goes
through `extract` → `quarry` → `review` like everything else.

    python3 tools/content/pdmx/index.py --fit     # refit the proxy from quarried.json
    python3 tools/content/pdmx/index.py           # write the index and the page
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import math
import sys
from collections import Counter
from pathlib import Path

# `tools/content` on the path, not this directory. A module called
# `select` sitting on `sys.path` shadows the standard library's — which
# broke the test suite the first time it ran under discovery, and on a
# platform where `subprocess` reaches for `selectors` it would break far
# more than that. Importing through the package name cannot collide.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pdmx.composers import ComposerTable  # noqa: E402
from difficulty import MAX_LEVEL, MIN_LEVEL, _solve, spearman  # noqa: E402
from pdmx.paths import BUILD_DIR, REPO_ROOT, ArchiveMissing, fail, find_archive  # noqa: E402
from pdmx.select import (  # noqa: E402
    GATES,
    band_for,
    bucket_for,
    cid_of,
    integer,
    load_verifications,
    load_wants,
    match_want,
    member_name,
    musescore_id,
    number,
    truthy,
)

MODEL_FILE = REPO_ROOT / "content" / "sources" / "pdmx-csv-level.json"

#: The CSV columns the proxy reads, log-scaled. Deliberately four: every one of
#: them is present on every row, and a fifth would buy less than it costs in
#: things that can be `NA`.
PROXY_FIELDS = ("notes", "notesPerBar", "bars", "complexity")

#: How many rows the page renders at once. The filter runs over all of them;
#: only the drawing is capped, because nobody reads past the first few hundred
#: and 37,499 table rows is a page that takes a second to scroll.
PAGE_LIMIT = 400


#: Above this share of Latin-1-supplement characters, a title is mojibake.
#:
#: Not a repair — the damage is in the CSV and it is lossy. "メリークリスマス"
#: is stored as `ãæåãããªã¼ããªã¹ãã¹`: each three-byte character has been
#: reduced to one mangled byte and the other two are gone. Nothing gets them
#: back. What *is* worth doing is saying so, because the reviewer needs to know
#: to click through to MuseScore for the real title rather than trusting this
#: one — and because a search for a Japanese or Cyrillic title will find
#: nothing here and that is not the search's fault.
GARBLED_SHARE = 0.25
GARBLED_MIN_LENGTH = 6


def looks_garbled(text: str) -> bool:
    """True when a title has been mangled on its way into the CSV."""
    if len(text) < GARBLED_MIN_LENGTH:
        return False
    suspicious = sum(1 for ch in text if 0x80 <= ord(ch) <= 0xFF)
    return suspicious / len(text) >= GARBLED_SHARE


def clean(value: str | None) -> str:
    """A CSV string, with the dataset's `NA` read as the absence it means."""
    text = (value or "").strip()
    return "" if text.upper() in {"", "NA", "N/A", "NONE"} else text


def proxy_features(row: dict) -> list[float]:
    return [math.log1p(max(0.0, float(row[f]))) for f in PROXY_FIELDS]


def fit_proxy(samples: list[tuple[dict, float]], ridge: float = 1.0) -> dict:
    """
    Least squares from CSV columns to the level `difficulty.py` computed.

    Fitted against the *model's* output, not against a person's judgement:
    what this has to do is agree with the real levelling, so that a shelf
    sorted by it is sorted the way the catalog would sort it.

    `bars` earns a small negative weight and that is not a mistake — at a fixed
    note count, more bars means fewer notes in each of them, which is an easier
    piece. The monotone argument in `difficulty.py` is about a feature on its
    own; this one is conditioned on `notes`, which is the strongest term here.
    """
    X = [proxy_features(row) for row, _ in samples]
    y = [level for _, level in samples]
    bias = sum(y) / len(y)
    means = [sum(r[i] for r in X) / len(X) for i in range(len(PROXY_FIELDS))]
    centred = [[r[i] - means[i] for i in range(len(PROXY_FIELDS))] for r in X]
    weights = _solve(centred, [t - bias for t in y], ridge)
    return {
        "fitted": True,
        "bias": bias,
        "fields": list(PROXY_FIELDS),
        "weights": dict(zip(PROXY_FIELDS, [round(w, 6) for w in weights])),
        "means": dict(zip(PROXY_FIELDS, [round(m, 6) for m in means])),
    }


def proxy_level(row: dict, model: dict) -> float:
    if not model.get("fitted"):
        # No fit yet: fall back to the band's midpoint so the page still sorts.
        return 4.5
    total = float(model["bias"])
    for field, value in zip(PROXY_FIELDS, proxy_features(row)):
        total += float(model["weights"][field]) * (value - float(model["means"][field]))
    return round(max(MIN_LEVEL, min(MAX_LEVEL, total)), 1)


def load_model(path: Path = MODEL_FILE) -> dict:
    if not path.is_file():
        return {"fitted": False}
    return json.loads(path.read_text(encoding="utf-8"))


# --- the fit ------------------------------------------------------------------


def fit_from_quarry(quarried: Path, candidates: Path) -> tuple[dict, str]:
    """Refits the proxy on every candidate the quarry has levelled properly."""
    rows = json.loads(quarried.read_text(encoding="utf-8"))["rows"]
    csv_rows = {
        c["cid"]: c
        for c in json.loads(candidates.read_text(encoding="utf-8"))["candidates"]
    }
    samples = [
        ({"notes": c["notes"], "notesPerBar": c["notes_per_bar"], "bars": c["bars"],
          "complexity": c["complexity"]}, float(r["level"]))
        for r in rows
        if r.get("ok") and (c := csv_rows.get(r["cid"]))
    ]
    if len(samples) < 40:
        raise SystemExit(
            f"only {len(samples)} quarried level(s) to fit against; run the quarry first"
        )

    model = fit_proxy(samples)
    # Leave one out, refitting each time: the error of a model on the points it
    # was fitted to says only that least squares works.
    predicted, errors = [], []
    for index in range(len(samples)):
        rest = [s for i, s in enumerate(samples) if i != index]
        guess = proxy_level(samples[index][0], fit_proxy(rest))
        predicted.append(guess)
        errors.append(abs(guess - samples[index][1]))
    errors.sort()
    report = (
        f"{len(samples)} sample(s): leave-one-out Spearman "
        f"{spearman(predicted, [s[1] for s in samples]):.3f}, "
        f"median |error| {errors[len(errors) // 2]:.3f}, "
        f"p90 {errors[int(len(errors) * 0.9)]:.3f} stages"
    )
    model["fittedOn"] = len(samples)
    model["report"] = report
    return model, report


# --- the index ----------------------------------------------------------------


def build_index(csv_path: Path, table: ComposerTable, model: dict, limit: int = 0) -> tuple[list[dict], dict]:
    """Every row that passes the gates, with what a person needs to choose."""
    csv.field_size_limit(min(sys.maxsize, 2**31 - 1))
    wants = load_wants()
    verifications = load_verifications()
    rows: list[dict] = []
    read = 0

    with csv_path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            read += 1
            if limit and read > limit:
                break
            if any(gate(row) for _, gate in GATES):
                continue

            title = clean(row.get("title")) or clean(row.get("song_name"))
            artist = clean(row.get("artist_name"))
            match = table.match(row.get("composer_name", ""))
            if not match.matched and artist:
                from_artist = table.match(artist)
                if from_artist.matched:
                    match = from_artist

            bars = integer(row.get("song_length.bars"))
            notes = integer(row.get("n_notes"))
            notes_per_bar = number(row.get("notes_per_bar"))
            complexity = number(row.get("complexity"))
            facts = {"notes": notes, "notesPerBar": notes_per_bar, "bars": bars,
                     "complexity": complexity}

            rows.append(
                {
                    "cid": cid_of(row["mxl"]),
                    "member": member_name(row["mxl"]),
                    "title": title,
                    "artist": artist,
                    "composer": match.canonical or clean(row.get("composer_name")),
                    "garbled": looks_garbled(title),
                    "status": match.status,
                    "traditional": match.traditional,
                    "bucket": bucket_for(row.get("genres", ""), match.canonical is not None,
                                         match.traditional),
                    "band": band_for(bars, notes_per_bar, complexity),
                    "level": proxy_level(facts, model),
                    "bars": bars,
                    "notes": notes,
                    "rating": round(number(row.get("rating")), 2),
                    "ratings": integer(row.get("n_ratings")),
                    "views": integer(row.get("n_views")),
                    "lyrics": truthy(row.get("has_lyrics")),
                    "tracks": integer(row.get("n_tracks")),
                    "museScore": musescore_id(row.get("metadata", "")),
                    "want": match_want(title, artist, wants),
                    "verifies": match_want(title, artist, verifications),
                }
            )

    summary = {
        "rowsRead": read,
        "indexed": len(rows),
        "byBand": dict(sorted(Counter(r["band"] for r in rows).items())),
        "byBucket": dict(Counter(r["bucket"] for r in rows).most_common()),
        "byStatus": dict(Counter(r["status"] for r in rows).most_common()),
        "byLevel": dict(sorted(Counter(int(r["level"]) for r in rows).items())),
        "garbledTitles": sum(1 for r in rows if r["garbled"]),
    }
    return rows, summary


# --- the page -----------------------------------------------------------------

PAGE_CSS = """
:root { color-scheme: light dark; font-family: system-ui, sans-serif; }
body { margin: 0; padding: 12px 16px 40px; }
h1 { font-size: 1.15rem; margin: 0 0 4px; }
p.lede { max-width: 70ch; opacity: .8; margin: 4px 0 12px; }
.controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
            position: sticky; top: 0; background: Canvas; padding: 8px 0; z-index: 2;
            border-bottom: 1px solid rgba(128,128,128,.3); }
input, select, button { font: inherit; padding: 4px 6px; }
input[type=search] { min-width: 22ch; }
table { border-collapse: collapse; width: 100%; font-size: .88rem; margin-top: 10px; }
th, td { border-bottom: 1px solid rgba(128,128,128,.28); padding: 4px 7px; text-align: left; }
th { cursor: pointer; user-select: none; white-space: nowrap; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
tr:hover { background: rgba(128,128,128,.12); }
.pd { color: #2e7d32; } .in-copyright { color: #c62828; } .unknown { opacity: .65; }
.tag { font-size: .78em; border: 1px solid rgba(128,128,128,.5); border-radius: 999px;
       padding: 0 6px; margin-left: 4px; }
#count { opacity: .75; }
#picked { font-variant-numeric: tabular-nums; }
""".strip()


def write_page(rows: list[dict], summary: dict, model: dict, out: Path) -> None:
    """
    One self-contained file. No server, no network, no build step.

    The rows are embedded as a compact array of arrays rather than objects:
    37,499 rows of `{"cid": …, "title": …}` is 12 MB of repeated key names, and
    this page is opened from a laptop's file system.
    """
    order = ["cid", "title", "artist", "composer", "status", "bucket", "band", "level",
             "bars", "notes", "rating", "ratings", "views", "lyrics", "tracks",
             "museScore", "want", "verifies", "garbled"]
    payload = {
        "fields": order,
        "rows": [[row[key] for key in order] for row in rows],
        "summary": summary,
        "model": {k: model.get(k) for k in ("report", "fittedOn", "fitted")},
    }
    bands = ", ".join(f"{band} → {count}" for band, count in summary["byBand"].items())
    script = pathlib_read(Path(__file__).with_name("index_page.js"))
    out.write_text(
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>PDMX index</title>"
        f"<style>{PAGE_CSS}</style></head><body>"
        "<h1>PDMX — everything that passes the gates</h1>"
        f"<p class='lede'>{summary['indexed']:,} of {summary['rowsRead']:,} rows. "
        f"Bands: {html.escape(bands)}. "
        "Levels are estimated from the CSV alone — good enough to sort a shelf, not good "
        "enough for the catalog. Anything you pick still goes through "
        "<code>extract</code> → <code>quarry</code> → <code>review</code>.<br>"
        f"<small>{html.escape(str(model.get('report') or 'level proxy not fitted'))}</small></p>"
        "<div class='controls'>"
        "<input type='search' id='q' placeholder='title, artist or composer'>"
        "<select id='band'><option value=''>any stage</option></select>"
        "<select id='bucket'><option value=''>any style</option></select>"
        "<select id='status'><option value=''>any status</option>"
        "<option value='pd'>public domain</option>"
        "<option value='unknown'>unknown</option>"
        "<option value='in-copyright'>in copyright</option></select>"
        "<label>level <input type='number' id='lo' min='1' max='9' step='.5' style='width:6ch'>"
        "–<input type='number' id='hi' min='1' max='9' step='.5' style='width:6ch'></label>"
        "<label><input type='checkbox' id='nolyrics'> no lyrics</label>"
        "<label><input type='checkbox' id='rated'> rated 4+</label>"
        "<button id='copy'>copy picked CIDs</button>"
        "<span id='picked'>0 picked</span>"
        "<span id='count'></span>"
        "</div>"
        "<table><thead><tr>"
        "<th></th><th data-k='1'>title</th><th data-k='3'>composer / artist</th>"
        "<th data-k='5'>style</th><th class='num' data-k='7'>level</th>"
        "<th class='num' data-k='8'>bars</th><th class='num' data-k='10'>rating</th>"
        "<th class='num' data-k='12'>views</th><th></th>"
        "</tr></thead><tbody id='rows'></tbody></table>"
        f"<script id='data' type='application/json'>{json.dumps(payload, ensure_ascii=False)}</script>"
        f"<script>{script}</script>"
        "</body></html>\n",
        encoding="utf-8",
    )


def pathlib_read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pdmx-dir", default=None)
    parser.add_argument("--out", type=Path, default=BUILD_DIR / "index")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--quarried", type=Path, default=BUILD_DIR / "quarried.json")
    parser.add_argument("--candidates", type=Path, default=BUILD_DIR / "candidates.json")
    parser.add_argument(
        "--fit",
        action="store_true",
        help="refit the CSV level proxy from the quarry's own levels and write it",
    )
    args = parser.parse_args(argv)

    if args.fit:
        if not args.quarried.is_file():
            fail(f"{args.quarried} does not exist; run the quarry first.")
            return 2
        model, report = fit_from_quarry(args.quarried, args.candidates)
        MODEL_FILE.write_text(json.dumps(model, indent=2) + "\n", encoding="utf-8")
        print(report)
        print("weights:", model["weights"])
        print(f"wrote {MODEL_FILE}")
        return 0

    try:
        archive = find_archive(args.pdmx_dir, require_scores=False)
    except ArchiveMissing as missing:
        fail(str(missing))
        return 2

    model = load_model()
    if not model.get("fitted"):
        print("note: the level proxy is not fitted; run --fit first", file=sys.stderr)
    rows, summary = build_index(archive.csv, ComposerTable.load(), model, args.limit)

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "index.json").write_text(
        json.dumps({"summary": summary, "rows": rows}, ensure_ascii=False), encoding="utf-8"
    )
    write_page(rows, summary, model, args.out / "index.html")

    print(f"{summary['indexed']} of {summary['rowsRead']} row(s) indexed")
    print(f"  by band   {summary['byBand']}")
    print(f"  by style  {summary['byBucket']}")
    print(f"  by status {summary['byStatus']}")
    print(f"  by level  {summary['byLevel']}")
    print(f"  {summary['garbledTitles']} title(s) are mojibake in the CSV itself and are flagged")
    print(f"wrote {args.out / 'index.html'}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
