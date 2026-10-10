"""8notes.com piano pieces at the Beginner and Easy levels, with what each score page says about the piece: the
year composed, the "Info" paragraph, the level, style and tags (key, time signature). For song candidates and
placement only; no score files are taken (the owner, 2026-10-10). robots.txt allows these pages; one request a second.

8notes levels are its own (Beginner, Easy, Intermediate, Advanced) and describe 8notes' arrangement, not the piece.

Output: docs/sources/lists/8notes-piano.csv (Beginner and Easy) or 8notes-piano-<levels>.csv. Usage: python tools/pieces/eightnotes.py [levels, default 1 2]
"""
import csv, html, os, re, subprocess, sys, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE = "https://www.8notes.com"
LEVELS = {"1": "Beginner", "2": "Easy", "3": "Intermediate", "4": "Advanced"}


def get(url):
    time.sleep(1)
    r = subprocess.run(["curl", "-sL", "-A", "Mozilla/5.0", url], capture_output=True)
    return r.stdout.decode("utf-8", "replace")


def text(h):
    h = re.sub(r"<script.*?</script>|<style.*?</style>", " ", h, flags=re.S)
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h))).strip()


def listing(d):
    rows, page, last = [], 1, 1
    while page <= last:
        h = get(f"{BASE}/piano/sheet_music/?difficulty={d}&page={page}")
        last = max([last] + [int(x) for x in re.findall(r"page=(\d+)", h)])
        for art, sid, title in re.findall(r'class="artname">(.*?)</td>\s*<td class="fsmtitle"><a href=/scores/(\d+)\.asp>(.*?)</a>', h, re.S):
            rows.append({"id": sid, "artist": text(art), "title": text(title), "list_level": LEVELS[d]})
        page += 1
    return rows


def details(sid):
    s = text(get(f"{BASE}/scores/{sid}.asp"))
    def between(a, b):
        m = re.search(re.escape(a) + r"\s*(.*?)\s*(?:" + b + ")", s)
        return m.group(1).strip() if m else ""
    return {"composed": between("Composed:", r"Info:|Level:"),
            "info": between("Info:", r"Level:")[:1500],
            "level": between("Level:", r"Instrument:"),
            "style": between("Style:", r"\(|Tags:"),
            "tags": between("Tags:", r"Copyright:")}


def main():
    levels = sys.argv[1:] or ["1", "2"]
    rows, seen = [], set()
    for d in levels:
        for r in listing(d):
            if r["id"] not in seen:
                seen.add(r["id"])
                rows.append(r)
        print(LEVELS[d], "listed;", len(rows), "so far", flush=True)
    for i, r in enumerate(rows):
        r.update(details(r["id"]))
        r["url"] = f"{BASE}/scores/{r['id']}.asp"
        if i % 50 == 0:
            print(i, "pages read", flush=True)
    name = "8notes-piano.csv" if levels == ["1", "2"] else "8notes-piano-" + "-".join(LEVELS[d].lower() for d in levels) + ".csv"
    p = os.path.join(ROOT, "docs", "sources", "lists", name)
    with open(p, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["id", "artist", "title", "list_level", "level", "style", "tags", "composed", "info", "url"])
        w.writeheader()
        w.writerows(rows)
    print(len(rows), "pieces ->", p)


if __name__ == "__main__":
    main()
