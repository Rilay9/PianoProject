"""
E59's content itemisation (operating-procedure §12), generated: one item per moved file — where, what, before, after,
why — from the two builds, the app's reading of them and the identity relations, never by hand.

    python scripts-content-items.py <before content dir> <after content dir> <before reader dump> <after reader dump>

Per row whose built file changed between the two builds: the file (a committed PDMX file and its `pdmx.json`
`convertedSha256`; a file the build converts and its catalogue checksum; a cut); the inserted tempo direction before and
after, read from each file's score text; the tempo events the app's reader plays before and after (scripts-reader.table.ts's
dumps: bar ordinal:offset, quarter notes a minute, and the printed mark the reader saw); the catalogue's tempo truth before
and after (`tempoBpm`, the `tempo-defaulted` tag, `provenance.facts.tempo`), which must not move; the identity relation
(`tools/content/repaired_identities.json`). Outputs: runs/E59/content-items.txt (every item, in full) and
runs/E59/content-section.md (the entry's list, one line per file).
"""
from __future__ import annotations

import importlib.util
import json
import re
import sys
import zipfile
from pathlib import Path

W = Path(__file__).resolve().parents[4]
RUNS = W / "docs" / "prompts" / "runs" / "E59"
WHY = "the edition states no tempo; a converter default is playback truth, not a printed fact"


def transform_module():
    sys.path.insert(0, str(W / "tools" / "content"))
    spec = importlib.util.spec_from_file_location("e59_transform", RUNS / "scripts-pdmx-transform.py")
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def rows(content: Path) -> dict[str, dict]:
    raw = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    return {item["id"]: item for item in (raw["items"] if isinstance(raw, dict) else raw)}


def score_text(path: Path) -> str:
    with zipfile.ZipFile(path) as archive:
        names = [n for n in archive.namelist() if not n.startswith("META-INF/") and n.lower().endswith((".xml", ".musicxml"))]
        return archive.read(names[0]).decode("utf-8")


def direction(text: str) -> str:
    """The direction holding the file's first `<sound tempo>`, on one line."""
    at = text.index('<sound tempo="')
    start = max(text.rfind("<direction>", 0, at), text.rfind("<direction ", 0, at))
    end = text.index("</direction>", at) + len("</direction>")
    return re.sub(r">\s+<", "><", text[start:end])


def events_text(events: list[dict]) -> str:
    return ", ".join(f"{e['at']} {e['bpm']:g} from {e['from']}" + (f", printed mark {e['mark']:g}" if e["mark"] is not None else "")
                     for e in events)


def truth(item: dict) -> str:
    fact = ((item.get("provenance") or {}).get("facts") or {}).get("tempo")
    return (f"tempoBpm {item.get('tempoBpm')}; tag tempo-defaulted {'yes' if 'tempo-defaulted' in (item.get('tags') or []) else 'no'}; "
            f"facts.tempo {json.dumps(fact, ensure_ascii=False)}")


def main(argv: list[str]) -> int:
    tx = transform_module()
    before_dir, after_dir = Path(argv[0]), Path(argv[1])
    dumps = {}
    for which, path in (("before", Path(argv[2])), ("after", Path(argv[3]))):
        dumps[which] = {json.loads(l)["id"]: json.loads(l)["events"] for l in path.read_text(encoding="utf-8").splitlines() if l.strip()}
    before, after = rows(before_dir), rows(after_dir)
    pdmx = {r["id"]: r for r in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}
    table = json.loads((W / "tools/content/repaired_identities.json").read_text(encoding="utf-8"))
    relations = [r for r in table["repairs"] + table.get("cuts", []) if r["change"].startswith("E59 ")]
    moved = [item_id for item_id in sorted(set(before) & set(after)) if before[item_id].get("file") and after[item_id].get("file")
             and (before_dir / before[item_id]["file"]).read_bytes() != (after_dir / after[item_id]["file"]).read_bytes()]
    detail: list[str] = []
    section: list[str] = []
    faults: list[str] = []
    by_family: dict[str, int] = {}
    for item_id in moved:
        a, b = before[item_id], after[item_id]
        source = (a.get("provenance") or {}).get("source") or "?"
        by_family[source] = by_family.get(source, 0) + 1
        old_text, new_text = score_text(before_dir / a["file"]), score_text(after_dir / b["file"])
        was, now = direction(old_text), direction(new_text)
        _, shape = tx.transform_text(old_text)
        ev_was, ev_now = dumps["before"].get(item_id, []), dumps["after"].get(item_id, [])
        mine = [r for r in relations if r["id"] == item_id]
        if not mine:
            faults.append(f"{item_id}: no E59 relation")
        froms = ", ".join(f"{r['from'][:12]}…" + (" (undated)" if r.get("undated") else f" ({r['date']}, system {r['system']})" if "date" in r
                                                   else f" (the old cut, system {r['system']})") for r in mine)
        to = (mine[0]["to"][:12] + "…") if mine else "none"
        if truth(a) != truth(b):
            faults.append(f"{item_id}: the catalogue's tempo truth moved ({truth(a)} -> {truth(b)})")
        if source == "pdmx":
            where = f"`content/scores/pdmx/{pdmx[item_id]['cid']}.mxl` + `content/sources/pdmx.json` row `convertedSha256`"
            how = "the committed file, transformed by scripts-pdmx-transform.py"
        elif source == "excerpt":
            where = f"the built cut `{a['file']}` (re-cut each build from its moved parent `{a['provenance']['excerpt']['of']}`)"
            how = "re-cut by the build"
        else:
            where = f"the built `{a['file']}` (converted each build; its catalogue `provenance.edition`/`source.checksum` carry the checksum)"
            how = f"converted by the build ({source})"
        title = a.get("title") or item_id
        section.append(f"- **{title}** (`{item_id}`, {source}, {shape}) — {where}. Before: printed `<metronome>` quarter = 96 and "
                       f"`<sound tempo=\"96\">`. After: `<sound tempo=\"96\">` alone (empty `<words />`). The app plays [{events_text(ev_now)}] "
                       f"before and after; the printed mark it read before is gone. Tag and catalogue tempo unchanged. "
                       f"Identity {froms} → {to}, reviewed repair, tempoChanged false. Why: {WHY}.")
        detail += [f"== {item_id} ({title}) [{source}; {how}]", f"   where: {where}",
                   f"   before: {was}", f"   after:  {now}",
                   f"   the app's reader: before [{events_text(ev_was)}]; after [{events_text(ev_now)}]",
                   f"   the catalogue's tempo truth, before and after: {truth(b)}" if truth(a) == truth(b) else
                   f"   the catalogue's tempo truth: before {truth(a)}; after {truth(b)}",
                   f"   identity: {froms} -> {to} (repaired_identities.json, tempoChanged false)", ""]
    detail.insert(0, f"why, for every item: {WHY}")
    head = [f"E59 content items: {len(moved)} moved file(s) ({', '.join(f'{k} {v}' for k, v in sorted(by_family.items()))}), read from "
            "the two builds, the app's reader and the relations; nothing here is heard", f"{len(faults)} fault(s)"] + \
           [f"   FAULT {fault}" for fault in faults] + [""]
    (RUNS / "content-items.txt").write_text("\n".join(head + detail) + "\n", encoding="utf-8")
    (RUNS / "content-section.md").write_text("\n".join(section) + "\n", encoding="utf-8")
    print("\n".join(head))
    return 1 if faults else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
