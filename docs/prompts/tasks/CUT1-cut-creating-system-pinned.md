# CUT1 — a cut's archive is the same bytes on any machine: the creating system pinned as the importer pins it

The finding: CI's content job at `0a570574` failed latin.4's habanera concept claim while the local build established it. The Pages artifact's Bizet cut and the local cut have identical entries and compressed payloads and differ in one zip header byte, the creating system (3 on the runner, 0 here), because `write_cut` pinned the entry dates but not `create_system` (E50a's pin, `convert.ZIP_SYSTEM`, applied to imports only). Every cut's identity therefore differed per machine, so a verified passage fact or a teaching-use decision bound to a cut was stale on the runner and on the deployed build. The fix pins the system; the local cut identities move once to the ones CI already produced. A fix-forward under FABLE §10's fast path (handoff `cut-identity-machine-dependent.md`, amended). Nothing heard.

The harness is `operating-procedure.md` §13 and §14. Never name an AI model in any file.

## Record

lane: CUT1 · closes: — · entry: 255
index: A cut's creating system pinned (`convert.ZIP_SYSTEM`) so the archive is the same bytes on any machine; red first on Windows (0 != 3); the six cuts' identities move once to the runner's; the Bizet passage fact re-bound by `--verify`; the cut's teaching-use decision re-issue asked of the reviewer (`CUT1-cut-creating-system-pinned.md`) | content tools | landed 2026-10-06 (`CUT1-cut-creating-system-pinned.md`); Entry 255
in-flight: landed 2026-10-06 (`CUT1-cut-creating-system-pinned.md`): CI's content job can establish latin.4's habanera claim again; the phone build admits the cut once the decision is re-issued on the new identity (Entry 255)
state: landed 2026-10-06: in Entry 255's record commit under the fast path; the decision re-issue waits on the reviewer (Entry 255)
