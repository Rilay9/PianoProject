"""
E50a item 4's mutants: each applied to its file in place, the named test run, the file's exact bytes put
back (checked). Each command is first run unmutated as a control, which must turn nothing red.
Output: mutants.txt (the summary; no full log is kept).
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
OUT = W / "docs" / "prompts" / "runs" / "E50a" / "mutants.txt"
NPX = shutil.which("npx") or "npx"
PY = sys.executable
CONVERT = W / "tools" / "content" / "convert.py"
MATERIAL = W / "app" / "src" / "curriculum" / "material.ts"
ENCOUNTERS = W / "app" / "src" / "data" / "encounterStore.ts"
PROGRESS = W / "app" / "src" / "data" / "progressStore.ts"


def py(test: str) -> tuple[list[str], Path]:
    return [PY, "-m", "unittest", f"tests.test_convert_cache.{test}"], W / "tools" / "content"


def vt(name: str) -> tuple[list[str], Path]:
    return [NPX, "vitest", "run", "tests/unit/formerIdentity.test.ts", "-t", name], W / "app"


MUTANTS = [
    ("the normaliser dropped from the .mxl branch", CONVERT,
     'normalised_text(data.decode("utf-8")).encode("utf-8") if is_text_entry(name)',
     'deterministic_ids(data.decode("utf-8")).encode("utf-8") if is_text_entry(name)',
     py("TestReproducible.test_converting_on_two_dates_gives_identical_bytes")),
    ("the normaliser dropped from the plain branch", CONVERT,
     'normalised_text(out_path.read_text(encoding="utf-8"))',
     'deterministic_ids(out_path.read_text(encoding="utf-8"))',
     py("TestReproducible.test_converting_on_two_dates_gives_identical_bytes_as_plain_musicxml")),
    ("the resolution dropped from sameMaterial", MATERIAL,
     "sameIdentity(learnerMaterial(a), learnerMaterial(b))",
     "sameIdentity(a, b)",
     vt("A1: a run of the item stored against the dated file")),
    ("the former keys dropped from the lookups (learnerMaterialKeys gives the current key alone)", MATERIAL,
     "return [own, ...(formersOfCurrent.get(resolved.sha256) ?? []).map((sha256) => `file:${sha256}`)];",
     "return [own];",
     vt("A[34]:")),
    ("the former keys dropped from contact's encounter lookup (the one key, as before)", PROGRESS,
     "encountersOf(learnerMaterialKeys(material, itemId), itemId)",
     "encountersOf([materialKey(material, itemId)], itemId)",
     vt("A3")),
    ("the former keys dropped from historyFor's neighbourhood (the one key, as before)", ENCOUNTERS,
     "const keys = new Set<string>(learnerMaterialKeys(target.material, target.itemId));",
     "const keys = new Set<string>([materialKey(target.material, target.itemId)]);",
     vt("A[34]:")),
    ("the equality-proxy root left unresolved (scopeOfFact's material root, as before)", ENCOUNTERS,
     "if (known) return { root: learnerMaterialKey(fact.material, fact.itemIds[0] ?? ''), bars: fact.bars, byId: false };",
     "if (known) return { root: materialKey(fact.material, fact.itemIds[0] ?? ''), bars: fact.bars, byId: false };",
     vt("A6")),
    ("storage keys resolved as well", MATERIAL,
     "if (material?.kind === 'file') return `file:${material.sha256}`;",
     "if (material?.kind === 'file') return `file:${learnerMaterial(material).sha256}`;",
     vt("G6")),
    ("the current-identity rule dropped", MATERIAL,
     "if (one.kind !== 'file' || current.has(one.sha256)) continue;",
     "if (one.kind !== 'file') continue;",
     vt("G2")),
    ("variants emitted for a dated file", CONVERT,
     'if block is None or "<encoding-date>" in block.group(1) or "<software>music21 v." not in block.group(1):',
     'if block is None or "<software>music21 v." not in block.group(1):',
     py("TestFormerIdentities.test_a_dated_file_a_musescore_file_and_a_file_with_no_encoding_give_none")),
    ("the date inserted after <software>", CONVERT,
     'at = block.start() + len("<encoding>") + len(newline)',
     'at = xml_text.index("\\n", block.start() + len("<encoding>") + len(newline)) + 1',
     py("TestFormerIdentities.test_a_recorded_dated_file_of_the_same_music_is_re_proved_and_named")),
    # The brief's "window cut to one day" has no window to cut since the reviewer's historical rule
    # (questions-71bd6cee.md); its successor: the record cut to its first entry.
    ("only the first recorded entry named (the record cut short)", CONVERT,
     "    for entry in candidates:",
     "    for entry in list(candidates)[:1]:",
     py("TestFormerIdentities.test_a_recorded_dated_file_of_the_same_music_is_re_proved_and_named")),
    ("the re-proof dropped (an entry named on its undated form alone)", CONVERT,
     'if rebuilt is not None and hashlib.sha256(rebuilt).hexdigest() == entry["sha256"] and entry["sha256"] not in out:',
     'if entry["sha256"] not in out:',
     py("TestFormerIdentities.test_a_recorded_dated_file_of_the_same_music_is_re_proved_and_named")),
    ("the historical record ignored by the build's default (no table read)", CONVERT,
     "candidates: tuple[dict, ...] | list[dict] = historical_identities().get(current, ())",
     "candidates: tuple[dict, ...] | list[dict] = ()",
     py("TestFormerIdentities.test_a_recorded_dated_file_of_the_same_music_is_re_proved_and_named")),
]


def run(command: list[str], cwd: Path) -> tuple[int, str]:
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    done = subprocess.run(command, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", env=env)
    text = (done.stdout or "") + (done.stderr or "")
    tail = [line for line in text.splitlines() if any(k in line for k in ("Tests ", "FAILED", "OK", "Ran ", "AssertionError", "×", "✓"))]
    return done.returncode, " | ".join(tail[-4:])[:400]


lines = ["# E50a mutants: each applied in place, its named test run, the file's bytes restored and checked", ""]
controls: dict[str, tuple[int, str]] = {}
for label, path, old, new, (command, cwd) in MUTANTS:
    key = " ".join(command[2:])
    if key not in controls:
        controls[key] = run(command, cwd)
        lines.append(f"control (unmutated) `{key}`: exit {controls[key][0]} — {controls[key][1]}")
lines.append("")
survivors = 0
for label, path, old, new, (command, cwd) in MUTANTS:
    original = path.read_bytes()
    text = original.decode("utf-8")
    count = text.count(old)
    if count != 1:
        lines.append(f"NOT RUN: {label}: the pattern occurs {count} times in {path.relative_to(W).as_posix()}")
        survivors += 1
        continue
    try:
        path.write_bytes(text.replace(old, new).encode("utf-8"))
        code, tail = run(command, cwd)
    finally:
        path.write_bytes(original)
    assert path.read_bytes() == original, f"{path} not restored"
    killed = code != 0
    survivors += 0 if killed else 1
    lines.append(f"{'killed' if killed else 'SURVIVED'}: {label} ({path.relative_to(W).as_posix()}) — "
                 f"`{' '.join(command[2:])}` exit {code} — {tail}")
lines += ["", f"survivors: {survivors}; controls red: {sum(1 for c, _ in controls.values() if c != 0)}"]
OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("\n".join(lines))
sys.exit(1 if survivors or any(c != 0 for c, _ in controls.values()) else 0)
