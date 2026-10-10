"""Download the piano MusicXML files from the AICoevolution public shelf (https://www.aicoevolution.com/shelf), on the
owner's go (2026-10-10). The shelf page's own "Download the MusicXML — free" button calls the site's backend with the
public client key written into the site's script; this does the same request, one file a second. The shelf's
human-verification stamps are recorded beside each file; they are the shelf's claims, not checks we ran.

Output: build/pieces/shelf/<slug>.musicxml and build/pieces/shelf/shelf.csv. Usage: python tools/pieces/shelf_fetch.py
"""
import csv, json, os, re, subprocess, time, urllib.parse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "build", "pieces", "shelf")
SITE = "https://www.aicoevolution.com"


def curl(url, headers=(), out=None):
    cmd = ["curl", "-sL", "-A", "Mozilla/5.0"] + [x for h in headers for x in ("-H", h)] + (["-o", out] if out else []) + [url]
    return subprocess.run(cmd, capture_output=True).stdout.decode("utf-8", "replace")


def main():
    os.makedirs(OUT, exist_ok=True)
    page = curl(SITE + "/shelf")
    js = curl(SITE + re.search(r'src="(/assets/index-[^"]+\.js)"', page).group(1))
    api = re.search(r'h4="(https://[^"]+)"', js).group(1)
    key = re.search(r'f4="([^"]+)"', js).group(1)
    pieces = json.loads(curl(api + "/music/api/shelf-pages"))["pieces"]
    rows = []
    for x in pieces:
        if "Piano" not in (x.get("piece_type") or ""):
            continue
        path = os.path.join(OUT, x["slug"] + ".musicxml")
        curl(api + "/music/api/assistant/chorales/" + urllib.parse.quote(x["file"], safe=""),
             headers=("X-API-Key: " + key, "Origin: " + SITE), out=path)
        raw = open(path, encoding="utf-8").read() if os.path.exists(path) else ""
        if raw.lstrip().startswith("{"):  # the backend wraps the MusicXML in JSON with the shelf's metadata
            open(path[:-9] + ".json", "w", encoding="utf-8").write(raw)
            open(path, "w", encoding="utf-8", newline="").write(json.loads(raw)["musicxml"])
        ok = os.path.exists(path) and b"score-partwise" in open(path, "rb").read(4000)
        rows.append({k: x.get(k) for k in ("slug", "composer", "title", "collection", "era", "source", "source_pdf_url", "published_at")}
                    | {"verified_layers": " ".join(sorted((x.get("stamps") or {}).keys())), "file": os.path.relpath(path, ROOT), "ok": ok})
        time.sleep(1)
    with open(os.path.join(OUT, "shelf.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(len(rows), "piano pieces;", sum(r["ok"] for r in rows), "are MusicXML")


if __name__ == "__main__":
    main()
