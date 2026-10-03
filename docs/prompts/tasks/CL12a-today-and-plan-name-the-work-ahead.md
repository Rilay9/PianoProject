# CL12a — Today and Plan name the same work ahead, each row says what it is for, and a bypassed lesson is never owed (slice A of CL12; L93)

Labels: **VERIFIED**, **SETTLED**, **HYPOTHESIS**, **OPEN**, **OUT OF SCOPE**, as in `CL11-what-counts-as-evidence-traced-and-decided.md`.

**SETTLED, the design** (`docs/design/composed-day.md`, approved in `responses/ed6d7f46.md`). Read these parts:
- *One purpose model*;
- *Ownership, durability and compatibility*;
- *Slice A*, which is this brief's acceptance boundary;
- *Learner-facing text inventory*, with the landing decision's labels;
- *Three surface designs*;
- *Decisions at landing*.

**VERIFIED** (`runs/CL12/checks-dff16046.txt`; `responses/ed6d7f46.md`):
- `nextRecommended` (`session.ts:347–400`) returns a behind or set-aside rung once nothing remains ahead. In the probe's synthetic exhaustion runs, all five diary learners were sent to 0.1.
- `strandsOf` (`:665–714`) already excludes bypassed work, but it omits blocked strands.

## Build slice A only

Build this:
- the typed `intent` (`curriculum/sessionPurpose.ts`), snapshotted with newly composed activities, optional and validated in the stored session, absent on legacy sessions;
- `nextRecommended` with no behind or set-aside fallback;
- one forward-strand summary that Today's header and Plan both read: ahead, blocked ahead, or no further authored lesson, with no claim that every lesson was passed;
- the row labels *Review / Apply / Learn / Explore / Project*, one mapping across every consumer. A no-due offer carries its actual label, never *Review* inherited from the slot kind; where the purpose cannot be established, keep the existing honest reason.

**SETTLED, from the review:**
- the blocked-ahead state is kept, not dropped by exporting `strandsOf`'s open strands as the whole summary;
- no Score chrome and no detour UI;
- L96's selection and X19's routing belong to later slices.

## Done when

- **Red first**, every case at `composed-day.md`'s Slice A list:
  - multi-track agreement;
  - blocked ahead work;
  - invalid placement;
  - exhaustion;
  - set-aside;
  - a legacy session resumed without intent;
  - a stale intent dropped on swap or repurpose;
  - the diary replay of the five learners and both exhaustion scenarios: the six automatic returns gone, reading recipes and rung progress intact.
- **Browser:** Today and Plan agree after placement, exhaustion, set-aside, a track toggle and a measured retrieval from older material. Three designs at 115 % text, with whole lesson names and whole actions. The orchestrator captures and looks at the pictures.
- **Learner-facing text itemised:** where, before, after, why.
- **Docs:** `docs/02-curriculum.md`, `docs/04-ui-spec.md`, `docs/08-test-map.md`, with a new browser spec added to its helpers' reader lists in `docs/prompts/checks.json`.

## Stop and hand back if

- **A purpose cannot be established without new pedagogy:** keep the existing reason and name the case.
- **The shared reader would change strict-lock behaviour:** narrow it; do not relax the setting.
- **Anything needs a stored change** beyond the optional, validated `intent`.

**Scope:**
- `app/src/curriculum/session.ts`, `sessionPurpose.ts` (new);
- `app/src/data/sessionRun.ts`;
- `app/src/ui/screens/TodayScreen.ts`, `PlanScreen.ts`;
- `app/src/ui/help.ts`;
- their tests, and the docs above;
- `docs/prompts/runs/CL12a/`.

The harness is `operating-procedure.md` §14. Never name an AI model in any file.

## Record

lane: CL12a · closes: L93 · entry: 230
index: Today and Plan name the same work ahead, each row says what it is for, and a bypassed lesson is never owed: CL12's slice A (`CL12a-today-and-plan-name-the-work-ahead.md`) | app | drafted 2026-10-03 (`CL12a-today-and-plan-name-the-work-ahead.md`); Entry 230
in-flight: drafted 2026-10-03 (`CL12a-today-and-plan-name-the-work-ahead.md`): slice A of the approved CL12 design; the typed intent, no behind or set-aside fallback, one forward-strand summary for Today and Plan, the five labels (Entry 230)
state: approved 2026-10-03: slice A of the approved design, dispatchable without another brief review (Entry 230)
- dispatched 2026-10-03: to the outside builder by the owner's paste, on its branch; its first checkpoint's handback decided (option 1: an ambiguous no-due row keeps its reason and shows no purpose label), in the checks file of 23606e0a
