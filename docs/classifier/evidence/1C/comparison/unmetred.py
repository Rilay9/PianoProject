"""How each method handles a file with no time signature.

Cases: `song.classical.satie-gnossienne-1` (the catalogue file with no <time> element), the same file's PDMX cousins for
contrast, and a control made here: `exercise.syncopation.tied-across-bar` with its <time> element removed
(build/unmetred/tied-across-bar.notime.musicxml), whose metred answer is known.

Usage:  python unmetred.py prep            (main .venv: writes the stripped control)
        python unmetred.py cur             (main .venv: the current detector)
        python unmetred.py amads           (build/venv-amads: AMADS WNBD on the score file, span needs a metre)
        python unmetred.py synpy           (build/venv-synpy: a .rhy with no t{...} line; SynPy has no score input here)
        python unmetred.py beatsearch      (build/venv-beatsearch: a rhythm with no time signature)
Each writes unmetred_<tool>.json (what was returned or the exact exception).
"""
import json, re, sys, time, traceback, warnings
from pathlib import Path

warnings.simplefilter("ignore")
HERE = Path(__file__).resolve().parent
WT = HERE.parents[4]
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
CASES = ["song.classical.satie-gnossienne-1", "song.classical.satie-erik-satie-gnossienne-n1.pdmx",
         "song.classical.satie-erik-satie-gnossienne-no-3.pdmx"]
CONTROL = WT / "build/unmetred/tied-across-bar.notime.musicxml"
CONTROL_SRC = "exercise.syncopation.tied-across-bar"


def files():
    cat = {i["id"]: i for i in json.loads((CONTENT / "catalog.json").read_text(encoding="utf-8"))}
    d = {c: CONTENT / cat[c]["file"] for c in CASES + [CONTROL_SRC]}
    return cat, d


def has_time(path):
    sys.path.insert(0, str(HERE))
    import zipfile
    p = Path(path)
    if p.suffix == ".mxl":
        with zipfile.ZipFile(p) as z:
            c = z.read("META-INF/container.xml").decode("utf-8", "replace")
            name = re.search(r'full-path="([^"]+)"', c).group(1)
            xml = z.read(name).decode("utf-8", "replace")
    else:
        xml = p.read_text(encoding="utf-8", errors="replace")
    return xml, bool(re.search(r"<time[ >]", xml))


def prep():
    cat, d = files()
    xml, ht = has_time(d[CONTROL_SRC])
    assert ht
    stripped = re.sub(r"<time[ >].*?</time>", "", xml, flags=re.S)
    assert not re.search(r"<time[ >]", stripped)
    CONTROL.parent.mkdir(parents=True, exist_ok=True)
    CONTROL.write_text(stripped, encoding="utf-8")
    print("wrote", CONTROL, "; <time> in cases:", {c: has_time(d[c])[1] for c in CASES})


def cur():
    sys.path.insert(0, str(HERE))
    import syn_common as C
    vs, vc = C.current()
    cat, d = files()
    vc.BYID["control.notime"] = {"id": "control.notime", "file": str(CONTROL), "hands": "right"}
    out = {}
    for iid in CASES + ["control.notime", CONTROL_SRC]:
        try:
            r = vs.analyse(iid)
            out[iid] = {"kinds": r["kinds"], "present_page": r["present_page"], "unknown": r.get("unknown"),
                        "readable_bars": r.get("readable")}
        except Exception as ex:  # noqa: BLE001
            out[iid] = {"error": repr(ex)[:300]}
    (HERE / "unmetred_cur.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps(out)[:1500])


def amads():
    sys.path.insert(0, str(HERE))
    import amads_tools as AT
    cat, d = files()
    out = {}
    for iid in CASES + [CONTROL_SRC]:
        try:
            out[iid] = {"wnbd_score": float(AT.wnbd_score(d[iid]))}
        except Exception as ex:  # noqa: BLE001
            out[iid] = {"error": repr(ex)[:300]}
    try:
        out["control.notime"] = {"wnbd_score": float(AT.wnbd_score(CONTROL))}
    except Exception as ex:  # noqa: BLE001
        out["control.notime"] = {"error": repr(ex)[:300]}
    # what partitura gives for the Gnossienne's time signature
    import partitura
    sc = partitura.load_score(str(d[CASES[0]]))
    out["gnossienne_partitura_time_signatures"] = [str(x) for x in sc.parts[0].iter_all(partitura.score.TimeSignature)]
    (HERE / "unmetred_amads.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps(out)[:1500])


def synpy():
    sys.path.insert(0, str(HERE))
    import synpy_adapter as SA
    import tempfile, os
    out = {}
    body_no_t = "v{1, 0, 0, 1}\nv{0, 0, 1, 0}\n"
    body_t = "t{4/4}\n" + body_no_t
    for label, body in (("rhy_without_t", body_no_t), ("rhy_with_t", body_t)):
        p = Path(tempfile.gettempdir()) / f"synpy_{label}.rhy"
        p.write_text(body, encoding="utf-8")
        try:
            r = SA.run(SA.MODELS["LHL"], str(p))
            out[label] = {"syncopation_by_bar": r["syncopation_by_bar"]}
        except Exception as ex:  # noqa: BLE001
            out[label] = {"error": repr(ex)[:300], "trace": traceback.format_exc()[-600:]}
    # MIDI input is the route the survey names for scores; the port's MIDI parser is Python 2 only
    try:
        import readmidi  # noqa: F401
        out["midi_reader"] = "imported"
    except Exception as ex:  # noqa: BLE001
        out["midi_reader"] = repr(ex)[:300]
    (HERE / "unmetred_synpy.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps(out)[:1500])


def beatsearch():
    sys.path.insert(0, str(HERE))
    import beatsearch_shim as BS
    from beatsearch.rhythm import Unit
    out = {}
    for label, ts in (("no_time_signature", None), ("with_4_4", (4, 4))):
        try:
            rh = BS.MonophonicRhythm.create.from_binary_vector([1, 0, 0, 1, 0, 0, 1, 0], time_signature=ts, unit=Unit.EIGHTH)
            ex = BS.MonophonicSyncopationVector(unit=Unit.EIGHTH, salience_profile_type="hierarchical", cyclic=True)
            out[label] = {"syncopations": [list(map(float, s)) for s in ex.process(rh)]}
        except Exception as ex_:  # noqa: BLE001
            out[label] = {"error": repr(ex_)[:300]}
    (HERE / "unmetred_beatsearch.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
    print(json.dumps(out)[:1500])


if __name__ == "__main__":
    globals()[sys.argv[1]]()
