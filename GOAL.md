# GOAL — From Detection to Direction

WhatTheFlat already solves the hard live problem: **knowing what key and chords people are playing in a jam, in real time.** This document defines the next level, in two parts:

1. **Chord progressions** — make it easier to work with *different* progressions: a bigger genre repertoire, clearer "1-5-4"-style readout of the detected loop, a builder where you place chords yourself, and alternative voicings for every chord in a progression.
2. **Learn** — expand the education section for the player who already knows the basics and is confident enough to jam, but wants to go next level.

Supporting research and full repertoires live in:

- [`docs/progression-repertoire.md`](docs/progression-repertoire.md) — genre-by-genre progression tables, substitution rules, voicing data sources, UX patterns from existing tools
- [`docs/learn-curriculum.md`](docs/learn-curriculum.md) — intermediate training methods for guitar, piano, and bass, with drills and how app features map onto them
- [`docs/kb-plan.md`](docs/kb-plan.md) — the **jam knowledgebase**: styles × instruments × progressions × voicings, the `/kb-expand` session loop that grows it ([`docs/kb-backlog.md`](docs/kb-backlog.md)), and the **Jam Guide** panel that renders it live at the bottom of the app

---

## Part 1 — Chord progressions

### Where we are

- `PROGRESSIONS` in `src/lib/theory.js` holds **14 hardcoded progressions across 7 genres** (Pop, Blues, Folk, Jazz, Rock, '50s, Flamenco). These drive `ProgressionSuggestions.jsx`.
- `detectRepeatingProgression()` finds the repeating loop in chord history; `ProgressionBanner.jsx` already shows it with Roman numerals (I–V–IV) via `toRomanNumeral()`.
- `EducationPanel.jsx` + `src/lib/education.js` carry 15 famous progressions with substitutions and style variations.
- `src/lib/voicings.js` has ~50 guitar shapes (open + barre) across 14 chord types; no inversions, no triad string-sets, thin piano coverage.
- There is **no way to enter or arrange a progression manually** — everything is detection-driven.

### Goals

**G1 — Expanded genre repertoire (data, not code).**
Grow `PROGRESSIONS` from 7 to ~12 genres using the researched tables in `docs/progression-repertoire.md`: Funk (Dorian i7–IV7 vamps), Reggae (two-chord skanks), Country (V/V secondary dominant moves), R&B/Neo-soul (iii–vi–ii–V, 6-2-5-1), Gospel (chained 2-5-1s), plus blues variants (quick-change, minor blues) and the J-pop "Royal Road" (IV–V–iii–vi). Progressions stay in the existing `{ name, rn, degrees }` format so suggestions, Roman numerals and key mapping keep working unchanged.

**G2 — Numeral clarity ("is this 1-5-4?").**
The loop banner already shows Roman numerals; add a **Nashville-number display option** (1-5-4 instead of I-V-IV) since that is how musicians call changes at a jam. One formatting layer over `toRomanNumeral`, toggled in Settings.

**G3 — Progression Builder (drag and drop).**
A panel where the user assembles a progression by hand:
- A **key-relative chord palette** (Hookpad's best idea): the diatonic chords of the current detected/locked key, one tap to add, with borrowed-chord palette (iv, ♭VII, ♭VI, V/V…) one level deeper.
- Slots that can be **reordered by drag and drop**, with live Roman/Nashville numerals under each chord.
- Tap any slot → **alternative voicings** for that chord (G4).
- Seeded from the detected loop ("send loop to builder") so a jam can be captured, edited, and varied.
- Variation buttons per chord powered by the substitution taxonomy (diatonic swap, borrow, secondary dominant, 7th/sus/add9 color) — the rules are in `docs/progression-repertoire.md` §2.

**G4 — Alternative voicings per progression chord.**
- **Guitar:** extend `voicings.js` with CAGED positions and triads on string-sets (top-3 / middle-3), or adopt the MIT-licensed [`tombatossals/chords-db`](https://github.com/tombatossals/chords-db) dataset (multiple positions per chord, JSON, with a companion React SVG renderer).
- **Piano:** generate voicings from interval recipes rather than data files — root position, inversions, shells (1-3-7), rootless A (3-5-7-9) / B (7-9-3-5) — choosing the inversion that minimizes movement from the previous chord (voice-leading distance).
- Surface these in the Builder (G3) and in `CurrentJamPanel` voicing strips.

---

## Part 2 — Learn: basics → jam-ready next level

### Audience

Not step one. The target player already knows open/barre chords (guitar), triads and simple lead sheets (piano), roots and simple scales (bass) — and is confident enough to show up at a jam. The Learn section's job is to take them **from "can survive a jam" to "makes the jam better."**

### What the research says (full detail in `docs/learn-curriculum.md`)

Across guitar, piano, and bass pedagogy (Berklee methods, Justin Guitar grades 4–6, Tomo Fujita, Mark Levine, Open Studio, PianoGroove, Scott's Bass Lessons, TalkingBass, Ed Friedland), the intermediate-to-advanced jump converges on four pillars:

| Pillar | Guitar | Piano | Bass |
|---|---|---|---|
| **Fretboard/keyboard liberation** | CAGED, triads on string sets, connecting pentatonic boxes | Inversions in all keys, voice leading | Neck zones, chord-tone arpeggios everywhere |
| **Playing the changes** | Chord-tone targeting, guide tones (3rds & 7ths) | Shell + rootless voicings, sus/add9 colors | Walking lines, chromatic approach notes |
| **Ensemble skills** | Small voicings, register discipline, comping | Comping rhythms (Charleston…), "rule of 1", staying out of the bass lane | Pocket/drummer lock, ghost notes, subdivision switching |
| **Functional ears** | Hearing I-IV-V / vi-IV-I-V by bass line | Nashville numbers, 12-key transposition | Singing root movement, predicting the V |

### Goals

**L1 — Practice drills tab.**
Add a drills library to the Learn section: per instrument, per pillar, the concrete drills from the curriculum doc (e.g. "first note after every chord change = the 3rd", "Charleston comping ladder", "W|H|H chromatic walkup"). Keyed to the *current detected key and loop* so every drill is in today's jam context, not abstract C major.

**L2 — Detection-powered feedback (the unfair advantage).**
No practice app can hear the player; this one can. Phased:
- **Target-note highlighting:** on each detected chord change, highlight the new chord's 3rd/7th on the fretboard/piano for a beat (drill scaffold — uses existing tier rendering).
- **Next-chord preview tier:** when a loop is detected, show the *upcoming* chord's root and its chromatic approach notes (the bassist's walking-line scaffold).
- **Chord-tone hit rate:** classify detected notes against the current chord (chord tone / scale tone / outside) and show a session score.
- **Pocket report:** extend the onset/BPM pipeline to show timing drift against the established grid.

**L3 — Ear training from your own jam.**
A quiz mode that hides the chord banner and asks the user to name the progression in numbers before revealing — using the *user's own chord history* as the corpus. Converts the existing detection + `toRomanNumeral` into the functional ear training every method prescribes.

**L4 — Mode-difference teaching.**
When the user manually switches mode (the documented K-S limitation — by design), briefly highlight the *difference notes* (e.g. the raised 6th going minor → Dorian) on the instrument views. Turns a limitation into a lesson.

---

## What we need to go next level — priorities

| # | Item | Effort | Why first |
|---|---|---|---|
| 1 | **G1** Genre repertoire expansion | S (data only) | Immediate value, zero architectural risk |
| 2 | **G2** Nashville number toggle | S | Directly answers "is it 1-5-4", jam-native language |
| 3 | **G3** Progression Builder MVP (palette + reorder + numerals) | M | The single most-requested workflow gap |
| 4 | **L1** Drills tab seeded from curriculum doc | M (content + UI) | Makes Learn level-appropriate |
| 5 | **G4** Voicing alternatives (guitar string-sets + piano recipes) | M | Feeds both Builder and Learn |
| 6 | **L2** Target-note highlighting + next-chord preview | M | First detection-powered trainer, reuses tier rendering |
| 7 | **L3** Ear-training quiz on own history | M | High pedagogical value, small surface |
| 8 | **L2** Hit-rate scoring + pocket report | L | Needs tuning of pitch/onset classification |
| 9 | **G3** Builder phase 2: borrowed palette, variation buttons, loop import | L | Builds on MVP + substitution rules |
| 10 | **KB** Knowledgebase + Jam Guide panel (see `docs/kb-plan.md`) | L, but looped in S-sized sessions via `/kb-expand` | The style × instrument playbook that powers improv learning |

### How we execute

Knowledgebase work runs as **looped sessions**: `/kb-expand` does exactly one style × instrument cell (research → author → validate → commit), driven by the queue in `docs/kb-backlog.md`. Tranches run on a dedicated branch — e.g. an hourly `/loop /kb-expand` for a working day — and **end with a pull request** so a whole tranche is reviewed in one place. First tranche (started 2026-06-12, branch `kb-expansion`): Session 0 bootstrap + the first guitar style cells, hourly for 8 hours, PR to `main` at the end.

### Definition of "next level" (success criteria)

- A jammer can glance at the app and call the loop in numbers ("it's a 1-5-4").
- Suggestions cover the genres people actually jam (funk/reggae/R&B/gospel included), not just pop/blues.
- A user can lay out their own progression, drag chords around, and see 3+ ways to voice every chord on their instrument.
- The Learn section gives an intermediate guitarist, pianist, or bassist a *specific* next drill in the key they're jamming in right now — and at least one drill where the app verifies them by listening.
