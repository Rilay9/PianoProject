"""U105d, not for app/: U105c's check (runs/U105c/scripts-crlf_check.py) rerun on this worktree, for why
lessonClaimsAboutApp's blues.3 and 4.7 fail here. 4.7 matches LF-literal text in style.css read raw; on a
CRLF (core.autocrlf) checkout the LF form is absent and the CRLF form present. The text is not in the hunk
this lane adds. Run from the worktree root."""
import pathlib

checks = [
    ("app/src/style.css", ".score-stage--blind {\n  visibility: hidden;\n}"),
    ("build/u105d/style.base.css", ".score-stage--blind {\n  visibility: hidden;\n}"),
    # blues.3, in a file this lane does not touch.
    ("app/src/ui/screens/ScoreScreen.ts", "menuRow(\n    'Rhythm only'"),
]
out = []
for rel, lf in checks:
    raw = pathlib.Path(rel).read_bytes().decode("utf-8")
    out.append(
        f"{rel}: CRLF line endings {'yes' if chr(13) + chr(10) in raw else 'no'}; "
        f"LF form present {lf in raw}; CRLF form present {lf.replace(chr(10), chr(13) + chr(10)) in raw}"
    )
text = "\n".join(out) + "\n"
pathlib.Path("build/u105d/unit-crlf-check.txt").write_text(text, encoding="utf-8")
print(text)
