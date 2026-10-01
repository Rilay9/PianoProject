"""U118a: candidates for the same race — a bare click on a bar control within a
few lines after a bare `#score-play` click in an e2e spec. A candidate, not a
finding: the run may be refused, paused or finished by then, or the spec may
reveal the bar another way."""
import glob
import re

BAR = re.compile(r"page\.locator\('#score-(hands-[A-Za-z]+|mode|hear|more|play|restart|tempo-label)'\)\.(click|selectOption)\(")
PLAY = re.compile(r"page\.locator\('#score-play'\)\.click\(")
for path in sorted(glob.glob('app/tests/e2e/*.spec.ts')):
    lines = open(path, encoding='utf-8').read().splitlines()
    for i, line in enumerate(lines):
        if not PLAY.search(line):
            continue
        for j in range(i + 1, min(i + 10, len(lines))):
            if 'test(' in lines[j] or 'summary' in lines[j].lower():
                break
            if BAR.search(lines[j]):
                print(f"{path}:{j + 1}: {lines[j].strip()[:110]}   (after the ▶ click at line {i + 1})")
                break
