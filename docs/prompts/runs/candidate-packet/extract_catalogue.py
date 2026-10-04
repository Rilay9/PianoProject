"""Add the catalogue items the brief names (by id, or by title marked "(catalogue)"), byte-for-byte from the built content."""
import json, re, zipfile, pathlib
REPO = pathlib.Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject")
OUT = REPO / "build/candidate-packet"; C = REPO / "app/public/content"
brief = (REPO / "build/candidate-packet-brief.md").read_text(encoding="utf-8")
cat = json.load(open(C / "catalog.json", encoding="utf-8")); items = cat["items"] if isinstance(cat, dict) else cat
byid = {i["id"]: i for i in items}
wanted = []  # (target, label, [ids])
target = "?"
for line in brief.splitlines():
    h = re.match(r"^([A-O])\. ", line)
    if h: target = h.group(1)
    if target == "?": continue  # the brief's preamble names example ids, not candidates
    for cid in re.findall(r"`((?:song|exercise)\.[^`]+)`", line):
        wanted.append((target, cid, [cid]))
    if "(catalogue)" in line:
        for name in re.findall(r"(?:^\s*\d+\.\s*|; )([^;,(]+?)\s*\(catalogue\)", line):
            n = name.strip().lower()
            hits = [i["id"] for i in items if i.get("type") == "song" and n in (i.get("title") or "").lower()][:3]
            wanted.append((target, name.strip() + " (catalogue)", hits))
rows = []
have = {p.name for p in OUT.glob("*.musicxml")}
for target, label, ids in wanted:
    if not ids:
        rows.append(f"| {target} | {label} | | | NOT FOUND | | | | named by the reviewer | no catalogue title match |"); continue
    for iid in ids:
        it = byid.get(iid); f = it.get("file") if it else None
        if not f or not (C / f).exists():
            rows.append(f"| {target} | {label} | | {iid} | NOT FOUND | | | | named by the reviewer | no shipped file |"); continue
        fn = f"{target}-{re.sub(r'[^a-z0-9]+','-',iid.lower()).strip('-')}.musicxml"
        if fn in have: continue
        src = C / f
        if src.suffix == ".mxl":
            with zipfile.ZipFile(src) as z:
                cont = z.read("META-INF/container.xml").decode("utf-8","replace") if "META-INF/container.xml" in z.namelist() else ""
                m = re.search(r'full-path="([^"]+)"', cont)
                name = m.group(1) if m else [n for n in z.namelist() if not n.startswith("META-INF") and n.lower().endswith((".xml",".musicxml"))][0]
                xml = z.read(name).decode("utf-8","replace")
        else:
            xml = src.read_text(encoding="utf-8", errors="replace")
        (OUT / fn).write_text(xml, encoding="utf-8"); have.add(fn)
        parts = len(re.findall(r"<score-part\b", xml)); staves = max([int(x) for x in re.findall(r"<staves>(\d+)</staves>", xml)] or [1])
        fp = re.split(r"<part\b", xml, maxsplit=2); bars = len(re.findall(r"<measure\b", fp[1])) if len(fp) > 1 else 0
        rows.append(f"| {target} | {label} | {it.get('composer','')} | {iid} | {fn} | the shipped catalogue copy ({f}) | {parts} parts / {staves} staves | {bars} | named by the reviewer | third pass, from the built catalogue |")
man = OUT / "MANIFEST.md"
man.write_text(man.read_text(encoding="utf-8") + "\n\n## Third pass: catalogue items the reviewer named\n\n| target | candidate | artist/composer | archive/catalog id | filename | arrangement/version | parts/staves | bars | why_candidate | notes |\n|---|---|---|---|---|---|---|---|---|---|\n" + "\n".join(rows) + "\n", encoding="utf-8")
print("catalogue rows:", len(rows), "not found:", sum("NOT FOUND" in r for r in rows))
