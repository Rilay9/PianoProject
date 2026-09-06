# PianoPath — the owner's guide

Everything you need to get the app onto the phone, connect the piano, and not
lose your practice history. Written for you, not for a builder: nothing here
needs the docs in this folder.

---

## 1. Getting it on the phone

The app is served from **your own laptop, over the house Wi-Fi**, and only while
you are installing it or updating it. After the first launch the phone holds
everything and the laptop can be off (`docs/00` D25). Nothing about your build
is ever reachable from outside the house.

There are two ways onto the phone. Both start the same way. Do steps A and B
once, ever; step C each time you want a new version on the phone.

### A. Once: make the laptop a trusted address

Chrome only treats an address as secure — full screen, Web MIDI allowed — if it
trusts the certificate. A self-signed one is not trusted. **mkcert** makes a
tiny certificate authority that you install on the phone once, and then every
certificate it issues is trusted there.

1. `mkcert` is installed on this laptop (`winget install FiloSottile.mkcert`
   if it ever goes missing). The certificate for this laptop's addresses is
   already made, in `packaging\lan\` — `192.168.0.23` (Wi-Fi), `192.168.0.24`
   (Ethernet), `philoceraptorii.local` and `localhost`. It is gitignored and
   yours. If the laptop's address ever changes (see the note below), remake it:

   ```bash
   mkcert -cert-file packaging/lan/cert.pem -key-file packaging/lan/key.pem 192.168.0.23 192.168.0.24 philoceraptorii.local localhost
   ```

2. **Install the root certificate on the phone.** Find it with
   `mkcert -CAROOT` — on this laptop that is
   `C:\Users\yalir\AppData\Local\mkcert\rootCA.pem`. Copy that one file to the
   phone (share it to yourself, or a cable), then on the S25:
   **Settings → Security and privacy → More security settings → Install from
   device storage → CA certificate**, pick `rootCA.pem`, and accept the
   warning. Android will show "a network may be monitored" in the status bar
   from then on; that is Android saying a user-installed CA exists, and it is
   yours. Copy only `rootCA.pem`, never `rootCA-key.pem`.

3. Optionally, trust it on the laptop too: `mkcert -install`. Only useful for
   opening the address in a laptop browser; the phone does not need it.

> **Give the laptop a fixed address.** The certificate names the laptop's IP,
> and the router hands IPs out by lease. In the router's admin page, reserve
> `192.168.0.23` for this laptop's Wi-Fi (a "DHCP reservation" or "static
> lease"). If you skip this and the address changes, the phone says the
> certificate is wrong and the fix is step 1 again with the new address — and,
> for the APK, a rebuild with the new host.

### B. Once: build your app

```bash
# From the repository folder. --personal is your build: it carries the
# CC BY-NC editions and every quarried score, whatever its composition's status.
py -3.11 tools/content/build.py --offline --personal

# The app itself, served from the root of the laptop's address.
cd app
set VITE_BASE=/
npm run build:app
cd ..
```

`build:app`, not `build`: `npm run build` rebuilds the content first through
`python3`, which on Windows is not Python.

### C. Each time: serve, then install or update on the phone

```bash
py -3.11 packaging/serve-lan.py
```

It prints the addresses to open. Leave it running, and on the phone — on the
same Wi-Fi — open `https://192.168.0.23/` in Chrome. The first launch
downloads about 1,600 files (17 MB) into the phone's cache; give it a minute
and watch the progress on Settings → Diagnostics if it seems slow.

> **Windows Firewall.** The first time Python listens on the network Windows
> asks whether to allow it; tick *both* boxes (private and public — this
> laptop's Wi-Fi is classed as a public network). It has already been allowed
> on this laptop, so you should not be asked. If the phone cannot connect but
> the laptop can open its own address, that prompt was answered No: Windows
> Security → Firewall & network protection → Allow an app through firewall →
> Python.
>
> Tested 2026-09-06 from the laptop itself against `https://192.168.0.23` on
> both ports, with the certificate chain verified against the mkcert root.
> Not yet tried from the phone.

**To install the quick way ("Add to Home screen"):** tap ⋮ → **Add to Home
screen** → **Install**. That is a real install: full screen, works offline,
Web MIDI works because it is Chrome. It is how the app has been tested and it is
enough. The one thing it does not survive is Chrome deciding to clear site data
for an app you have not opened in months — export a backup now and then (§5) and
that costs nothing.

**To update** either kind of install: rebuild (step B), run the server, open the
app while the laptop is reachable, and accept the "update available" toast. If
"offline only" is on in Settings → Content, turn it off for that one visit.

Then stop the server with Ctrl+C. The phone does not need it again.

### The durable way: the APK

An APK installs like any other app, sits in the launcher, and Android does not
garbage-collect it. Under the hood it is a **TWA** — a thin wrapper that runs
the *real* Chrome, which is exactly why Web MIDI still works inside it. A
Capacitor or plain-WebView build would not have Web MIDI at all, and the piano
would go silent.

**You build it once on your own machine.** It is not built in CI, because it
has to be signed with a key that is yours and must never be committed.

The host is the laptop's address from step A, and the server must be on
**port 443** (the default) for this, because Android checks the app's
ownership of the address at `https://<host>/.well-known/assetlinks.json` and
looks only on the standard port.

```bash
# 1. Make a signing key. Once, ever. Back it up somewhere you will still have
#    in five years — a password manager, an external drive, both.
keytool -genkeypair -v -keystore ~/keys/pianopath.keystore \
  -alias pianopath -keyalg RSA -keysize 2048 -validity 10000

# 2. Build (in Git Bash; the script is a shell script).
export PIANOPATH_HOST=192.168.0.23               # the laptop, from step A
export PIANOPATH_KEYSTORE=~/keys/pianopath.keystore
export PIANOPATH_KEY_ALIAS=pianopath
./packaging/build-apk.sh

# 3. The script writes app/dist/.well-known/assetlinks.json. serve-lan.py
#    serves it from there, so there is nothing to publish: just run the server.
py -3.11 packaging/serve-lan.py

# 4. Copy build/apk/app-release-signed.apk to the phone and open it.
#    Android will ask you to allow installing from this source; that is normal
#    for an app that did not come from the Play Store.
```

> **If the app opens inside a browser frame with a URL bar** instead of full
> screen, Android did not accept the assetlinks file. There is no error
> message — it just looks wrong. Two known causes: the server was not on port
> 443, or Android would not verify against a bare IP address — which nobody
> has tried yet (`docs/00` D25). If it is the second, the quick install above is
> the same app without that one guarantee, and it is fine to live there.

> **Do not lose the keystore.** Android refuses to update an app signed with a
> different key. If the key is gone, the only way to install a new version is
> to uninstall the old one — and that takes your practice history with it.
> Export a backup from Progress first (§5).

**The first thing to check after installing** is that the piano works inside
the APK. Plug in the cable, open Settings → MIDI, tap Connect, play a key. If
notes appear in the log, the whole approach is sound. If they do not, stop and
say so — everything else can be worked around, that cannot.

### Where the app is served from

Your laptop, over the house Wi-Fi, at `https://192.168.0.23/` — see A–C above.
There is no public address any more. The GitHub Pages deploy that existed while
the repository was public goes away with it; the tests still run in CI on every
push.

### The scores only your own build has

`--personal` is your build, and it admits two kinds of thing a public build
could not:

- **Editions licensed CC BY-NC-SA** — Craig Sapp's Humdrum editions of Joplin,
  Mozart, Haydn, Scarlatti and the Bach chorales. The music is out of
  copyright; the typesetting is not free to redistribute.
- **Scores whose composition is not public domain** — the 153 quarried from
  PDMX under the dataset's own "public domain" label (film, game and pop
  arrangements, and the folk tunes nobody could date), and the six MuseTrainer
  files P4 had excluded for the same reason. This is `docs/00` D23, your
  decision of 2026-09-06.

Without the flag all of those still appear in the library, as rows that say
where to get the score instead of carrying it. With it they are real scores.
The 169 Chopin first editions are CC BY and are there either way.

Two things the flag does **not** do. It does not open the three `craigsapp`
repositories — the Beethoven sonatas and both Chopin sets — that state no
licence at all: a missing licence grants nothing, so those stay out whatever
you pass; import your own copy through **Library → Import a score**. And it
does not change what the tests build in CI, which stays strict.

(`--allow-nc` still works as an older spelling, but it admits only the first
kind, so use `--personal`.)

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

Importing from the Library screen instead just files the piece, with no sheet in
the way. Tap **Assign** on its row whenever you want to put it on a rung — that
works for anything in there, including files you imported months ago.

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

### The books you already own

**Library → Shelf.** The app has no copy of your books and is not going to get
one. What it can do is keep a list: which books, what is in them, what page,
and which rung each piece answers.

Add the book, then add pieces — title, page number, and the rung it belongs to.
It takes about twenty seconds a piece and you only do it for the ones you are
actually working on. From then on that piece shows up on the rung's own page,
under **From your own books**, beside whatever the app has.

Every lesson from Stage 1 to 5, and every classical rung, also carries a line
saying what to look for in a method book if you have one — "or whichever page
of your book first mixes half notes, whole notes and rests". If your book has
it, tap **I have this on paper** on that lesson and the form opens with the
rung already filled in.

If you have a **PDF** of the book, link it when you add the book and each
piece's page number will open the viewer at that page.

If a piece has a **twin** in the app — the same notes, bundled or imported —
link it by search. That is worth doing: with a twin the app can play it
properly and score it. Without one, see below.

### Practising something the app cannot see

Tap **Practise** on a shelf piece. You get a metronome with a count-in, a
tempo, the keyboard strip and a timer.

What it measures: how many notes you played, over how long, at what tempo, and
— if the click is on and the piano is connected — how steady you were, as the
spread of your notes around the click. That last number is real. It is the one
thing about playing that does not need the score.

What it does not measure: whether any of it was right. It has not read the
music. The summary says so in those words, and then asks you: Rough, OK or
Clean. **Clean** counts as a pass and is marked as your own judgement, the same
badge "I already know this" gets. On most rungs that is enough to finish them.
On the few whose rule is a measured number — the dynamics drill, the timed
chord changes — it is not, and the app will not pretend otherwise.

### Playing from memory, and playing for someone

On any piece, **Blind** hides the score. Nothing else changes: the cursor still
moves, the keyboard strip still lights up, and the run is scored exactly as it
would be with the page in front of you. That is the point — the two numbers are
comparable, so "I played it from memory at 90 % of my sighted run" means
something. Stage 4.7 is the rung that asks for it.

**Perform** is one pass through: no restart button, no looping. It is recorded
as a performance whatever the score, and Progress keeps a separate list of
them. That list exists because playing a piece all the way through for somebody
is the thing that quietly never happens, and the only cure is being able to see
that it has not.

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
  lends a picked folder to an app for one visit. Turn on **Settings -> Content -> Remember
  the score folder** and it may not have to: MDN says Chrome for Android has been able to
  hold onto a folder since version 132, which nothing has yet tried on your phone. If it does
  not work the app quietly goes back to asking. The
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

**Two more, from P16.**

*Steadiness against the real piano.* The paper screen's ± figure was built and
tested on scripted note times, never on an HP-130 with the sustain pedal down.
Play something you know well from a book, with the click on, and see whether the
number matches your sense of how steady you were. Two things could be wrong: a
pedalled chord arriving as several onsets a few milliseconds apart should count
once (the window is 60 ms), and a deliberately spread or rolled chord should not
be read as lateness. If the number looks wrong in a way you can describe, the
constants are `CHORD_WINDOW_MS` and `MAX_OFFSET_MS` in
`app/src/engine/steadiness.ts`.

*Whether the self-report feels honest.* Rough / OK / Clean, with "Clean" writing
a pass in your name. Nobody can test whether that is a question you will answer
truthfully at eleven at night having half-learned a Czerny study. If you find
yourself tapping Clean to make the rung go green, say so — the fix is probably
to stop letting it complete a rung at all, not to change the wording.

**And two from P18.**

*The amber note colour.* When the microphone is not confident, a note now turns
amber rather than staying uncoloured — "this may be wrong, or I may not have
heard it". It never counts against your score. What nobody here could check is
whether it fires at the right moments in a real room with the HP-130: too often
and it is noise, never and the feature is pointless. Play something you know
well with the mic as the input and see whether the amber notes are the ones you
actually fluffed. The keys carry a `?` as well as the colour, so tell me if the
mark is more useful than the hue or the other way round.

*The chord chart's bass and drums.* There is a **Bass + drums** chip beside
Comp. Root and fifth on beats 1 and 3, kick on 1 and 3, snare on the backbeat,
hat on every off-beat and swung when Swing is on. The pattern is right; whether
it *feels* like something to play against is not something a test can tell you.
Put it on at a tempo you would actually jam at and see whether you can sit in
with it or whether it fights you. If the hat is too loud or the bass too quiet,
those are two numbers in `app/src/audio/backingLoop.ts`.


---

## 9. Testing on Pages before going private

Do this **before** you make the repository private, because Pages stops working
the moment you do (it needs a paid plan on a private repo, and its only job was
this test). The URL is the one the Pages workflow prints — `Settings → Pages`
shows it, and the run's "deploy" step links straight to it.

**One thing to know first.** The Pages build is the **strict** one: the 159
scores whose composition is not public domain are *placeholders* there, showing
"import needed" and a line saying what to do instead. That is correct and is
not a fault to report. Those 159 appear only in the build you install from the
laptop, which is made with `--personal`.

Ten checks, in the order that finds the worst failure first. Each is one screen
and one expected result. If a check fails, stop and send me the Diagnostics
report — **Settings → Diagnostics → Copy debug report** — plus which number
you were on.

1. **Install it.** Open the Pages URL in Chrome on the S25, then menu →
   *Add to Home screen*. **Right:** it installs and opens full screen, with no
   URL bar. **Wrong:** no "Add to Home screen" offer at all (the manifest did
   not load), or it opens in a tab with a URL bar. *Send:* the Diagnostics
   "installed" line.

2. **Diagnostics says the library is complete.** Open the app from the home
   screen, then **Settings → Diagnostics**. **Right:** *Precached n of n*, with
   the two numbers equal and n over 1,400. **Wrong:** a smaller first number
   that does not catch up after a minute on Wi-Fi. *Send:* that line.

3. **The piano connects.** Plug the HP-130 in with the USB cable and open
   **Settings → MIDI**. Play a few keys. **Right:** the device is named, and
   the keyboard strip lights the keys you press with no lag you can feel.
   **Wrong:** no device listed (usually the cable or the phone's USB mode), or
   keys that light late or stick down. *Send:* the MIDI section of the debug
   report.

4. **Play a piece in Wait mode.** Today → open the first song → make sure the
   mode chip says **Wait** → play it. **Right:** the sheet music waits for you
   and moves when you play the right notes; wrong notes go red and it does not
   move on. **Wrong:** it scrolls on its own in Wait mode, or does not move at
   all when you play the right notes.

5. **Finish a run and look at the score.** Play to the end of that piece.
   **Right:** a summary with an accuracy and a tempo, and the piece appears in
   **Progress**. **Wrong:** no summary, or a run that is not in Progress
   afterwards.

6. **Open a drill.** Today → the warm-up row, or Library → any drill.
   **Right:** a card appears, the keyboard strip answers it, and a result sheet
   comes up at the end with four short sections of advice. **Wrong:** an empty
   card, or "no drill to run" on something that is a drill.

7. **Open a lesson and tap "Find more".** Any rung — 2.1 will do.
   **Right:** a sheet with a search line and a chatbot prompt, both copyable,
   naming what the rung wants. **Wrong:** an empty sheet, or a copy button that
   does nothing.

8. **Share a score into the app.** Open a `.mxl` or `.musicxml` in Files or
   Drive → Share → PianoPath. **Right:** the app opens and within a second a
   sheet asks where the piece goes, with a level already estimated and marked
   `≈`. Tap **Save** and it is in your library. **Wrong:** landing on the
   Library list with no sheet, a level box that says "No estimate" for a
   MusicXML file, or a browser error page. *This is the one thing about the
   import that no test here could check.*

9. **Browse the score folder.** Copy `build/pdmx/pianopath-library.zip` to the
   phone and unzip it, then **Library → Browse a score folder → Pick a folder**
   and choose `pianopath-library`. **Right:** it lists 37,261 scores, the
   search box filters them as you type, and **Add** on one of them puts it in
   your library. **Wrong:** a long freeze while picking (tell me roughly how
   long — this is the one number nobody could measure without your phone), or
   an error about too many files. Also open `chrome://version` and tell me the
   Chrome version: if it is 132 or newer, **Settings → Content → Remember the
   score folder** may save you re-picking it every time, and you would be the
   first to know whether it does.

10. **Airplane mode, from the second launch.** Close the app, turn airplane
    mode on, open it again. **Right:** everything works — Today, a score, a
    drill, a lesson — with no network at all. **Wrong:** anything blank, any
    "could not load", any spinner that does not end. Then turn airplane mode
    off and, last, **Progress → Export a backup**, so you have one before you
    change anything else.

When all ten are right: make the repository private (**Settings → General →
Danger zone**), delete `.github/workflows/pages.yml`, and install from the
laptop with the personal build (§1). Your practice history survives that —
it is in the phone's storage, not in the app — but export a backup first
anyway, because an APK signed with a different key cannot upgrade an installed
one and the way out is uninstalling.
