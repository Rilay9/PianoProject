"""Print text windows around a regex in saved HTML pages (Station 4 source reading)."""
import html
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")
pat = sys.argv[1]
win = int(sys.argv[2])
for f in sys.argv[3:]:
    t = open(f, encoding="utf-8", errors="replace").read()
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", t, flags=re.S)
    t = re.sub(r'<img[^>]*alt="([^"]*)"[^>]*>', r" [IMG: \1] ", t)
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    t = re.sub(r"\s+", " ", t)
    print("=====", f)
    seen = -1
    for m in re.finditer(pat, t, re.I):
        if m.start() < seen:
            continue
        print("...", t[max(0, m.start() - win // 2):m.end() + win], "\n")
        seen = m.end() + win
