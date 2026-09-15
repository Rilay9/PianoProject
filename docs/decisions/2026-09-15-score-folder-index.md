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

Two corrections to the first draft of this record, made on reading the code rather than
the docs: the walk **already** runs in a worker (`folderWalk.worker.ts`, with a main-thread
fallback), and a rescan **already** diffs at the store — a path that has gone is marked
`missingAt`, a new one is added, and nothing is opened. What the platform does *not* offer
is a cheap stat: the File System Access API has no size or modified time without
`getFile()`, a round trip per file, so the "compare size and mtime" half of the standard
recipe would cost on the archive exactly what the manifest-first read was built to avoid.
The diff is by path, and a file rewritten in place under the same name is not noticed
until it is opened. That is the honest limit and it is recorded on the screen.

One thing was missing:

- **PDFs were not in the folder.** The folder listed MusicXML only; a PDF "went through
  Import instead" and landed on the shelf as a book. The owner's folder holds both, and the
  index has no reason to care about the extension. Done the same day: `.pdf` is a listed
  suffix, `folderKind(file)` says which a row is, the row carries a `PDF` badge, `Add` hands
  the file to the import store under its own name so it becomes a PDF import, and an added
  PDF's row carries **Open**, which goes straight to the PDF screen. Nothing changes in what
  is stored.

## What was decided

Keep the design. PDFs are listed beside scores (done). The rescan stays a diff by path; the
one improvement left is to skip rewriting rows a rescan found unchanged, which is a cost
not a correctness question and can wait for the phone to show it matters. The screen's seven
situations in §5ac do not change.

The five-minute check on the phone comes first, before any of it: pick the folder, close the
app, reopen it, and note whether the top line says the folder is open and whether Chrome
prompted. If `queryPermission` answers `prompt` on a cold start even for the installed app,
the screen's "Open it" tap is the honest cost and the design above does not change.

Sources: the Chromium intent to ship for File System Access on Android
(groups.google.com/a/chromium.org/g/blink-dev/c/x3IcFv2jY6c); Chrome's persistent-permissions
post (developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api); the
File System Observer origin-trial post (developer.chrome.com/blog/file-system-observer); the
File System Access capability guide (developer.chrome.com/docs/capabilities/web-apis/file-system-access).
