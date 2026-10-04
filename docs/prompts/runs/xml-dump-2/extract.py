"""Extract each requested PDMX content id's MusicXML byte-for-byte (decoded UTF-8), with a manifest from PDMX.csv."""
import csv, io, re, tarfile, zipfile, pathlib
REPO = pathlib.Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject"); OUT = REPO / "build/xml-dump-2"
LIB = REPO / "build/pdmx/library"; TAR = pathlib.Path(r"C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz")
CSV = pathlib.Path(r"C:\Users\yalir\repos\Piano Stuff\PDMX.csv")
ids = list(dict.fromkeys(l.strip() for l in (OUT / "ids.txt").read_text().splitlines() if l.strip()))
meta = {}
with open(CSV, encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        m = re.search(r"(Qm[1-9A-HJ-NP-Za-km-z]{44})", r["path"] + " " + r["mxl"])
        if m and m.group(1) in ids: meta[m.group(1)] = r
data = {}
for c in ids:
    p = LIB / c[2:4].lower() / f"{c}.mxl"
    if p.exists(): data[c] = p.read_bytes()
need = set(ids) - set(data)
if need:
    with tarfile.open(TAR, "r:gz") as t:
        for m in t:
            b = m.name.rsplit("/", 1)[-1]
            c = b[:-4] if b.endswith(".mxl") else None
            if c in need:
                data[c] = t.extractfile(m).read(); need.discard(c)
                if not need: break
def root_xml(b):
    with zipfile.ZipFile(io.BytesIO(b)) as z:
        n = z.namelist(); cont = z.read("META-INF/container.xml").decode("utf-8", "replace") if "META-INF/container.xml" in n else ""
        m = re.search(r'full-path="([^"]+)"', cont)
        name = m.group(1) if m else [x for x in n if not x.startswith("META-INF") and x.lower().endswith((".xml", ".musicxml"))][0]
        return z.read(name).decode("utf-8", "replace")
rows = ["| # | cid | title | artist | composer | license | rating | file | parts/staves | bars |", "|---|---|---|---|---|---|---|---|---|---|"]
for i, c in enumerate(ids, 1):
    r = meta.get(c, {}); title = (r.get("title") or r.get("song_name") or "").replace("|", "/")
    if c not in data:
        rows.append(f"| {i} | {c} | {title} | {r.get('artist_name','')} | {r.get('composer_name','')} | | | NOT FOUND | | |"); continue
    xml = root_xml(data[c]); slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40] or "score"
    fn = f"{i:03d}-{slug}-{c}.musicxml"; (OUT / fn).write_text(xml, encoding="utf-8")
    parts = len(re.findall(r"<score-part\b", xml)); staves = max([int(x) for x in re.findall(r"<staves>(\d+)</staves>", xml)] or [1])
    fp = re.split(r"<part\b", xml, maxsplit=2); bars = len(re.findall(r"<measure\b", fp[1])) if len(fp) > 1 else 0
    rows.append(f"| {i} | {c} | {title} | {r.get('artist_name','')} | {r.get('composer_name','')} | {r.get('license','')} | {r.get('rating','')} | {fn} | {parts} / {staves} | {bars} |")
(OUT / "MANIFEST.md").write_text("# XML dump 2: the requested PDMX content ids\n\nEach file is the XML inside the archive's `.mxl`, unchanged. Metadata from `PDMX.csv` (uploader-recorded; it nominates, never establishes).\n\n" + "\n".join(rows) + "\n", encoding="utf-8")
print("requested", len(ids), "extracted", len(data), "not found", len(ids) - len(data))
