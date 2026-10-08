"""Shared helpers for the area-1B validation pass (build only, not committed)."""
import json, sys, zipfile, warnings
from pathlib import Path
import xml.etree.ElementTree as ET
warnings.simplefilter("ignore")
WT = Path(__file__).resolve().parents[2]
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
sys.path.insert(0, str(WT / "tools/classifier"))
CAT = json.load(open(CONTENT / "catalog.json", encoding="utf-8"))
ITEMS = [i for i in CAT if i.get("file")]
BYID = {i["id"]: i for i in CAT}
OUT = Path(__file__).resolve().parent


def pipeline(i):
    s = i.get("provenance", {}).get("source")
    return "generated" if s == "generated" else "pdmx" if s == "pdmx" else s


def fam(i):
    return i.get("provenance", {}).get("generator", {}).get("family")


def xml_root(item):
    p = CONTENT / item["file"]
    if p.suffix == ".mxl":
        with zipfile.ZipFile(p) as z:
            names = [n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META")]
            data = z.read(names[0])
    else:
        data = p.read_bytes()
    r = ET.fromstring(data)
    for e in r.iter():
        if isinstance(e.tag, str) and "}" in e.tag:
            e.tag = e.tag.split("}", 1)[1]
    return r


def one_line_staff(item):
    r = xml_root(item)
    return any(c.findtext("sign") == "percussion" for c in r.iter("clef")) or any((s.text or "").strip() == "1" for s in r.iter("staff-lines"))


def load(item):
    import score as S
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        return S.load(item, CONTENT)


def load_path(path, hands="both"):
    import score as S
    it = {"id": Path(path).stem, "file": str(Path(path).resolve()), "hands": hands}
    return S.load(it, Path("/"))
