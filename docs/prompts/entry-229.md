### Entry 229 — SG05

Judgement: Progress now tells the learner when this device last exported a backup,
or that no export is recorded. The line describes an export boundary and asks the
learner to check the destination; no browser measurement, runtime pass or picture
inspection is claimed here.

Base: `dfda4d71a45b59b982a81072bb76a0b9d3e31245`. Published test-only SHA: `234be9544367e781ea36cb08401a107dee8c3685` (both copied from `git log`).

## Mechanism

- `app/src/data/backup.ts:212–270`: one delivery helper owns file-close, share-resolution,
  download-click and cancellation outcomes. Its completion helper stamps `Date.now()`
  through `updateSettings`, after the relevant boundary. A failed file path may still
  deliver through an existing fallback; only that successful final path stamps.
- `app/src/data/settingsStore.ts:30–32,208–210`: one optional `lastBackupAt` timestamp
  within the existing mirrored settings row. No new database schema, storage key or
  delivery-kind field. Omission from DEFAULT_SETTINGS is deliberate: resetting preferences
  with a defaults patch preserves this historical timestamp rather than clearing it.
- `backup.ts:305–366,386–406`: restoration removes the incoming device's timestamp,
  retains this device's time and preserves it even if replacement omits the settings row.
  Backup metadata `exportedAt` is not read as this device's time.
- `ProgressScreen.ts:624–629,670,721–729`: the line is beside the backup action and refreshes
  when delivery resolves. Settings does not repeat it: no backup is made there.
- `saveBackupFile` was dead within the searched application/test scope at base (no runtime
  caller, no pre-existing test caller). Retained as the existing exported in-memory test
  seam, now covered alongside the production streaming path and delegating to the same
  truthful delivery helper. Production still writes rows directly to the file stream;
  fallback chunks are collected only on the Blob paths.

## Cases and evidence

`backupCompletion.test.ts`: 23 cases (nine delivery cases for each of two APIs; five
reload/restore cases). `progressBackupTime.test.ts`: two real-screen text cases.
`progress.backup-time.spec.ts`: three representative layout/export captures and one
real-screen cancellation case. The test-only commit contains tests only. Runtime outcomes
are unverified; exact red/green requests are in `check-request.md`.

Three designs use the existing Progress data block: upright gets a wrapping full-width
paragraph above the actions; sideways keeps it with those actions without a fixed notice;
tablet keeps it in the content column. Browser attachments show none/exported states and
must be inspected before declaring the layout verified. The existing date localization
is used, without a custom format that could imply UTC.

## Mutants (apply one at a time, discard after checking)

| Mechanism | Exact one-line change | Must fail |
| --- | --- | --- |
| File completion boundary | In deliverBackup, replace `await writable.close();` with `updateSettings({ lastBackupAt: Date.now() }); await writable.close();` | both “stamps only after the writable closes” cases |
| Cancellation outcome | Replace the picker catch's `if (cause instanceof DOMException && cause.name === 'AbortError') return 'cancelled';` with `if (cause instanceof DOMException && cause.name === 'AbortError') return completed('file');` | both “does not stamp a cancelled picker” cases |
| Share boundary | Replace `return completed('share');` with `return 'share';` | both “stamps share only after its promise resolves” cases |
| Stored timestamp | Replace `out.lastBackupAt = v.lastBackupAt;` with `void v.lastBackupAt;` | reload/hydration case and dated Progress case |
| Restore locality | Replace `? restoredSettings(row, deviceBackupAt)` with `? row` | both restore cases and the new-device restore case |

## Learner-facing text

| Where | Before | After | Why |
| --- | --- | --- | --- |
| Progress, Your data, above actions | no line | No backup exported on this device yet. | No local record is not proof no backup ever existed. |
| Same, after export | no line | Last backup exported: <local date/time>. Check where you put it. | One stored timestamp cannot describe the delivery kind; “exported” covers its actual boundary. |
| Export download status | Backup downloaded. | Backup download requested — check where you put it. | Link click cannot prove disk persistence. |
| Export share status | Backup saved — check where you put it. | Backup shared — check where you put it. | Share resolution is distinct from a file write. |
| Cancel status | Backup saved — check where you put it. (picker) / failure (share) | Backup cancelled. | Cancellation is neither completion nor a disk error. |
| Export file status | Backup saved — check where you put it. | unchanged | Writable close is the completion boundary. |

## Reader searches and inspected files

Commands (repository root):

```sh
rg -n 'writeBackup|saveBackupFile' app/src app/tests --glob '*.ts'
rg -n 'PracticeSettings|DEFAULT_SETTINGS|coerceSettings|pianopath.settings|reloadSettings' app/src app/tests/unit --glob '*.ts'
rg -n 'onSettingsChange' app/src --glob '*.ts'
rg -n 'settings|OUT_OF_LINE|exportedAt' app/src/data/backup.ts app/src/data/persist.ts app/src/data/db.ts
```

Return-value readers: `ProgressScreen.ts`; new completion tests. Settings definition,
validation/defaults and restore/export paths: `settingsStore.ts`, `persist.ts`, `db.ts`,
`backup.ts`, `main.ts`. Current settings type/default consumers inspected at their matching
expressions: `SettingsScreen.ts` (defaults spread retains optional history),
`SetupScreen.ts`, `DevMicroscopeScreen.ts`, `TodayScreen.ts`, `ScoreScreen.ts`.
The single settings listener in `curriculum/load.ts` invalidates only on showUsOnlyPd
change, so a stamp does not invalidate catalog state. Existing assertions inspected:
`backup.test.ts`, `backupStreaming.test.ts`, `persist.test.ts`, `settingsRoundTrip.test.ts`,
`progressHistoryLines.test.ts`, `tests/e2e/progress.spec.ts`; no former delivery outcome
assertion was found in the base test source search. UI spec §6 and test map are updated.

## Premise correction and not done

The initial brief placed export in Settings; it is in Progress. A picker AbortError
previously returned file completion; both API paths now distinguish cancellation.
Part 2 contrast measurements/changes belong to the orchestrator and were not attempted.
No reminder, Settings duplication, task records, brief Record, current pointer, CI reads,
merge or working-branch push. Runtime/browser checks and inspection of the six pictures
remain for the orchestrator. Sound/music judgement is not implicated by this lane.

**Orchestrator's note at the landing (2026-10-02).** SG05's worktree committed by name (b6beeb96) and merged (b2a1ec88). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/SG05/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0; sg05-pictures 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/SG05/orchestrator-exit.txt`). Approved before dispatch with one required change (`responses/385c0131.md` §5), dispatched to the outside builder by the owner's paste, merged at `b2a1ec88`.. the known blues.3 lesson-claim case only; lint 1 on the merge (four errors in the builder's files), fixed in b6beeb96 and rerun 0; the six mapped browser specs green, the new one rerun green after the fix
