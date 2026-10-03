"""G30's update of app/tests/e2e/microscope.spec.ts: latin_groove's version is 2 since G30's bump.

usage: python docs/prompts/runs/G30/scripts-edit_microscope_spec.py
Class: replace (the old assumption: latin_groove is at version 1). The microscope prints the row's version and
the item's identity; G30 moved the family 1 -> 2 when it withdrew the unsourced fingering. Idempotent.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PATH = ROOT / "app" / "tests" / "e2e" / "microscope.spec.ts"
EDITS = [
    ("""    await expect(page.locator('[data-fact="version"]')).toContainText('v1');""",
     """    // v2 since G30 (the family's unsourced printed fingering withdrawn; its notes unchanged).
    await expect(page.locator('[data-fact="version"]')).toContainText('v2');"""),
    ("""    await expect(page.locator('[data-fact="identity"]')).toContainText('generator latin_groove v1');""",
     """    await expect(page.locator('[data-fact="identity"]')).toContainText('generator latin_groove v2');"""),
]


def main() -> None:
    raw = PATH.read_bytes()
    crlf = b"\r\n" in raw
    text = raw.decode("utf-8").replace("\r\n", "\n")
    done = 0
    for old, new in EDITS:
        if new in text:
            continue
        assert text.count(old) == 1, old
        text = text.replace(old, new)
        done += 1
    out = (text.replace("\n", "\r\n") if crlf else text).encode("utf-8")
    if out != raw:
        PATH.write_bytes(out)
    print(f"{done} of {len(EDITS)} lines updated")


if __name__ == "__main__":
    main()
