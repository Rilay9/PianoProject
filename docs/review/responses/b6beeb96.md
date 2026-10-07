# SG05 Part 1 review — implementation b6beeb96

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

The implementation truthfully records this device's last completed export boundary and presents it where the learner performs the backup. Cancellation preserves the previous fact, restore cannot adopt another device's timestamp, and the download copy says only that the browser handoff was requested.

## Required change — publish the evidence named by the handoff

Before closing SG05 Part 1, publish and read back the check result and the six three-layout pictures that the handoff says exist. At `b6beeb96`, `docs/prompts/runs/SG05/` contains only `ENTRY.md` and `check-request.md`, and `docs/prompts/pictures/sg05/` does not exist. Therefore the claimed red-first/green check and the phone-upright, phone-sideways and tablet none/exported states are not inspectable at the immutable review head.

Acceptance:

- record the test-only result at `234be9544367e781ea36cb08401a107dee8c3685` and the landed-head result, naming commands, exits and case counts;
- publish the none/exported captures for phone upright, phone sideways and tablet;
- inspect—not merely generate—the captures for readable text, containment and action placement, recording any deviation;
- if the evidence reveals a defect, fix forward and hand that exact implementation head back; otherwise an evidence-only follow-up may close this requirement.

This is one evidence-completion requirement. It does not require another product or storage mechanism.

## Evidence and scope

- `backup.ts:212–270` owns the delivery boundary. File completion stamps only after the writable closes; share completion stamps only after its promise resolves; picker/share `AbortError` returns `cancelled`; download stamps after the link click and is described as a requested download.
- Both `writeBackup` and the retained `saveBackupFile` seam use the same helper. Failed picker writes may fall through to another delivery path, but only a successful final path stamps.
- `settingsStore.ts` adds one optional, validated timestamp to the existing device settings row. It is operational history, not a practice preference.
- `importAll` captures the device timestamp before replacement, strips the incoming timestamp, restores the local value when present, and leaves it absent on a genuinely new device. Backup `exportedAt` is not promoted to this fact.
- `ProgressScreen.ts:715–734` distinguishes cancelled, download-requested, shared and saved outcomes and refreshes the standing line after resolution.
- `backupCompletion.test.ts` covers both streaming and in-memory delivery paths, delayed close/share resolution, cancellation, failure/fallback, reload and merge/replace restore. `progressBackupTime.test.ts` checks the two standing texts. The browser spec defines the three requested layouts plus picker cancellation, but source code for a spec is not evidence that it ran or that its pictures were inspected.

The learner-facing wording is accepted. “Last backup exported” describes the app's observable boundary without promising durable storage, while each immediate status gives the more specific delivery path. Settings does not need the line because backup is performed on Progress. U62's contrast work remains separate as SG06.
