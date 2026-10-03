"""
G1c: the source change, as text splices (each file keeps its CRLF line endings). Idempotent: each
splice checks its own marker and says whether it applied. Run from the repository root.

  session.ts   - drops its own PROJECT_STAGES, imports projectStore's (item 1).
  PlanScreen   - a project stage's line counts nothing and says what the stage is, draws no bar and
                 wears no badge; its rows wear no rung's word; the legend counts only the fills a
                 stage draws (items 2, 3).
Run with `--session-only` to apply session.ts's splice alone (the guard's red is taken between).
"""
import sys
from pathlib import Path


def splice(path: str, edits: list[tuple[str, str, str]]) -> None:
    p = Path(path)
    raw = p.read_bytes().decode("utf-8")
    crlf = "\r\n" in raw
    text = raw.replace("\r\n", "\n")
    for marker, old, new in edits:
        if marker in text:
            print(f"{path}: already applied: {marker[:60]!r}")
            continue
        count = text.count(old)
        if count != 1:
            raise SystemExit(f"{path}: expected one match for {old[:60]!r}, found {count}")
        text = text.replace(old, new)
        print(f"{path}: applied: {marker[:60]!r}")
    out = text.replace("\n", "\r\n") if crlf else text
    p.write_bytes(out.encode("utf-8"))


SESSION = [
    (
        "import { PROJECT_STAGES } from '../data/projectStore';",
        "import { contactIn, dayKey, daysBetween, type Contact, type ContactHistory, type LearnedPiece } from '../data/progressStore';\n",
        "import { contactIn, dayKey, daysBetween, type Contact, type ContactHistory, type LearnedPiece } from '../data/progressStore';\n"
        "// The stages whose rungs are projects, not rungs to meet (Stage 9: \"Nothing here is a rung to pass;\n"
        "// they are pieces to live with\"): no slot advances into one as \"the next lesson\", and its asks are\n"
        "// offered as a project. The one constant the lesson page and Plan read too (G1c item 1; G84). The\n"
        "// stage numbers only: nothing here reads a project.\n"
        "import { PROJECT_STAGES } from '../data/projectStore';\n",
    ),
    (
        "  stage: number;\n}\n\n/**\n * One line of study",
        "  stage: number;\n}\n\n"
        "/**\n"
        " * The stages whose rungs are projects, not rungs to meet: Stage 9 says of\n"
        " * itself \"Nothing here is a rung to pass; they are pieces to live with\"\n"
        " * (`content/curriculum/stage-9.json`). No slot advances into one as \"the next\n"
        " * lesson\", and its asks are offered as a project. By number, because the\n"
        " * curriculum does not mark the stage (a report item for the curriculum).\n"
        " */\n"
        "const PROJECT_STAGES: ReadonlySet<number> = new Set([9]);\n\n"
        "/**\n * One line of study",
        "  stage: number;\n}\n\n/**\n * One line of study",
    ),
]

PLAN = [
    (
        "import { PROJECT_STAGES } from '../../data/projectStore';",
        "import { RUNG_TEXT, rungBadge, stageCountWords } from '../help';\n",
        "import { PROJECT_TEXT, RUNG_TEXT, rungBadge, stageCountWords } from '../help';\n"
        "import { PROJECT_STAGES } from '../../data/projectStore';\n",
    ),
    (
        "function isProjectStage(stage: Stage): boolean",
        "/**\n * How much of a stage is done — counting only what is on screen.\n",
        "/**\n"
        " * Whether a stage's units are projects, not rungs to pass (G1c; G83, L86): Stage 9 says of itself\n"
        " * \"Nothing here is a rung to pass; they are pieces to live with\". The lesson page's own constant\n"
        " * (`projectStore.PROJECT_STAGES`), so Plan and the page read one fact.\n"
        " *\n"
        " * The units keep their rung state in the data and the evidence (G1b's ruling); Plan stops\n"
        " * presenting it. The stage's line counts nothing — no *x of y*, no *by your word*, no *done\n"
        " * before* — and says what the stage is in its page's words (`PROJECT_TEXT.stageNine`); it draws\n"
        " * no bar (a bar is a count drawn, and an empty one says \"none of it done yet\") and wears no\n"
        " * *complete*; and no row wears a rung's word. A unit there lists several pieces (six, four, or\n"
        " * none), so one row cannot wear their several project states either: it wears nothing, and the\n"
        " * page it opens shows each piece's.\n"
        " */\n"
        "function isProjectStage(stage: Stage): boolean {\n"
        "  return PROJECT_STAGES.has(stage.number);\n"
        "}\n\n"
        "/**\n * How much of a stage is done — counting only what is on screen.\n",
    ),
    (
        "function lessonRow(lesson: Lesson, options: { next: boolean; project: boolean })",
        "  function lessonRow(lesson: Lesson, options: { next: boolean }): HTMLElement {\n",
        "  function lessonRow(lesson: Lesson, options: { next: boolean; project: boolean }): HTMLElement {\n",
    ),
    (
        "    // learner's word or the carry-over, each named apart. A rung not started\n    // wears nothing, as before. A project stage's row wears none of them",
        "    // learner's word or the carry-over, each named apart. A rung not started\n"
        "    // wears nothing, as before.\n"
        "    const state = states?.byRung.get(lesson.id);\n"
        "    const word = state ? rungBadge(state) : RUNG_TEXT.notStarted;\n"
        "    const badges: HTMLElement[] =\n"
        "      state?.status === 'met'\n"
        "        ? [badge(word, 'passed')]\n"
        "        : word === RUNG_TEXT.notStarted\n"
        "          ? []\n"
        "          : [badge(word)];\n",
        "    // learner's word or the carry-over, each named apart. A rung not started\n"
        "    // wears nothing, as before. A project stage's row wears none of them\n"
        "    // (G1c, `isProjectStage`): its page says there is no rung to pass.\n"
        "    const state = states?.byRung.get(lesson.id);\n"
        "    const word = state ? rungBadge(state) : RUNG_TEXT.notStarted;\n"
        "    const badges: HTMLElement[] =\n"
        "      options.project\n"
        "        ? []\n"
        "        : state?.status === 'met'\n"
        "          ? [badge(word, 'passed')]\n"
        "          : word === RUNG_TEXT.notStarted\n"
        "            ? []\n"
        "            : [badge(word)];\n",
    ),
    (
        "    // from before C5 in a fill of their own, never the measured one. A project\n",
        "    // The two fills of a stage's bar, named once (C5): the rungs carried over\n"
        "    // from before C5 in a fill of their own, never the measured one.\n"
        "    const anyCarried = curriculum.stages.some((stage) => completion(stage, states, activeTracks).before > 0);\n",
        "    // The two fills of a stage's bar, named once (C5): the rungs carried over\n"
        "    // from before C5 in a fill of their own, never the measured one. A project\n"
        "    // stage draws no bar (G1c), so its carried rungs name no fill here.\n"
        "    const anyCarried = curriculum.stages.some(\n"
        "      (stage) => !isProjectStage(stage) && completion(stage, states, activeTracks).before > 0,\n"
        "    );\n",
    ),
    (
        "      const project = isProjectStage(stage);\n",
        "    for (const stage of curriculum.stages) {\n"
        "      const { done, total, byWord, before } = completion(stage, states, activeTracks);\n",
        "    for (const stage of curriculum.stages) {\n"
        "      const project = isProjectStage(stage);\n"
        "      const { done, total, byWord, before } = completion(stage, states, activeTracks);\n",
    ),
    (
        "        // A project stage's line counts nothing (G1c, `isProjectStage`)",
        "        meta: `${stageCountWords({ done, total, byWord, before })}${\n"
        "          stage.approxDuration ? ` · ${stage.approxDuration}` : ''\n"
        "        }`,\n"
        "        badges: done === total && total > 0 ? [badge('complete', 'passed')] : [],\n",
        "        //\n"
        "        // A project stage's line counts nothing (G1c, `isProjectStage`): it\n"
        "        // says what the stage is, in the words its page says it. Its duration\n"
        "        // (\"open-ended\") has no room beside that sentence in the detail line's\n"
        "        // characters, and the summary under the open stage says it: \"for as long\n"
        "        // as it takes\".\n"
        "        meta: project\n"
        "          ? PROJECT_TEXT.stageNine\n"
        "          : `${stageCountWords({ done, total, byWord, before })}${\n"
        "              stage.approxDuration ? ` · ${stage.approxDuration}` : ''\n"
        "            }`,\n"
        "        badges: !project && done === total && total > 0 ? [badge('complete', 'passed')] : [],\n",
    ),
    (
        "      // else. The legend above the list names the two. A project stage draws\n",
        "      // else. The legend above the list names the two.\n"
        "      const share = (n: number): string => `${String(total > 0 ? Math.round((n / total) * 100) : 0)}%`;\n"
        "      const bar = el('span.plan-stage-bar', { 'aria-hidden': 'true' });\n"
        "      if (before > 0) {\n"
        "        const carriedPart = el('span.plan-stage-bar__carried');\n"
        "        carriedPart.style.width = share(before);\n"
        "        bar.append(carriedPart);\n"
        "      }\n"
        "      const fill = el('span.plan-stage-bar__fill');\n"
        "      fill.style.width = share(done);\n"
        "      bar.append(fill);\n"
        "      head.append(bar);\n",
        "      // else. The legend above the list names the two. A project stage draws\n"
        "      // none (G1c): there is nothing in it to be through.\n"
        "      if (!project) {\n"
        "        const share = (n: number): string => `${String(total > 0 ? Math.round((n / total) * 100) : 0)}%`;\n"
        "        const bar = el('span.plan-stage-bar', { 'aria-hidden': 'true' });\n"
        "        if (before > 0) {\n"
        "          const carriedPart = el('span.plan-stage-bar__carried');\n"
        "          carriedPart.style.width = share(before);\n"
        "          bar.append(carriedPart);\n"
        "        }\n"
        "        const fill = el('span.plan-stage-bar__fill');\n"
        "        fill.style.width = share(done);\n"
        "        bar.append(fill);\n"
        "        head.append(bar);\n"
        "      }\n",
    ),
    (
        "lessonRow(lesson, { next: recommended?.lesson.id === lesson.id, project })",
        "            list.append(lessonRow(lesson, { next: recommended?.lesson.id === lesson.id }));\n",
        "            list.append(lessonRow(lesson, { next: recommended?.lesson.id === lesson.id, project }));\n",
    ),
]

splice("app/src/curriculum/session.ts", SESSION)
if "--session-only" not in sys.argv:
    splice("app/src/ui/screens/PlanScreen.ts", PLAN)
