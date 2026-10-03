"""
G1c: add the evidence-only case (soft assertions, so the committed screen's every claim shows in the
red line) to app/tests/unit/planProjectStage.test.ts. Idempotent by its title. Run from the
repository root.
"""
from pathlib import Path

P = Path("app/tests/unit/planProjectStage.test.ts")
TITLE = "with the evidence alone meeting one Stage 9 rung"
ANCHOR = "  it('with every Stage 9 rung met, the stage wears no complete and says no count', async () => {"
NEW = """  it('with the evidence alone meeting one Stage 9 rung: no "1 of N", no bar and no complete on its row (the brief\\u2019s red)', async () => {
    state.runs = bothRuns('classical.9');
    const states = await loadRungStates(CURRICULUM, new Date('2026-10-02T10:00:00.000Z'));
    expect(states.byRung.get('classical.9')?.status).toBe('met');
    const section = await mount();
    openStage(section, 9);
    // Soft, so the committed screen's every claim is in the red line, not only the first.
    expect.soft(metaOf(head(section, 9))).toBe('A project: there is no rung to pass here.');
    expect.soft(head(section, 9).querySelector('.plan-stage-bar'), 'the project stage draws a completion bar').toBeNull();
    expect.soft(badgesOf(section.querySelector('[data-lesson="classical.9"]')), 'the met Stage 9 rung wears the evidence\\u2019s word').toEqual([]);
  });

"""

s = P.read_text(encoding="utf-8")
if TITLE in s:
    print("already added")
else:
    assert s.count(ANCHOR) == 1
    s = s.replace(ANCHOR, NEW.replace("\\u2019", "’") + ANCHOR)
    P.write_text(s, encoding="utf-8", newline="\n")
    print("added")
