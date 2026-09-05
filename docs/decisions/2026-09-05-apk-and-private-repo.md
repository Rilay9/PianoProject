# Delivery is an APK from a private repository

Date: 2026-09-05 · Owner decision · Status: accepted · Supersedes part of `00` D9, D10a, A6

## The decision

> "Once this is done we'll make it into an apk and make the repo private, so don't worry
> about the licensing stuff. the only reason we need the pages is for testing right now."

Recorded as `00` **D19**. Three consequences, in order of how much they change:

1. **The artifact is a TWA APK**, built with Bubblewrap, installed on the owner's S25. A
   Trusted Web Activity wraps the real Chrome, so Web MIDI keeps working; a Capacitor or plain
   WebView wrap would not, and remains forbidden (`01` §1).
2. **The repository goes private** before v1.0.
3. **GitHub Pages is demoted to a test deploy** and only while the repo is public.

## What this does and does not change about licensing

It changes a lot. Every edition-licence rule in `03` §1 exists because bundling and then
*publishing* is redistribution. A private repo plus an APK on one phone publishes nothing, so
CC BY-NC stops being a question and even ND — excluded because normalising an edition is a
derivative work — stops mattering for a build nobody else receives. When the repo goes
private, `--allow-nc` becomes the default.

Two things it does **not** change, because neither was ever about redistribution:

- **Never download a transcription of a copyrighted song from the web.** That is the rule
  behind the rock-and-metal module (`00` D18, `02` Part D8) and it is about not taking
  something that was sold, not about who sees the result. Those songs arrive by purchase or by
  the owner's own transcription, through the import screen.
- **Provenance is still recorded.** `content/scores/imported/SOURCES.md` and each item's
  `source` block stay. They are how anyone — including a future session — can tell where a
  file came from, which is worth having whether or not a licence forces it.

## The sequencing trap

**Nothing relaxes yet.** The repo is public today and `pages.yml` deploys to a public URL on
every push to `main`; that deploy *is* a publication. So the default content build stays
NC-free until the repo is actually private. Whoever flips `--allow-nc` to the default must
flip the Pages workflow to `--strict-license` in the same commit, or delete the workflow.
This is written into `03` §1 and into P9 item 6 so it cannot be flipped by half.

## The part that still needs a host

A TWA does not bundle the web app; it loads its start URL over HTTPS and uses Digital Asset
Links to prove the origin belongs to the APK. So "private repo + APK" does not by itself
remove the need for an origin. Two options, to be settled in P9:

- **(a) Keep a static host.** Cloudflare Pages or Netlify's free tier will build a *private*
  repo and serve it over HTTPS. Smallest change; updates stay one push away. **Recommended.**
- **(b) Make the APK self-contained** by precaching every route and asset on first launch.
  Still needs one online first run, and makes updates a reinstall.

## Also settled here

- The signing keystore is the owner's, lives outside the repo, and is never committed. P9
  documents where it is and how to reproduce a build without it. The APK is not built in CI.
- `vite.config.ts` `base` must match wherever the origin serves from. A site root or custom
  domain makes the TWA config simpler than the current `/PianoProject/` subpath.
- **Web MIDI inside the TWA must be verified before anything else in P9.** It is the single
  assumption that would sink the approach, and it is cheap to test early and expensive to
  discover late.
