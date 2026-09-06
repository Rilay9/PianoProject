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

### The scores only your own build has

Some of the best editions of public-domain music — Craig Sapp's Humdrum
editions of Joplin, Mozart, Haydn, Scarlatti and the Bach chorales — are
licensed CC BY-NC-SA. The music is out of copyright; the *typesetting* is not
free to redistribute. Since PianoPath is for you alone, your own build may
include them, and a build that goes anywhere public may not.

That is one flag:

```bash
# Your build, before ./packaging/build-apk.sh
python3 tools/content/build.py --allow-nc
```

Without it the same rags and sonatas still appear in the library, but as rows
that say where to get the score instead of carrying it. With it they are real
scores you can open and play.

What the flag covers is narrower than it was. The 169 Chopin scores — the
preludes, mazurkas, nocturnes, waltzes, études, ballades, scherzos and sonata
movements in the library — come from the Fryderyk Chopin Institute under CC BY,
which is free to redistribute, so they are there whether you pass the flag or
not. The flag now only affects the 47 Joplin rags.

Two things this flag deliberately does **not** do. It does not touch the GitHub
Pages deploy, which builds with `--strict-license` and ships none of them. And
it does not open the three `craigsapp` repositories — the Beethoven sonatas and
both Chopin sets — that state no licence at all: a missing licence grants
nothing, so those stay out whatever you pass. If you want that music, import
your own copy through **Library → Add score**.

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

Most of what you will play, you will find yourself. The app's job is to tell
you *what to look for* and then to get it onto the right rung in two taps.

### Finding it

Open any lesson. Under the title there is a line saying what that rung still
wants — "This rung wants one more song to reach the floor of 3" — and a
**Find more** button.

That sheet gives you two things to paste. **Copy search** is a line for a search
engine. **Copy prompt** is a paragraph for a chatbot, and it is the better one:
it already says what the piece must have, what makes one wrong for this rung,
that MusicXML is what you want rather than a picture, and that music still in
copyright is fine because you are finding it for yourself. It asks for ten with
composers and where to get each.

Underneath, the examples: pieces of roughly the right kind, marked *already
yours* if the app has one, or *not found yet* if it is one of the pieces the
plan names that no free source turned out to have.

The Skills screen has the same button on every skill, if what you want is "more
of this" rather than "more for this rung".

### Getting it in

Once you have the file, either way round:

- From the lesson, tap **Import for this rung**, pick the file, then **Save**.
- Or share the file into PianoPath from Files or Drive, then **Save**.

Either way a sheet opens by itself with everything filled in — the rung, a
level estimated from the notes, what it trains — and **Save** is the only thing
left to do. Two taps.

The level is marked `≈` while it is the app's guess. Type over it and it stops
being a guess, and stops showing the `≈`: you are a better judge than the model
is.

**Assigning it to a rung is what matters.** A piece attached to a rung is one
of that rung's song options: it counts towards finishing the rung, it turns up
when you ask for something else to play, and the session builder can pick it.
A piece with no rung is just a file in your library — still playable, but the
plan does not know about it. You can leave it that way on purpose; "No rung" is
the first choice in the list.

### What it takes

**Library → Import a score** takes `.musicxml`, `.mxl` and `.pdf`.

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

### A whole folder of scores

One at a time is fine for a score you bought. For a folder of thousands there is
**Library → Browse a score folder**.

Copy the folder onto the phone first — internal storage or an SD card, anywhere the
file picker can see it. Then tap **Pick a folder** and choose it. The app reads what
is in there and lists it: search by title or composer, narrow by level or style, or
tick *rated 4+ by 5+ people* to see only what a lot of other people liked.

Tap **Add** on anything you want. That copies it into your library for good, exactly
as if you had imported it — it gets a level, it can go in a session, it is in your
backup, and it keeps working whether or not the folder is still there.

Two things that will otherwise look like bugs:

- **You have to pick the folder again each time you want to add something.** Android
  only lends a folder to an app for one visit; there is no way to hold onto it. The
  *listing* is saved, so browsing works any time, offline, with nothing plugged in —
  it is only adding that needs the folder in hand.
- **Levels marked `est.` are guesses**, made from the file's statistics rather than
  from anyone playing it. Treat them as a way to sort the shelf, not as a verdict.
  Re-level anything that feels wrong: it is one tap on the item.

If the folder came from the archive on the laptop it will have a `library.json` in
it, which is where the titles and composers come from. A folder of your own scores
with no such file works too — each one is listed by its filename, and takes its real
title from inside the file when you add it.

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

## 8. Three things only you can check

Three of the exercises added in P12a are scored against thresholds that were
chosen on a laptop and have never met a real piano. Nothing is broken if they
are wrong — the notes, the timing and the accuracy score are unaffected — but
the *extra* judgement each one makes might not match your ear on the HP-130.
When you get to them, five minutes each settles it.

**1. Staccato and legato.** Open `Staccato phrase in C` and play it the way you
would want it to sound. Then open the legato one and do the same. The app judges
these on how long you hold each key: staccato wants under half the written
value, legato at least 90% of it.

*If it disagrees with you*, the numbers are `heldFractionMax` and
`heldFractionMin` in the exercise's `drill.params`, and `STACCATO_MAX_HELD` /
`LEGATO_MIN_HELD` in `app/src/engine/Scoring.ts`. Tell me which way it was wrong
and by how much.

**2. Voicing.** Open `Voicing the top note in C` and play each chord with the
melody singing over the rest, as you would in a piece. The app wants the top
note at least 1.4 times the average velocity of the notes underneath.

*The likely failure is that 1.4 is too strict on a weighted action* — it is easy
to hear a melody that is only 20% louder. If it fails chords that sound right to
you, say so and the ratio comes down.

**3. Half pedal.** Open `Half pedal — the damper part-way down`. This one has a
prerequisite the others do not: your piano has to *send* intermediate CC64
values. Many digital actions send only 0 and 127, and the HP-130 has not been
tested.

The app now tells the difference. If it reports a **binary pedal**, the
instrument is sending a switch rather than a position, the exercise cannot be
judged on it, and that is a fact about the piano rather than about your playing
— say so and the family gets dropped rather than left failing. You can also see
the raw values on Settings → Diagnostics while you press the pedal slowly.

**One more, from P12b:** harmonic dictation decides a chord is finished when no
new note has arrived for 120 ms. That threshold has never met a sustain pedal.
If you play a chord with the pedal down and the app splits it into two chords,
or waits too long, the number is `CHORD_BOUNDARY_MS` and it wants your hands
rather than mine.

**One more, from P15 — and this one needs a real Android share.** Everything
about the two-tap import was tested in a desktop browser, where a "share" is a
simulated file drop. What could not be tested here is Android actually handing
the file over.

Do this once: open a `.mxl` or `.musicxml` in Files or Drive, tap Share, choose
PianoPath.

*What should happen:* the app opens on the Library tab, and within a second a
sheet slides up headed **"Where does &lt;title&gt; go?"**, with a rung dropdown
reading *No rung — just put it in my library*, a level box holding a number,
and a hint underneath saying `≈ <n>, estimated from the notes`. Tapping **Save**
closes it, and the piece is in the library.

*What would be wrong:* landing on the Library list with no sheet (the shared
file was not picked up), a sheet with an empty level box and "No estimate — the
app could not read the notes" (fine for a PDF, wrong for MusicXML), or a WebView
error page (the share-target redirect failed).

If a share ever arrives carrying a rung — `?for=` in the URL — that rung should
be pre-selected instead of *No rung*. Android normally posts to the plain
address, so expect *No rung*; the pre-selection is there for the lesson page's
**Import for this rung**, which you can check in one tap and which does work
here.
