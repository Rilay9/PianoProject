"""A probe for Follow-up 1, not a test for the commit: what a MusicXML import filed through the Library's
picker (no sheet opens for a file whose staves and signature are its own) says under its level in Details.

Copies app/tests/unit/libraryImportWords.test.ts (for its mocks and helpers) to a temporary
app/tests/unit/zz-g96a-probe.test.ts with one probe appended, runs only the probe, deletes the copy, and
writes docs/prompts/runs/G96a/probe-musicxml-no-level.txt.
"""
import pathlib
import re
import subprocess
import sys

W = pathlib.Path(__file__).resolve().parents[4]
BASE = W / "app" / "tests" / "unit" / "libraryImportWords.test.ts"
PROBE = W / "app" / "tests" / "unit" / "zz-g96a-probe.test.ts"
OUT = W / "docs" / "prompts" / "runs" / "G96a" / "probe-musicxml-no-level.txt"

APPENDED = r"""
describe('g96a probe', () => {
  it('g96a probe: a MusicXML import filed through the picker, its Details under the level', async () => {
    const section = await mount();
    pick(section, [fakeFile('test-tune.musicxml', readFileSync(join(FIXTURES, 'test-tune.musicxml'), 'utf8'))]);
    const row = await vi.waitFor(() => {
      const found = section.querySelector('.list-row[data-kind="musicxml"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    expect(document.querySelector('.sheet')).toBeNull();
    ([...row.querySelectorAll('button')].find((button) => button.textContent === 'Details') as HTMLButtonElement).click();
    const sheet = document.getElementById('library-detail') as HTMLElement;
    const level = [...sheet.querySelectorAll('dt')].find((one) => one.textContent === 'Level')?.nextElementSibling?.textContent;
    const said = [...sheet.querySelectorAll('.sheet__body > p')].map((p) => p.textContent);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(join(process.cwd(), '..', 'build', 'g96a', 'probe.txt'), `PROBE level=${String(level)} paragraphs=${JSON.stringify(said)}`);
  });
});
"""


def main() -> int:
    PROBE.write_text(BASE.read_text(encoding="utf-8") + APPENDED, encoding="utf-8")
    try:
        npx = "npx.cmd" if sys.platform == "win32" else "npx"
        done = subprocess.run(
            [npx, "vitest", "run", "tests/unit/zz-g96a-probe.test.ts", "-t", "g96a probe"],
            cwd=W / "app", capture_output=True, text=True, encoding="utf-8", errors="replace",
        )
    finally:
        PROBE.unlink()
    text = re.sub(r"\x1b\[[0-9;]*m", "", done.stdout + done.stderr)
    said = W / "build" / "g96a" / "probe.txt"
    kept = [said.read_text(encoding="utf-8") if said.exists() else "PROBE wrote nothing"]
    kept += [line for line in text.splitlines() if line.strip().startswith("Tests ")]
    OUT.write_text("\n".join(kept + [f"exit={done.returncode}", f"probe copy removed: {not PROBE.exists()}", ""]), encoding="utf-8")
    sys.stdout.buffer.write(OUT.read_bytes())
    return 0


if __name__ == "__main__":
    sys.exit(main())
