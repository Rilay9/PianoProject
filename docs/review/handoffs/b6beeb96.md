# Reviewer handoff — SG05: the learner sees when they last backed up: the time of a completed backup on Progress, truthful per delivery path (Part 1; U62's contrasts stay open as SG06) (Entry 229)

Implementation HEAD: b6beeb96 (merged at b2a1ec88; the entry and this handoff in the record commit at HEAD). Respond in `responses/b6beeb96.md`. Approved before dispatch with one required change (`responses/385c0131.md` §5), dispatched to the outside builder by the owner's paste, merged at `b2a1ec88`.; the brief reviewed before dispatch.

## What is asked

Confirmation of Part 1, with the words stated in the handoff below.

**What a learner meets.** Under *Your data* on Progress: *Last backup exported: Oct 2, 2026, 7:04 PM.* or *No backup exported on this device yet.* Cancelling the save keeps the old time and says *Backup cancelled.* Pictures in `docs/prompts/pictures/sg05/`.

**Learner-facing text, itemised (Progress, *Your data*):**
- new standing line: *Last backup exported: <date and time>.* / *No backup exported on this device yet.*; why: E8, the learner could not tell whether their history was safe;
- status after the action, before: *Backup downloaded.* or *Backup saved — check where you put it.*; after: *Backup cancelled.* / *Backup download requested — check where you put it.* / *Backup shared — check where you put it.* / *Backup saved — check where you put it.*; why: your required change, a download proves only the handoff and a cancel is not a save.

**Built by the outside builder, checked here:** its first build of this lane; red first and green as requested; the orchestrator fixed four lint errors and shortened the standing line at landing. U62 (Part 2) stays open as SG06.

## Files to inspect

`app/src/data/backup.ts`, `settingsStore.ts`; `app/src/ui/screens/ProgressScreen.ts`; `app/tests/unit/backupCompletion.test.ts` (new), `progressBackupTime.test.ts` (new); `app/tests/e2e/progress.backup-time.spec.ts` (new); `docs/04-ui-spec.md`, `docs/08-test-map.md`; `docs/prompts/runs/SG05/`; `docs/prompts/pictures/sg05/`.

## Not done, with the reason

See the entry's Not done lines.

## Do not re-review

The brief and its required change (approved, `responses/385c0131.md`).
