"""
E50b (Entry 181): the content and relation-table items this seam changes, before and after, read from the diff of the
two files against the base (`git show <base>:<path>`, read only) and the working tree. Output: runs/E50b/content-items.txt.

    python scripts-content-items.py <base sha>
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
LOG = W / "docs" / "prompts" / "runs" / "E50b" / "content-items.txt"


def at(base: str, rel: str) -> dict:
    return json.loads(subprocess.run(["git", "-C", str(W), "show", f"{base}:{rel}"], capture_output=True, check=True).stdout.decode("utf-8"))


def now(rel: str) -> dict:
    return json.loads((W / rel).read_text(encoding="utf-8"))


def main(argv: list[str]) -> int:
    base = argv[0]
    lines: list[str] = [f"base {base}; the working tree of the worktree", ""]
    rel = "tools/content/repaired_identities.json"
    old, new = at(base, rel), now(rel)
    lines.append(f"## {rel}")
    if old["_comment"] != new["_comment"] and new["_comment"].startswith(old["_comment"]):
        lines.append(f"- `_comment`: before, E50's text ({len(old['_comment'])} characters); after, the same text with this appended:")
        lines.append(f"  {new['_comment'][len(old['_comment']):]!r}")
    elif old["_comment"] != new["_comment"]:
        lines.append(f"- `_comment`: before {old['_comment']!r}; after {new['_comment']!r}")
    for before, after in zip(old["repairs"], new["repairs"]):
        added = {k: after[k] for k in after if k not in before}
        changed = {k: (before[k], after[k]) for k in before if before.get(k) != after.get(k)}
        lines.append(f"- `repairs[{after['id']}]`: added {added}; changed {changed or 'nothing'}")
    if len(old["repairs"]) != len(new["repairs"]):
        lines.append(f"- repairs: {len(old['repairs'])} -> {len(new['repairs'])}")
    for cut in new.get("cuts", []):
        before = next((c for c in old.get("cuts", []) if c["id"] == cut["id"]), None)
        lines.append(f"- `cuts[{cut['id']}]`: before {'absent' if before is None else before}; after:")
        for key, value in cut.items():
            lines.append(f"    {key}: {json.dumps(value, ensure_ascii=False)}")
    lines.append("")
    rel = "content/catalog.schema.json"
    old, new = at(base, rel), now(rel)
    po = old["$defs"]["item"]["properties"]["provenance"]["properties"]
    pn = new["$defs"]["item"]["properties"]["provenance"]["properties"]
    lines.append(f"## {rel}")
    for key in sorted(set(po) | set(pn)):
        if po.get(key) == pn.get(key):
            continue
        if key in po and key in pn:
            for field in sorted(set(po[key]) | set(pn[key])):
                if po[key].get(field) != pn[key].get(field):
                    lines.append(f"- `$defs.item.properties.provenance.properties.{key}.{field}`: before {json.dumps(po[key].get(field), ensure_ascii=False)}")
                    lines.append(f"  after {json.dumps(pn[key].get(field), ensure_ascii=False)}")
        else:
            lines.append(f"- `$defs.item.properties.provenance.properties.{key}`: before {'absent' if key not in po else json.dumps(po[key], ensure_ascii=False)}")
            lines.append(f"  after {json.dumps(pn.get(key), ensure_ascii=False)}")
    rest_old = {k: v for k, v in old.items() if k != "$defs"}
    rest_new = {k: v for k, v in new.items() if k != "$defs"}
    lines.append(f"- anything else in the schema changed: {rest_old != rest_new or any(old['$defs'][k] != new['$defs'][k] for k in old['$defs'] if k != 'item')}")
    lines.append("")
    diff = subprocess.run(["git", "-C", str(W), "diff", "--stat", base, "--", "content/", "scores/"], capture_output=True, text=True).stdout
    lines.append("## every path changed under content/ and scores/ against the base")
    lines.extend("   " + line for line in diff.splitlines())
    LOG.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
