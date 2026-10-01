"""U105c, not for app/: why lessonClaimsAboutApp's blues.3 and 4.7 fail on this checkout. Each matches
LF-literal text in a file it reads raw; on a CRLF (core.autocrlf) checkout the LF form is absent and
the CRLF form present. Neither text is in a hunk this lane changes. Run from the worktree root."""
import pathlib

checks = [
    ("app/src/style.css", ".score-stage--blind {\n  visibility: hidden;\n}"),
]
out = []
for rel, lf in checks:
    raw = pathlib.Path(rel).read_bytes().decode("utf-8")
    out.append(
        f"{rel}: CRLF line endings {'yes' if chr(13) + chr(10) in raw else 'no'}; "
        f"LF form present {lf in raw}; CRLF form present {lf.replace(chr(10), chr(13) + chr(10)) in raw}"
    )
text = "\n".join(out) + "\n"
pathlib.Path("build/u105c/unit-crlf-check.txt").write_text(text, encoding="utf-8")
print(text)
