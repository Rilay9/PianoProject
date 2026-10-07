"""E50a item 2's refuting grep over app/src: every comparison of a stored identity or key. Each hit is
classified in ENTRY.md (routed through the resolution, or why not). Output: refuting-grep.txt."""
import re
from pathlib import Path

W = Path(__file__).resolve().parents[4]
SRC = W / "app" / "src"
PATTERNS = {
    ".sha256 compared": r"sha256\s*[!=]==|[!=]==\s*[\w.?]*sha256",
    "materialKey / projectKey / learnerMaterialKey(s) called": r"\b(materialKey|projectKey|learnerMaterialKeys?)\(",
    "sameIdentity( called": r"\bsameIdentity\(",
    "sameMaterial( called": r"\bsameMaterial\(",
    "a stored row read by key": r"getAllFromIndex\('encounters'|get\('contacts'|get\('projects'|get\('encounters'",
}
out = []
for title, pattern in PATTERNS.items():
    out.append(f"## {title}")
    rx = re.compile(pattern)
    for path in sorted(SRC.rglob("*.ts")):
        for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith(("*", "//", "/**")):
                continue
            if rx.search(line):
                out.append(f"{path.relative_to(W).as_posix()}:{n}: {stripped[:170]}")
(W / "docs" / "prompts" / "runs" / "E50a" / "refuting-grep.txt").write_text("\n".join(out) + "\n", encoding="utf-8")
print("\n".join(out))
