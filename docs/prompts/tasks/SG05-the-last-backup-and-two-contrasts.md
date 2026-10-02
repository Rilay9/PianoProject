# SG05 — the learner sees when they last backed up, and two light-theme texts reach 4.5:1 (two small builds; E8, with U62 from SG06)

Labels: **VERIFIED**, **SETTLED**, **HYPOTHESIS**, **OPEN**, **OUT OF SCOPE**, as in `CL11-what-counts-as-evidence-traced-and-decided.md`.

These are two small, independent parts on disjoint files. Build them in either order, or as two lanes.

## Part 1, E8: when did I last back up?

**What a learner meets.** The app keeps everything on the device. Settings offers a backup but never says when the last one was made, so the learner cannot tell whether their history is safe.

**VERIFIED at `385c0131`:**
- `app/src` holds no record of a backup's time: a search for `lastBackup`, `last backup`, `backedUpAt` and `lastExport` finds nothing (that is the scope of the search).
- `backup.ts` exports `exportAll`, `streamBackup` and `writeBackup` (:85, :142, :201).
- The folder fallback chain exists (`folderLibrary.ts`, per E8's convergence row).

**The change:**
- Record the time of a **completed** backup, and only a completed one.
- Settings shows it, or says no backup has been made.

**OPEN:**
- the words;
- whether a reminder appears and where. One quiet line, never a nag; the owner's rule is *show what the moment needs*.

**A stored field, named here:** one timestamp, in the settings store. It is the only new stored field this part may add.

**Done when:**
- Unit cases, red first:
  - the time is written on a completed write;
  - it is not written on a cancelled or failed one;
  - it survives a reload;
  - a backup restored from file does not overwrite it with the file's own age, or the part says why it should.
- Settings shows the line in three designs (`04` §0 R7), pictured.
- The words are itemised.

## Part 2, U62: two texts below 4.5:1

**What a learner meets.** On the light theme, two texts were measured at 4.3:1 by the states gallery on 2026-09-26:
- the Wait status line, `#score-waiting`;
- the help strip's more link, `#score-help-more`.

U63 has changed `style.css` since.

**HYPOTHESIS:** both still measure below 4.5:1. **The test that refutes it, run first:** the gallery's contrast audit (`app/tests/states/audit.ts`) on the light and dark themes. If both pass, close U62 with that measurement and change nothing.

**The change, if they fail:**
- Change the colours through the theme tokens, never as one-off values, on both themes.
- Show that the tokens' other readers do not fall below 4.5:1.

**Done when:**
- the audit's lines show both texts at 4.5:1 or more on both themes;
- each token change is listed with its readers.

## Both parts

- **Records:** `docs/08-test-map.md`, and `docs/04-ui-spec.md` where Settings is specified.
- **Mutants:** one per mechanism.
- **Stop and hand back if** the backup time needs more than one stored field, or a token change moves another text below 4.5:1.

**Scope:**
- `app/src/data/backup.ts`, `app/src/data/settingsStore.ts`, `app/src/ui/screens/SettingsScreen.ts`;
- `app/src/style.css` (the two texts' tokens), `app/tests/states/audit.ts`;
- their tests;
- `docs/04-ui-spec.md`, `docs/08-test-map.md`;
- `docs/prompts/runs/SG05/`.

The harness is `operating-procedure.md` §14. Never name an AI model in any file.

## Record

lane: SG05 · closes: E8, U62 · entry: 229
index: The learner sees when they last backed up, and two light-theme texts reach 4.5:1 (`SG05-the-last-backup-and-two-contrasts.md`) | app | drafted 2026-10-02 (`SG05-the-last-backup-and-two-contrasts.md`); Entry 229
in-flight: drafted 2026-10-02 (`SG05-the-last-backup-and-two-contrasts.md`): two small parts on disjoint files; the time of a completed backup shown in Settings, and the Wait line and the help strip's link re-measured, then fixed through the tokens if still below 4.5:1 (Entry 229)
state: with-reviewer 2026-10-02: in the batch review of five briefs before dispatch (Entry 229)
