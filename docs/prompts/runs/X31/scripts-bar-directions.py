import re
import sys
import zipfile

path, bars = sys.argv[1], sys.argv[2].split(",")
z = zipfile.ZipFile(path)
name = [n for n in z.namelist() if n.endswith((".xml", ".musicxml")) and not n.startswith("META")][0]
t = z.read(name).decode("utf-8")
for part in re.finditer(r'<part id="([^"]+)">(.*?)</part>', t, re.S):
    for m in re.finditer(r'<measure\b[^>]*number="([^"]+)"[^>]*>(.*?)</measure>', part.group(2), re.S):
        if m.group(1) not in bars:
            continue
        print(f"part {part.group(1)} measure {m.group(1)}")
        for d in re.findall(r'<direction\b.*?</direction>|<sound [^>]*/>|<note\b.*?</note>', m.group(2), re.S):
            d = re.sub(r"\s+", " ", d)
            if d.startswith("<note"):
                d = "NOTE " + ("rest" if "<rest" in d else "pitched") + " " + (re.search(r"<duration>(\d+)", d).group(1) if "<duration>" in d else "grace")
            print("   ", d[:420])
