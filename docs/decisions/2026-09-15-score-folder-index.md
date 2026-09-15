# The score folder: what the platform offers in 2026, and the index that fits it

2026-09-15. Looked up rather than argued about, because the two earlier records disagreed
(`2026-09-06-p14-folder-library.md` said Chrome for Android has no directory picker;
`handoff-2026-09-09.md` §5ac said it has one from Chrome 132) and the owner asked for the
standard answer, not another guess.

## What is true, with the source

1. **Chrome for Android has `showDirectoryPicker()` from Chrome 132.** Chromium's intent to
   ship for "File System Access on Android and WebView" records the feature enabled in M132,
   with all three pickers, through Android's own intents. It also records the caveats: opening
   a very large folder made the browser unresponsive in testing; Android content URIs have no
   atomic write or rename, so some operations are copies. MDN's compatibility table still
   lists Android as unsupported, which is what the September 6 record read. The intent thread
   is the primary source; the table is behind it.
2. **Permission persists for an installed PWA, from Chrome 122.** Chrome's own write-up:
   handles stored in IndexedDB survive; on a later visit `requestPermission()` shows a
   three-way prompt whose "Allow on every visit" grants indefinitely, and "installed apps will
   automatically persist permissions once the user grants access". It does not say what
   `queryPermission()` answers on a cold start, which is why the screen calls it and shows the
   result rather than assuming.
3. **There is no change notification on the phone.** `FileSystemObserver` reached an origin
   trial in Chrome 129 and is desktop-only. So the app cannot be told that a file was added
   or removed; it has to look, and looking has to be cheap.
4. **The standard shape for a web app over a large local folder** is the one every guide
   describes: keep the directory handle in IndexedDB; keep an index of the folder in
   IndexedDB, one record per file, keyed by path; walk *names* rather than opening files;
   open a file only when its entry is new or has changed, judged by size and last-modified
   time; do the work off the main thread; and let the user re-scan, because nothing else will
   tell you. Reading a directory is fast; `getFile()` on every entry is the cost.

## What the app already has, measured against that

`app/src/data/folderLibrary.ts` and `db.ts` already hold most of it: the handle in
IndexedDB with `queryPermission` on every launch; one `folderScores` record per file, keyed
by `[folder, file]`, with a compact per-folder index for the browse screen; a manifest-first
read that avoids the walk entirely for the owner's archive; a resumable, checkpointed walk
for a folder without a manifest; and a `missingAt` mark rather than a deletion when a listed
file is gone. That is the standard design, not a bespoke one, and it stands.

Three things are missing, and they are the whole of the next piece of work:

- **A rescan re-walks everything.** The rows do not record size or last-modified time, so a
  rescan cannot tell an unchanged file from a changed one and opens nothing either way; it
  rebuilds the listing from names. Recording `size` and `lastModified` on the row (both come
  free with `getFile()`, and the manifest can carry them) turns a rescan into a diff: new
  paths are opened and added, vanished paths are marked, everything else is left alone.
  On the archive that is one directory listing per shard and no file reads.
- **PDFs are not in the folder.** The folder lists MusicXML only; a PDF "goes through Import
  instead" and lands on the shelf as a book. The owner's folder holds both, and the standard
  index has no reason to care about the extension: a PDF row is a row with `kind: 'pdf'`,
  listed beside the scores, opening in the PDF screen from the folder rather than after an
  import. Adding one to the shelf stays a deliberate act, as adding a score to the library
  does today.
- **The walk runs on the main thread.** Handles are structured-cloneable, so the walk and the
  per-file reads can move to a worker with no change to what is stored. This matters only for
  a folder without a manifest, and only for the first read of it; it is third on the list.

## What was decided

Keep the design; finish it. In order: size and last-modified on every row and a rescan that
diffs; PDFs as rows of their own kind; the walk in a worker. The manifest writer
(`tools/content/pdmx/manifest.py`) gains the two fields so the archive's rescan is a diff too.
The screen's seven situations in §5ac do not change; "Rescan folder" becomes cheap enough to
run after every copy.

The five-minute check on the phone comes first, before any of it: pick the folder, close the
app, reopen it, and note whether the top line says the folder is open and whether Chrome
prompted. If `queryPermission` answers `prompt` on a cold start even for the installed app,
the screen's "Open it" tap is the honest cost and the design above does not change.

Sources: the Chromium intent to ship for File System Access on Android
(groups.google.com/a/chromium.org/g/blink-dev/c/x3IcFv2jY6c); Chrome's persistent-permissions
post (developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api); the
File System Observer origin-trial post (developer.chrome.com/blog/file-system-observer); the
File System Access capability guide (developer.chrome.com/docs/capabilities/web-apis/file-system-access).
