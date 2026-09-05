# PianoPath — the owner's guide

Everything you need to get the app onto the phone, connect the piano, and not
lose your practice history. Written for you, not for a builder: nothing here
needs the docs in this folder.

---

## 1. Getting it on the phone

You have two ways in, and you can use both.

### The quick way: install from the browser

Open the app's URL in **Chrome on the phone**, tap ⋮ → **Add to Home screen**.
That is a real install: it runs full-screen, works offline, and Web MIDI works
because it is Chrome.

This is the fastest way to try a new version, and it is how the app has been
tested. The one thing it does not survive is Chrome deciding to clear site data
for an app you have not opened in a while — which is the reason for the APK.

### The durable way: the APK

An APK installs like any other app, sits in the launcher, and Android does not
garbage-collect it. Under the hood it is a **TWA** — a thin wrapper that runs
the *real* Chrome, which is exactly why Web MIDI still works inside it. A
Capacitor or plain-WebView build would not have Web MIDI at all, and the piano
would go silent.

**You build it once on your own machine.** It is not built in CI, because it
has to be signed with a key that is yours and must never be committed.

```bash
# 1. Make a signing key. Once, ever. Back it up somewhere you will still have
#    in five years — a password manager, an external drive, both.
keytool -genkeypair -v -keystore ~/keys/pianopath.keystore \
  -alias pianopath -keyalg RSA -keysize 2048 -validity 10000

# 2. Build.
export PIANOPATH_HOST=your-host.example         # where the app is served
export PIANOPATH_KEYSTORE=~/keys/pianopath.keystore
export PIANOPATH_KEY_ALIAS=pianopath
./packaging/build-apk.sh

# 3. Publish the file it tells you to, at
#    https://your-host.example/.well-known/assetlinks.json
#
# 4. Copy build/apk/app-release-signed.apk to the phone and open it.
#    Android will ask you to allow installing from this source; that is normal
#    for an app that did not come from the Play Store.
```

> **If you skip step 3** the app still runs, but inside a browser frame with a
> URL bar instead of full screen. There is no error message — it just looks
> wrong. That is almost always what a "my TWA isn't full screen" problem is.

> **Do not lose the keystore.** Android refuses to update an app signed with a
> different key. If the key is gone, the only way to install a new version is
> to uninstall the old one — and that takes your practice history with it.
> Export a backup from Progress first (§5).

**The first thing to check after installing** is that the piano works inside
the APK. Plug in the cable, open Settings → MIDI, tap Connect, play a key. If
notes appear in the log, the whole approach is sound. If they do not, stop and
say so — everything else can be worked around, that cannot.

### Where the app is served from

The APK needs an HTTPS address to load, even though it runs offline afterwards.
That address is not chosen yet, and the build takes it as `PIANOPATH_HOST`, so
picking one later is a config change and not a rebuild of anything.

- **GitHub Pages** is what it uses today. It works, and it needs the repository
  to stay public (Pages from a private repo needs a paid plan).
- **Cloudflare Pages or Netlify** are free, work from a private repository, and
  are the natural home once you make the repo private.

Either way the app should be served at the **root** of its host (`/`), not a
sub-path — the assetlinks file has to be at the origin root regardless, and
having both at `/` avoids a class of confusion.

---

## 2. Connecting the piano

The HP-130 talks MIDI over the DIN cable to a USB interface, and the S25 takes
that through the OTG adapter.

1. Plug it in **before** opening the app, if you can.
2. Settings → **MIDI** → **Connect piano**. Chrome asks once; say yes.
3. Play a key. The log fills in and the keyboard strip lights up.

After that first yes, the app reconnects on its own every time it opens — you
should never have to press Connect again on that phone.

**If nothing arrives:** the DIN plugs are the usual culprit. MIDI OUT on the
piano goes to MIDI IN on the interface. They are easy to get backwards, and
that is exactly what was wrong the first time (`docs/07-midi-hp130-notes.md`).
Swap them and try again.

**No cable to hand?** Nothing breaks. The on-screen keyboard at the bottom of
the Score and drill screens is a real input — the app cannot tell it from the
piano. The microphone is the third option: Settings → Microphone → calibrate.

---

## 3. Your first session

Open the app. **Today** has already built you a session.

- The line at the top is minutes **this week** against a weekly goal. There is
  no daily streak, on purpose: missing a Tuesday is not a failure.
- The chips underneath pick how long you have — 15, 30, 60 or 120 minutes. It
  remembers weekdays and weekends separately.
- Each row is one thing to play. **▶** opens it.
- **Swap** on any row offers something else that trains the same thing, and the
  "not a song" filter on that sheet is there because plenty of skills are
  better practised without a tune attached.

On the **Score screen**: the music follows you. It waits for you by default when
the piano is connected, and moves on a clock when it is not. The control bar
hides while you play and comes back on a tap.

When you finish, you get a summary and it is recorded. An item you passed comes
back for review after 1, 3, 7 and 21 days.

---

## 4. Your own sheet music

**Library → Import a score.** It takes `.musicxml`, `.mxl` and `.pdf`.

- **MusicXML and .mxl** become first-class: searchable, playable, and the music
  follows your playing exactly as it does for anything built in.
- **A PDF is pages, not notes.** It opens in a viewer that shows one system at a
  time, full width, which is the only way a bought score is readable on a phone.
  It can follow a clock or your taps, but it cannot listen — there are no notes
  in a picture to match.

  If the viewer cuts a page in the wrong place, tap **Adjust cuts**, drag the
  lines, and Save. The correction is stored with that score and is used from
  then on.

You can also **share into the app** from Files or Drive — long-press a file,
choose PianoPath.

---

## 5. Not losing your practice history

**This is the only copy.** The app is on one phone with no server behind it.
A year of practice lives in that phone's storage and nowhere else.

**Progress → Export everything** writes one JSON file with all of it — your
history, your settings, and your imported scores. Put it somewhere that is not
the phone.

Do it before: reinstalling, changing phones, clearing Chrome's data, or
anything that starts with "let me just try…".

**Progress → Import a backup** brings it back. It *merges* by default, so
restoring an old backup will not throw away practice you have done since.

---

## 6. When something looks wrong

**Settings → Diagnostics** is built to be copied into a message. "Copy debug
report" puts the whole thing on the clipboard.

It answers, in order:

- **Is it offline-ready?** "Precached *n* of *m* catalog files", with the
  missing ones named. If *n* is less than *m*, those are the files that would be
  missing on a train.
- **Is the cable working?** Connected devices and a live message log.
- **Is the microphone hearing anything?** Level and noise floor, before any
  question about wrong notes is worth asking.
- **Is it fast enough?** Render timings against the budgets.
- **Has anything crashed?** Errors this session, with counts.

If something breaks mid-practice, a red banner appears at the bottom with
**Copy details**. That is the fastest thing to send.

---

## 7. Things worth knowing

- **It works with no network**, from the second launch onwards. The whole
  library — every score, the lesson text, the piano samples — is on the phone.
  Only the teaching-video links need the internet, and they say so before you
  tap them.
- **"Offline only"** in Settings → Content stops it even checking for updates.
- **Nothing is locked.** Every lesson is openable whenever you like. "I already
  know this" marks one done without playing it, and keeps its own badge so you
  can tell later what you actually measured.
- **The metronome** works on its own (Today → Tools) and on top of the sheet
  music (the 🥁 button on the Score screen).
