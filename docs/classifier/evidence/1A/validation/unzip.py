import sys, zipfile, xml.etree.ElementTree as ET
from walk import BYID, HERE
for i in sys.argv[1:]:
    with zipfile.ZipFile(HERE / BYID[i]["file"]) as z:
        names = z.namelist(); rf = None
        if "META-INF/container.xml" in names:
            c = ET.fromstring(z.read("META-INF/container.xml"))
            for e in c.iter():
                if e.tag.endswith("rootfile"):
                    rf = e.get("full-path"); break
        rf = rf or [n for n in names if not n.startswith("META-INF") and n.endswith((".xml", ".musicxml"))][0]
        (HERE / "xml").mkdir(exist_ok=True)
        open(HERE / "xml" / (i + ".xml"), "wb").write(z.read(rf))
        print("xml/" + i + ".xml")
