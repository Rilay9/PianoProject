"""
E59's mutants, the brief's three, each on a copy, never the worktree's own files; the unchanged copy is the green control.

    python scripts-mutants.py <before content dir> <after content dir>

(a) the converter's default branch reverted to `float(DEFAULT_TEMPO_BPM)` (a printed quarter = 96): the new and revised
    `test_convert` cases must go red (scripts-tests-with.py), and two raw PDMX uploads, one of each shape, converted by the
    copy must come out as the committed converter's output again (the itemisation's "before"), byte for byte.
(b) the transform taking only one of the two shapes (the `<staff>` case dropped, its 95 rows left as committed): the data
    layer (scripts-verify-moved.py over a copy of `content/scores/pdmx`) must catch it on the full count, not a sample.
(c) the identity relations of one kern row and of one MuseTrainer row left out (a copy of `repaired_identities.json`): the
    data layer must fail to re-prove exactly those rows' old identities.
(d) the lane's own choice reversed: E59's relations marked `tempoChanged: true` (the table mutated in place for the run,
    its bytes put back and checked): the lineage test's E59 cases and the committed-relations case must go red.
Output: runs/E59/mutants.txt. Exit 0 when the control is green and every mutant is caught.
"""
from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path

W = Path(__file__).resolve().parents[4]
RUNS = W / "docs" / "prompts" / "runs" / "E59"
TMP = W / "build" / "e59" / "mutants"
SOURCE = (W / "tools" / "content" / "convert.py").read_text(encoding="utf-8").replace("\r\n", "\n")
E59_LINE = "        insert_tempo(staves[0], tempo.MetronomeMark(numberSounding=DEFAULT_TEMPO_BPM))\n"
BASE_LINE = "        insert_tempo(staves[0], float(DEFAULT_TEMPO_BPM))\n"
#: One raw upload of each shape (pdmx-shapes.txt): a single staff and a grand staff.
SAMPLES = {"song.folk.i-remember-you.pdmx": "one staff", "song.pop.misc-soundtrack-lavender-s-blue.pdmx": "staff 1"}
KERN_ROW = "song.classical.chopin-ballade-2.nifc"
MT_ROW = "song.classical.beethoven-fur-elise.easy"


def transform_module():
    sys.path.insert(0, str(W / "tools" / "content"))
    spec = importlib.util.spec_from_file_location("e59_transform", RUNS / "scripts-pdmx-transform.py")
    module = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def converter(name: str, text: str) -> Path:
    folder = TMP / name
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "convert.py").write_text(text, encoding="utf-8", newline="\n")
    for table in ("former_identities.json", "repaired_identities.json"):
        (folder / table).write_bytes((W / "tools" / "content" / table).read_bytes())
    return folder


def convert_samples(folder: Path, items: dict[str, dict]) -> dict[str, bytes]:
    script = (
        "import sys, importlib.util; from pathlib import Path\n"
        f"sys.path.insert(0, {str(W / 'tools' / 'content')!r})\n"
        f"spec = importlib.util.spec_from_file_location('convert', {str(folder / 'convert.py')!r})\n"
        "m = importlib.util.module_from_spec(spec); sys.modules['convert'] = m; spec.loader.exec_module(m)\n"
        "for raw, dest in zip(sys.argv[1::2], sys.argv[2::2]): m.convert_file(Path(raw), Path(dest))\n"
    )
    args = []
    for item_id in SAMPLES:
        cid = items[item_id]["cid"]
        args += [str(W / "build/e59/pdmx/raw" / f"{cid}.mxl"), str(folder / f"{cid}.mxl")]
    subprocess.run([sys.executable, "-c", script, *args], check=True, cwd=W)
    return {item_id: (folder / f"{items[item_id]['cid']}.mxl").read_bytes() for item_id in SAMPLES}


def unit(folder: Path) -> tuple[int, list[str]]:
    run = subprocess.run([sys.executable, str(RUNS / "scripts-tests-with.py"), str(folder)], capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=W)
    failing = sorted({line.split(" (", 1)[0].split(": ", 1)[-1] for line in run.stdout.splitlines() if line.startswith(("FAIL: ", "ERROR: "))})
    return run.returncode, failing


def verify(before: str, after: str, name: str, *extra: str) -> tuple[int, str]:
    run = subprocess.run([sys.executable, str(RUNS / "scripts-verify-moved.py"), before, after, "--name", name, *extra],
                         capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=W)
    text = (RUNS / f"{name}.txt").read_text(encoding="utf-8")
    return run.returncode, text


def main(argv: list[str]) -> int:
    before, after = argv[0], argv[1]
    shutil.rmtree(TMP, ignore_errors=True)
    items = {r["id"]: r for r in json.loads((W / "content/sources/pdmx.json").read_text(encoding="utf-8"))["items"]}
    lines: list[str] = []
    ok = True
    if SOURCE.count(E59_LINE) != 1:
        raise SystemExit("the E59 line is not once in convert.py")

    # control and (a)
    for name, text in (("control", SOURCE), ("a", SOURCE.replace(E59_LINE, BASE_LINE, 1))):
        folder = converter(name, text)
        code, failing = unit(folder)
        outputs = convert_samples(folder, items)
        same_as = {item_id: ("E59's output" if out == (W / "build/e59/pdmx/new" / f"{items[item_id]['cid']}.mxl").read_bytes() else
                             "the committed converter's output" if out == (W / "build/e59/pdmx/base" / f"{items[item_id]['cid']}.mxl").read_bytes()
                             else "neither") for item_id, out in outputs.items()}
        record = f"{name}: unit exit {code}; failing {failing or 'none'}; the two raw uploads ({', '.join(SAMPLES.values())}) come out as {same_as}"
        if name == "control":
            good = code == 0 and set(same_as.values()) == {"E59's output"}
            record += " — green, as it must be" if good else " — RED: the control fails"
        else:
            good = code != 0 and set(same_as.values()) == {"the committed converter's output"} and \
                "test_missing_tempo_gets_the_default" in failing
            record += " — caught" if good else " — NOT CAUGHT"
        ok &= good
        lines.append(record)

    # (b) the staff shape skipped
    tx = transform_module()
    folder = TMP / "b" / "pdmx"
    shutil.copytree(W / "content" / "scores" / "pdmx", folder)
    skipped = 0
    for item_id, row in items.items():
        if row.get("tempoDefaulted") is not True:
            continue
        rel = f"content/scores/pdmx/{row['cid']}.mxl"
        old = subprocess.run(["git", "-C", str(W), "show", f"13e1b1a8:{rel}"], capture_output=True, check=True).stdout
        _, shape = tx.transform_file(old)
        if shape != "one staff":
            (folder / f"{row['cid']}.mxl").write_bytes(old)
            skipped += 1
    code, text = verify(before, after, "mutant-b-verify", "--pdmx", str(folder))
    caught = code != 0 and "pdmx: moved 74, the inventory 169" in text
    ok &= caught
    lines.append(f"b: the transform with the <staff> shape dropped ({skipped} rows left as committed): verify exit {code}; "
                 f"{text.splitlines()[[i for i, l in enumerate(text.splitlines()) if l.startswith('pdmx:')][0]]}; "
                 f"{[l for l in text.splitlines() if l.endswith('fault(s)')][0]}" + (" — caught" if caught else " — NOT CAUGHT"))

    # (c) one kern row's and one MuseTrainer row's relations left out
    table = json.loads((W / "tools/content/repaired_identities.json").read_text(encoding="utf-8"))
    dropped = [one for one in table["repairs"] if one["id"] in (KERN_ROW, MT_ROW) and one["change"].startswith("E59 ")]
    table["repairs"] = [one for one in table["repairs"] if one not in dropped]
    copy = TMP / "c" / "repaired_identities.json"
    copy.parent.mkdir(parents=True, exist_ok=True)
    copy.write_text(json.dumps(table, ensure_ascii=False), encoding="utf-8")
    code, text = verify(before, after, "mutant-c-verify", "--relations", str(copy))
    faults = [l.strip() for l in text.splitlines() if l.strip().startswith("FAULT")]
    caught = code != 0 and len(faults) == 2 and all(any(row in f for f in faults) for row in (KERN_ROW, MT_ROW))
    ok &= caught
    lines.append(f"c: the relations of {KERN_ROW} and {MT_ROW} left out ({len(dropped)} relations): verify exit {code}; faults {faults}"
                 + (" — caught" if caught else " — NOT CAUGHT"))
    code, text = verify(before, after, "mutant-control-verify")
    lines.append(f"control for (b) and (c): the committed files and relations, verify exit {code}; {[l for l in text.splitlines() if l.endswith('fault(s)')][0]}")
    ok &= code == 0

    # (d), the lane's own choice: E59's relations marked tempoChanged true. The tests read the committed table in place, so
    # the file is mutated for the run and its bytes put back (checked) whatever happens.
    path = W / "tools/content/repaired_identities.json"
    original = path.read_bytes()
    try:
        path.write_bytes(original.replace(b'"tempoChanged": false', b'"tempoChanged": true'))
        ts = subprocess.run(["npx.cmd", "vitest", "run", "tests/unit/repairedTempoLineage.test.ts"], capture_output=True, text=True, encoding="utf-8", errors="replace",
                            cwd=W / "app")
        py = subprocess.run([sys.executable, "-m", "unittest",
                             "tests.test_convert_cache.TestRepairedIdentities.test_the_committed_relations_re_prove_on_the_committed_scores"],
                            capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=W / "tools" / "content")
    finally:
        path.write_bytes(original)
    if path.read_bytes() != original:
        raise SystemExit("STOP: the relation table's bytes did not come back")
    failed_ts = sorted({line.strip() for line in ts.stdout.splitlines() if "E59" in line and ("×" in line or "FAIL" in line)})
    caught = ts.returncode != 0 and py.returncode != 0
    ok &= caught
    lines.append(f"d: E59's relations marked tempoChanged true: repairedTempoLineage exit {ts.returncode} ({len(failed_ts)} E59 line(s) failing: "
                 f"{failed_ts[:3]}); test_the_committed_relations_re_prove_on_the_committed_scores exit {py.returncode}; the table's bytes put back"
                 + (" — caught" if caught else " — NOT CAUGHT"))
    lines.append(f"control green and every mutant caught: {ok}")
    (RUNS / "mutants.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    shutil.rmtree(TMP, ignore_errors=True)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
