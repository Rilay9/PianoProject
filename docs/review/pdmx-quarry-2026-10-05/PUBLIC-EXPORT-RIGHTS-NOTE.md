# Public-export copyright boundary for retained quarry scores

Date: 2026-10-05

Purpose: keep curriculum admission, personal-library use and redistribution/public export separate. This is a product-risk note, not legal advice.

## Governing U.S. term boundary

The U.S. Copyright Office states that works created on or after 1978 generally remain protected for the author's life plus 70 years; anonymous/pseudonymous/work-for-hire terms are generally 95 years from publication or 120 years from creation, whichever is shorter. Pre-1978 works have date-specific rules, and subsisting renewal copyrights can run 95 years from publication.

Sources:
- https://www.copyright.gov/help/faq/faq-duration.html
- https://www.copyright.gov/title17/92chap3.html
- https://www.copyright.gov/history/copyright-exhibit/lifecycle/

A CC0/public-domain-looking **score-file metadata field does not by itself prove that the underlying musical composition is free to redistribute**. File/arrangement rights and composition rights are separate layers.

## Retained candidate consequences

### Garota de Ipanema

Composition is a modern Jobim/Vinicius-era work, not a public-domain composition in the United States in 2026. The retained quarry arrangement may still be usable for private analysis/personal-library workflow, but do **not** public-export the MusicXML or an excerpt without a rights basis.

State for curriculum map: **curriculum MODEL candidate; public export NO unless separately licensed**.

### La Negra Tiene Tumbao

The song is from 2001. Musicnotes identifies Sergio George and Fernando Osorio as composers and Warner Chappell Music, Inc. as publisher. The composition is plainly still protected in 2026.

Source: https://www.musicnotes.com/sheetmusic/sergio-george/la-negra-tiene-tumbao/MN0042689

State: **curriculum notation-analysis candidate; public export NO unless separately licensed**.

### There Will Never Be Another You

The song was published in 1942, by Harry Warren and Mack Gordon. A pre-1978 work still within a possible 95-year term cannot be presumed public domain in 2026; 1942 + 95 reaches 2037/2038 depending on term accounting and the specific copyright history. Do not rely on the quarry file's license metadata as composition clearance.

Background identity/date source: https://en.wikipedia.org/wiki/There_Will_Never_Be_Another_You

State: **curriculum/application candidate; public export NO unless copyright status is affirmatively cleared**.

### Rock / metal candidates

The retained modern rock/metal works (Come As You Are, Hysteria, Enter Sandman, A Little Piece of Heaven, etc.) are modern protected compositions. Their quarry presence or a permissive file-level metadata tag does not clear redistribution of the composition/arrangement.

State: **personal-library/curriculum-reference candidates only; public export NO absent licensing**.

### Blues Riff in C provenance conflict

The quarry summary says `license=publicdomain`, but the matching MuseScore source page for `12 Bar Blues / Lessons - Blues` currently reports `All rights reserved` and links the related `Blues Riff in C (120 bpm)` material. That conflict means the quarry field is insufficient for export clearance.

Source: https://musescore.com/user/955021/scores/454946

State: **public export unresolved/no until provenance is reconciled**.

## Product rule

For every retained non-PD candidate keep three fields independent:

1. `curriculum_role` — whether the notation is pedagogically useful;
2. `personal_or_local_use` — whether the owner can use/import it locally under the project's chosen policy;
3. `public_export` — whether the repository/app may redistribute the score/excerpt.

Never infer field 3 from fields 1 or 2, and never infer it solely from PDMX/MuseScore metadata without a rights check.
