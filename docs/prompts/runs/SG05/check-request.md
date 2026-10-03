# SG05 Part 1 — checks requested, no runtime result claimed

All SHAs below were copied from fetched `git log`. The request itself is a later
document-only commit; the code/tests to check are exactly the implementation SHA.

## Test-only red

SHA: `234be9544367e781ea36cb08401a107dee8c3685`. From `app/`:

```sh
npx vitest run tests/unit/backupCompletion.test.ts tests/unit/progressBackupTime.test.ts
npx playwright test --config playwright.config.ts tests/e2e/progress.backup-time.spec.ts --workers=1
```

The base cannot pass these new cases (exact case titles in each delivery API's describe):

- `stamps only after the writable closes, at completion rather than start`
- `does not stamp a cancelled picker or start another delivery`
- `a failed write followed by a failed fallback does not stamp`
- `a failed close followed by a failed fallback does not stamp`
- `a failed file write can stamp a successful download fallback`
- `stamps share only after its promise resolves`
- `a cancelled share preserves the previous time`
- `stamps a download handoff after the link click`
- `does not stamp a failed download handoff`

These nine titles run for both `streaming delivery completion` and `in-memory delivery completion`.
Also expected red:

- `survives a reload and hydration with the local mirror cleared`
- `restore (replace=false) keeps the device time, not the file time`
- `restore (replace=true) keeps the device time, not the file time`
- `a replace with no practice-settings row still keeps the local timestamp`
- both cases in `progressBackupTime.test.ts`
- the three device describes' `the backup action shows its last export boundary`
- `cancelling the picker leaves the previous time and says cancelled`

`restoring to a new device never adopts another device timestamp` may already be green:
the base drops the unknown field; its role is to prevent the new coercer adopting it.
Do not present this expectation as an observed result.

## Implementation green

SHA: `ddfaea710e498a8bbfbc5812c9d8c88ec21be065`. From `app/`:

```sh
npx vitest run tests/unit/backupCompletion.test.ts tests/unit/progressBackupTime.test.ts tests/unit/backup.test.ts tests/unit/backupStreaming.test.ts tests/unit/persist.test.ts tests/unit/settingsRoundTrip.test.ts
npx tsc -b
npx playwright test --config playwright.config.ts tests/e2e/progress.backup-time.spec.ts tests/e2e/progress.spec.ts --workers=1
```

Expected green: every case in these files, including the previously-green new-device case.
The unit delivery file has 23 cases, the Progress text file two, and the new browser
file four. These are static case counts, not a test result. Existing backup, streaming,
persistence, settings and browser round-trip cases protect current consumers.

Browser content/build prerequisites and the lane's owned port/config follow the existing
builder harness. The supplied command names only tracked config and test paths; adapt
that config to the owned lane port rather than sharing another running suite's server.

Inspect and publish the six image attachments from `progress.backup-time.spec.ts`:
phone-upright-none/exported, phone-sideways-none/exported, tablet-none/exported. Check
that the date reads in its quiet data-block line, wraps without clipped text, and keeps
the action controls reachable. Viewport fixtures are representative cells, not universal
screen measurements. If a picture refutes a design, report it before landing.

## Mutants

At the implementation SHA, apply one at a time, run the named discriminating file/case,
then discard the mutation. These are requests, not observed mutation kills.

| Mechanism | Exact one-line change | Must fail |
| --- | --- | --- |
| File completion boundary | In deliverBackup, replace `await writable.close();` with `updateSettings({ lastBackupAt: Date.now() }); await writable.close();` | both “stamps only after the writable closes” cases |
| Cancellation outcome | Replace the picker catch's `if (cause instanceof DOMException && cause.name === 'AbortError') return 'cancelled';` with `if (cause instanceof DOMException && cause.name === 'AbortError') return completed('file');` | both “does not stamp a cancelled picker” cases |
| Share boundary | Replace `return completed('share');` with `return 'share';` | both “stamps share only after its promise resolves” cases |
| Stored timestamp | Replace `out.lastBackupAt = v.lastBackupAt;` with `void v.lastBackupAt;` | reload/hydration case and dated Progress case |
| Restore locality | Replace `? restoredSettings(row, deviceBackupAt)` with `? row` | both restore cases and the new-device restore case |


Publish `docs/prompts/runs/SG05/checks-<checked-head8>.txt` on the working branch with
exact SHA, command, results and failures, plus the browser pictures. Part 2 was untouched.
This branch stops after publication; there is no CI wait or polling request.
