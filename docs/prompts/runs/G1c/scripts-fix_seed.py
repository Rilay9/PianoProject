"""
G1c: the browser seed read the first option of each list and wrote one run per requirement; the built
technique.8 asks for two exercises (the probe, `probe-seed.txt`: *What the app counts — 0 of 1 ...
(1 of 2)*), so Stage 8 read *0 of 4*. The seed now writes as many runs as each `runs` requirement
counts, from its own pool, and refuses a rung whose requirements runs alone cannot meet. Applied to
the browser case in app/tests/e2e/plan.spec.ts (CRLF kept) and the pictures spec's copy under
docs/prompts/runs/G1c/. Idempotent by its marker. Run from the repository root.
"""
from pathlib import Path

MARKER = "const runsFor = (rung: string): string[] =>"

OLD = """      type Rung = { id: string; exerciseOptions: string[]; songOptions: string[] };
      const curriculum = (await (await fetch('content/curriculum.json')).json()) as { stages: { units: { lessons: Rung[] }[] }[] };
      const rungs = new Map(curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).map((l) => [l.id, l]));
      const first = (rung: string, from: 'exercises' | 'songs'): string => {
        const found = rungs.get(rung);
        const id = (from === 'songs' ? found?.songOptions : found?.exerciseOptions)?.[0];
        if (id === undefined) throw new Error(`${rung} lists no ${from}`);
        return id;
      };
      const at = new Date().toISOString();
      const runs = ([['classical.9', 'exercises'], ['classical.9', 'songs'], ['technique.8', 'exercises']] as const).map(([rung, from]) => ({
        itemId: first(rung, from),
        lessonId: rung,
"""
NEW = """      type Requirement = { kind: string; from?: string; count?: number; performance?: boolean };
      type Rung = { id: string; exerciseOptions: string[]; songOptions: string[]; requirements?: Requirement[] };
      const curriculum = (await (await fetch('content/curriculum.json')).json()) as { stages: { units: { lessons: Rung[] }[] }[] };
      const rungs = new Map(curriculum.stages.flatMap((s) => s.units.flatMap((u) => u.lessons)).map((l) => [l.id, l]));
      // As many options as each `runs` requirement counts, from its own pool; a rung runs alone
      // cannot meet is refused rather than seeded short.
      const runsFor = (rung: string): string[] => {
        const found = rungs.get(rung);
        const asks = found?.requirements ?? [];
        if (!found || asks.length === 0 || asks.some((ask) => ask.kind !== 'runs' || ask.performance === true)) {
          throw new Error(`${rung} is not met by plain runs`);
        }
        const ids = new Set<string>();
        for (const ask of asks) {
          const pool = ask.from === 'songs' ? found.songOptions : ask.from === 'exercises' ? found.exerciseOptions : [...found.exerciseOptions, ...found.songOptions];
          const picked = pool.slice(0, ask.count ?? 1);
          if (picked.length < (ask.count ?? 1)) throw new Error(`${rung} lists too few ${ask.from ?? 'options'}`);
          for (const id of picked) ids.add(id);
        }
        return [...ids];
      };
      const at = new Date().toISOString();
      const runs = ['classical.9', 'technique.8'].flatMap((rung) => runsFor(rung).map((itemId) => [rung, itemId] as const)).map(([rung, itemId]) => ({
        itemId,
        lessonId: rung,
"""


def fix(path: str, indent_shift: int) -> None:
    p = Path(path)
    raw = p.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    if MARKER in text:
        print(f"{path}: already fixed")
        return
    old = OLD if indent_shift == 0 else "\n".join(line[indent_shift:] if line else line for line in OLD.split("\n"))
    new = NEW if indent_shift == 0 else "\n".join(line[indent_shift:] if line else line for line in NEW.split("\n"))
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one seed block, found {count}")
    text = text.replace(old, new)
    p.write_bytes((text.replace("\n", "\r\n") if crlf else text).encode("utf-8"))
    print(f"{path}: fixed")


fix("app/tests/e2e/plan.spec.ts", 0)
fix("docs/prompts/runs/G1c/scripts-zz-g1c-pictures.spec.ts", 2)
