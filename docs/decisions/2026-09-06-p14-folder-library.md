# The archive lives on the phone, and the app reads a folder

2026-09-06. Owner decision, taken during P14 and after the quarry run.

## What was asked

> "Maybe the app should include a way to browse those and then load them? I'm happy to unpack
> the entirety of those actual songs and get rid of the rest."

and then, on being shown a plan that shipped a subset into the app:

> "No — I plan on putting the files on my phone, so no need to package them in the app. It
> should ask for folders with the data anyway and just use the CSV or your generated index
> thing to find them, and/or add other files, not just the ones in the archive. Remember we
> plan on making it easy to add other files anyway."

## What was decided

The **files live on the phone's own storage**. The app does not hold the library, it reads
one, and adding a piece is the ordinary import from `04` §4.

Concretely:

1. `extract.py --from-index --shard` unpacks every indexed *song* — 37,261 files, 237 MB, in
   `build/pdmx/library/<aa>/<cid>.mxl`. It took 27 seconds. The 238 rows the index flags as
   not-a-song stay in the archive: the generator already writes scales and metronome tracks.
2. `manifest.py` writes `library.json` beside them, so the folder describes itself.
3. The folder is copied to the phone. Library → **Browse a score folder** points the app at it.
4. Tapping **Add** imports that one score, permanently.

## Why not the alternatives

- **Bundling a subset into the app.** Was offered — the 2,725 scores rated 4+ by five or more
  people come to about 17 MB, which is shippable. Refused, and rightly: it makes a fixed shelf,
  changing it means a rebuild, and it does nothing for the owner's *own* files, which was the
  other half of the ask.
- **Serving the library from the laptop over Wi-Fi.** Built, then deleted. It needed a bespoke
  HTTP server with CORS, worked only while the laptop was awake and on the same network, and
  would have stopped working entirely once the app is served over HTTPS, because a browser
  will not let an HTTPS page fetch plain HTTP. More code and more fragile.
- **Precaching the whole library.** 237 MB against a 13 MB precache. Not arguable.

## What Android decides for us

Both checked against the compatibility data rather than assumed:

- **`showDirectoryPicker()` does not exist on Chrome for Android.** Android has no system
  picker that maps onto the File System Access API. So there is no persistent folder
  permission, and nothing can be re-read on a later launch.
- **`<input type="file" webkitdirectory>` does work** — Chrome Android 132+, and `webkitdirectory`
  reached Baseline in August 2025. Versions 18–131 either could not choose a directory or
  crashed, which does not matter on an S25.

The APK changes none of this: a TWA wraps the real Chrome, so it behaves exactly as the
browser does.

Hence the shape: **the listing is stored and the files are not.** Browsing 37,261 scores works
offline with nothing plugged in; adding needs the folder picked again. That is one tap, only
when something is wanted, and it is the honest consequence of what the platform offers.

## Deliberate limits

- **No opening straight out of the folder.** It would work until the picker's grant lapsed and
  then stop. A piece you practised last week disappearing is worse than a tap.
- **The manifest never overwrites a good title.** The score's own `<work-title>` wins. The
  manifest's title is used only when the score has none — `Untitled`, `New Score`, a bare CID
  — and never when the row is flagged `garbled`, because those 236 titles were damaged in the
  PDMX CSV itself and lossily, while the file inside the `.mxl` was never touched.
- **`folderLibraries` is not in the backup.** It is a 6 MB listing of files that are on the
  phone anyway and is rebuilt by pointing at the folder again. The backup holds a year of
  practice and should not be multiplied in size to save a tap.
- **A folder over 100,000 files is refused** with a sentence, rather than half-read. Pointing
  at `/sdcard` by mistake should not lock the phone up indexing photographs.

## A bug this uncovered

`tools/content/pdmx/select.py` shared a name with the standard library's `select`. That was
known and fixed for *imports* (only `tools/content` goes on `sys.path`), but not for *scripts*:
Python puts a script's own directory first on the path, so running any `pdmx/` script made the
shortlist module answer `import select` for the whole process. It surfaced when a server here
imported `http.server` → `socketserver` → `selectors` → `import select` and died on its first
connection with `'set' object has no attribute 'open'`.

Two fixes, and both are wanted:

1. **The module is now `shortlist.py`**, which removes the collision entirely. That is the real
   fix, and it is what the file should always have been called — it builds the shortlist.
2. **Every entry point still drops its own directory from `sys.path`** before importing anything
   that could reach for it. The hazard is structural rather than about one name: a script's own
   directory goes first on the path, so the next module named after a standard library one would
   do the same thing.

`TestEntryPointsRunAsScripts` runs each script and checks the standard library's `select` is
still the real one.
