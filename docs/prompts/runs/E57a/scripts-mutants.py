"""
E57a (Entry 195): the brief's mutants, each undone in the same run (the worktree's files end as they began, sha256 checked).

    python scripts-mutants.py rock7 <base sha>            -> runs/E57a/mutants-rock7.txt
    python scripts-mutants.py relations-direct <base sha> -> runs/E57a/mutants-relations-direct.txt
    python scripts-mutants.py relations-build <base sha>  -> runs/E57a/mutants-relations-build.txt

- **rock7.** The rewritten rock.7 case (`lessonClaimsAboutMusic.test.ts`, "In the Hall of the Mountain King marks a
  crescendo …") on the built content: green as built (control); then Grieg's held bytes (the committed file at <base
  sha>, one tempo) put over the built copy, where it must go red; then the new bytes put back and green again.
- **relations-direct.** For each of the three rows, `convert.former_identities` on the landed file with E50a's table and
  the committed relations names the old identity, and with that row's relation dropped (every other relation kept) names
  nothing: `[]`, the shape `test_e57_an_undated_old_file_is_named_by_its_restore_lines_alone`'s refused cases use.
- **relations-build.** The three relations dropped from `tools/content/repaired_identities.json` (a text splice of their
  three lines; the bytes saved first and put back after, sha256 checked), the content rebuilt into build/e57a/content-mutant
  (scripts-run-build.ps1, --out), and each row's `provenance` read there against the final build's: the old identity must
  be gone from `formerIdentities` and `tempoRepairedFrom`. The three are dropped in one rebuild because each row's
  provenance reads only the relations whose `to` is its own file (build.py: `repaired_identities().get(identity sha)`;
  `convert.former_identities`: `r["to"] == current`), so each row's result is its own mutant; every other row's
  provenance is compared too and must not move.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
RUNS = W / "docs" / "prompts" / "runs" / "E57a"
ROWS = {"song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx": "QmXXdTmXQW5jKbHEHgHuZFuW57wNrtApiba8WidW76APCp",
        "song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx": "QmRx7Xqghks9vBikJpNFbaq6QKzkKghiePNRLvkGsUkZy7",
        "song.pop.billy-joel-rousseau-billy-joel-piano-man.pdmx": "QmWpzkuQx23WPUoU1Lvta6hJtK7ccBjeSwL1ATyJ47UUMU"}
GRIEG = "song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx"
RELATIONS = W / "tools" / "content" / "repaired_identities.json"


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def at_base(base: str, rel: str) -> bytes:
    return subprocess.run(["git", "-C", str(W), "show", f"{base}:{rel}"], capture_output=True, check=True).stdout


def catalogue(content: Path) -> dict[str, dict]:
    raw = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    return {item["id"]: item for item in (raw["items"] if isinstance(raw, dict) else raw)}


def vitest(pattern: str) -> tuple[int, str]:
    done = subprocess.run(f'npx vitest run tests/unit/lessonClaimsAboutMusic.test.ts -t "{pattern}"', cwd=W / "app", shell=True,
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = done.stdout + done.stderr
    keep = [line for line in out.splitlines() if any(k in line for k in ("✓", "×", "FAIL", "Tests ", "AssertionError", "expected"))]
    return done.returncode, "\n".join("      " + line.strip() for line in keep[:12])


def rock7(base: str) -> tuple[list[str], bool]:
    row = catalogue(W / "app/public/content")[GRIEG]
    built = W / "app/public/content" / row["file"]
    landed = (W / "content/scores/pdmx" / f"{ROWS[GRIEG]}.mxl").read_bytes()
    held = at_base(base, f"content/scores/pdmx/{ROWS[GRIEG]}.mxl")
    lines = [f"rock.7 mutant: the built Grieg copy {row['file']} (landed {sha(landed)[:12]}, held {sha(held)[:12]})"]
    if sha(built.read_bytes()) != sha(landed):
        return lines + ["FAULT the built copy is not the landed file; build first"], False
    pattern = "In the Hall of the Mountain King marks a crescendo"
    code, out = vitest(pattern)
    lines += [f"control (landed bytes): exit {code} (expected 0)", out]
    try:
        built.write_bytes(held)
        code_m, out_m = vitest(pattern)
        lines += [f"mutant (the held bytes, one tempo): exit {code_m} (expected 1: caught)", out_m]
    finally:
        built.write_bytes(landed)
    code_r, out_r = vitest(pattern)
    lines += [f"restored (landed bytes again, sha256 {sha(built.read_bytes())[:12]}): exit {code_r} (expected 0)", out_r]
    ok = code == 0 and code_m == 1 and code_r == 0 and sha(built.read_bytes()) == sha(landed)
    return lines + [f"rock.7 mutant caught and undone: {ok}"], ok


def relations_direct(base: str) -> tuple[list[str], bool]:
    sys.path.insert(0, str(W / "tools" / "content"))
    import convert

    table = json.loads(convert.FORMER_IDENTITIES_FILE.read_text(encoding="utf-8"))["identities"]
    repairs = json.loads(RELATIONS.read_text(encoding="utf-8"))["repairs"]
    lines = [f"relations, direct: convert.former_identities on each landed file, E50a's table and {len(repairs)} committed relations"]
    caught = 0
    for item_id, cid in ROWS.items():
        path = W / "content/scores/pdmx" / f"{cid}.mxl"
        current = sha(path.read_bytes())
        old = sha(at_base(base, f"content/scores/pdmx/{cid}.mxl"))
        mine = [r for r in repairs if r["id"] == item_id and r["to"] == current]
        with_it = convert.former_identities(path, table, repairs)
        without = convert.former_identities(path, table, [r for r in repairs if r not in mine])
        ok = len(mine) == 1 and mine[0]["from"] == old and with_it == [old] and without == []
        caught += ok
        lines.append(f"   {item_id}: its relations {len(mine)}; with them named {[s[:12] for s in with_it]} (old {old[:12]}); "
                     f"with its relation dropped named {without}: {'caught' if ok else 'NOT CAUGHT'}")
    return lines + [f"{caught} of {len(ROWS)} caught"], caught == len(ROWS)


def relations_build(base: str) -> tuple[list[str], bool]:
    saved = RELATIONS.read_bytes()
    keep = W / "build/e57a/repaired_identities.saved.json"
    keep.write_bytes(saved)
    final = catalogue(W / "app/public/content")
    text = saved.decode("utf-8")
    body = text.split("\n")
    drop = [i for i, line in enumerate(body) if any(line.startswith(f'    {{"id": "{item_id}"') for item_id in ROWS)]
    lines = [f"relations, rebuilt: {len(drop)} relation line(s) dropped from repaired_identities.json (saved {sha(saved)[:12]})"]
    mutated = [line for i, line in enumerate(body) if i not in drop]
    end = next(i for i, line in enumerate(mutated) if line == "  ],")
    mutated[end - 1] = mutated[end - 1].rstrip(",")
    try:
        RELATIONS.write_text("\n".join(mutated), encoding="utf-8", newline="\n")
        parsed = json.loads(RELATIONS.read_text(encoding="utf-8"))
        lines.append(f"   mutated file: {len(parsed['repairs'])} repairs; none of the three rows': "
                     f"{not any(r['id'] in ROWS for r in parsed['repairs'])}")
        out = W / "build/e57a/content-mutant"
        code = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
                               str(RUNS / "scripts-run-build.ps1"), "-Name", "build-mutant", "-Out", str(out)]).returncode
        exit_file = (W / "build/e57a/build-mutant.exit").read_text(encoding="ascii").strip()
        lines.append(f"   rebuild into build/e57a/content-mutant: powershell exit {code}, build exit {exit_file}")
    finally:
        RELATIONS.write_bytes(saved)
    restored = sha(RELATIONS.read_bytes()) == sha(saved)
    lines.append(f"   repaired_identities.json put back byte for byte: {restored}")
    mutant = catalogue(W / "build/e57a/content-mutant")
    caught = 0
    for item_id, cid in ROWS.items():
        old = sha(at_base(base, f"content/scores/pdmx/{cid}.mxl"))
        a, b = final[item_id]["provenance"], mutant[item_id]["provenance"]
        names = lambda p, key: [one["sha256"] for one in p.get(key) or []]  # noqa: E731
        ok = (old in names(a, "formerIdentities") and old in names(a, "tempoRepairedFrom") and
              old not in names(b, "formerIdentities") and old not in names(b, "tempoRepairedFrom") and a["identity"] == b["identity"])
        caught += ok
        lines.append(f"   {item_id}: final build formerIdentities {[s[:12] for s in names(a, 'formerIdentities')]}, tempoRepairedFrom "
                     f"{[s[:12] for s in names(a, 'tempoRepairedFrom')]}; mutant build formerIdentities "
                     f"{[s[:12] for s in names(b, 'formerIdentities')]}, tempoRepairedFrom {[s[:12] for s in names(b, 'tempoRepairedFrom')]}; "
                     f"identity {b['identity']['sha256'][:12]} both: {'caught' if ok else 'NOT CAUGHT'}")
    others = [i for i in final if i not in ROWS and i in mutant and final[i].get("provenance") != mutant[i].get("provenance")]
    lines.append(f"   every other row's provenance equal between the two builds: {not others} ({len(others)} differ{': ' + str(others[:5]) if others else ''})")
    return (lines + [f"{caught} of {len(ROWS)} caught; file restored {restored}; every other row unmoved {not others}"],
            caught == len(ROWS) and restored and not others)


def main(argv: list[str]) -> int:
    mode, base = argv[0], argv[1]
    lines, ok = {"rock7": rock7, "relations-direct": relations_direct, "relations-build": relations_build}[mode](base)
    (RUNS / f"mutants-{mode}.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
