"""Extract every content id the brief names explicitly, byte-for-byte, and append them to MANIFEST.md.
The first retrieval pass misparsed "title, `cid`" lines and substituted title-search results; this pass fetches the named scores."""
import re, sys, tarfile, zipfile, io, pathlib
REPO = pathlib.Path(r"C:\Users\yalir\repos\Piano Stuff\PianoProject")
OUT = REPO / "build/candidate-packet"
LIB = REPO / "build/pdmx/library"
TAR = pathlib.Path(r"C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz")
brief = (REPO / "build/candidate-packet-brief.md").read_text(encoding="utf-8")

# map each cid to (target letter, title) from the line it appears on
named = {}
target = "?"
for line in brief.splitlines():
    h = re.match(r"^([A-O])\. ", line)
    if h:
        target = h.group(1)
    for cid in re.findall(r"`(Qm[1-9A-HJ-NP-Za-km-z]{44})`", line):
        title = re.sub(r"^\s*\d+\.\s*", "", line.split("`")[0]).strip(" ,:-")
        named.setdefault(cid, []).append((target, title))

have = {p.name for p in OUT.glob("*.musicxml")}
todo = {c: v for c, v in named.items() if not any(c in n for n in have)}

def root_xml(data: bytes) -> str:
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = z.namelist()
        cont = z.read("META-INF/container.xml").decode("utf-8", "replace") if "META-INF/container.xml" in names else ""
        m = re.search(r'full-path="([^"]+)"', cont)
        name = m.group(1) if m else [n for n in names if not n.startswith("META-INF") and n.lower().endswith((".xml", ".musicxml"))][0]
        return z.read(name).decode("utf-8", "replace")

found = {}
for cid in list(todo):
    p = LIB / cid[2:4].lower() / f"{cid}.mxl"
    if p.exists():
        found[cid] = p.read_bytes()
remaining = set(todo) - set(found)
if remaining and TAR.exists():
    with tarfile.open(TAR, "r:gz") as t:
        for m in t:
            base = m.name.rsplit("/", 1)[-1]
            cid = base[:-4] if base.endswith(".mxl") else None
            if cid in remaining:
                found[cid] = t.extractfile(m).read()
                remaining.discard(cid)
                if not remaining:
                    break

rows = []
for cid, uses in todo.items():
    for target, title in uses:
        slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40] or "piece"
        if cid in found:
            xml = root_xml(found[cid])
            fn = f"{target}-{slug}-{cid}.musicxml"
            (OUT / fn).write_text(xml, encoding="utf-8")
            parts = len(re.findall(r"<score-part\b", xml))
            staves = max([int(x) for x in re.findall(r"<staves>(\d+)</staves>", xml)] or [1])
            first_part = re.split(r"<part\b", xml, maxsplit=2)
            bars = len(re.findall(r"<measure\b", first_part[1])) if len(first_part) > 1 else 0
            rows.append(f"| {target} | {title} | (see archive row) | {cid} | {fn} | the named archive copy | {parts} parts / {staves} staves | {bars} | named by the reviewer | extracted by the orchestrator's second pass |")
        else:
            rows.append(f"| {target} | {title} | | {cid} | NOT FOUND | | | | named by the reviewer | cid in neither build/pdmx/library nor mxl.tar.gz |")
man = OUT / "MANIFEST.md"
s = man.read_text(encoding="utf-8")
s += ("\n\n## Second pass: the content ids the reviewer named\n\n"
      "The first pass misparsed lines written `title, \\`cid\\`` and pulled title-search results instead. Rows above for those candidates are substitutes; the named copies are here.\n\n"
      "| target | candidate | artist/composer | archive/catalog id | filename | arrangement/version | parts/staves | bars | why_candidate | notes |\n|---|---|---|---|---|---|---|---|---|---|\n"
      + "\n".join(rows) + "\n")
man.write_text(s, encoding="utf-8")
print("named:", len(named), "to fetch:", len(todo), "fetched:", len(found), "not found:", len(todo) - len(found))
