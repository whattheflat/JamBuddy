# Jam Guide — Concept C: "Roadmap"

> **Thesis:** Don't show chords — show the *journey through the loop* and what to solo over it. A horizontal timeline with a live "you are here" playhead, each station previewing its guide tones (3rds & 7ths) and the scale to blow over, with voice-leading rails drawn *between* the chords so the player sees the next note coming before it arrives.

Concept C is the **improv-first** option. Where Concept A optimises for *playing the chord in front of you* and Concept B for *comparing voicings at rest*, Concept C optimises for the soloist's question: **"the loop is turning — what do I aim at next, and what scale carries me there?"** The chord *voicing* diagram is present but demoted to a thin strip; the hero is the **improv map**: a lane of guide-tone targets and a lane of voice-leading arrows running left-to-right under a moving playhead.

It leans hardest into the learning-platform vision in `GOAL.md` Part 2 (L2 "next-chord preview tier", target-note highlighting) and the curriculum's **Tier B — Playing the Changes** (guide tones, the 7th-falls-to-the-3rd rail) and **Tier D — Functional Ears** (seeing the loop as motion, predicting the V).

---

## 1. Name + thesis

**Roadmap** — the live progression as a horizontal highway: a playhead drives left-to-right through the loop, each chord is a station showing its **target tones + scale**, and **voice-leading rails** connect each station to the next so you read the change one beat early.

---

## 2. Mockup (full-width panel, ii–V–I in C — the gold-standard `jazz-251-major`)

Detected loop `Dm7 → G7 → Cmaj7`, key C major, mode major. Playhead currently over G7, leaning into Cmaj7. Active station glows accent-purple; the rest are dimmed by age exactly like the existing `ProgressionBanner` opacity tiers.

```
┌─ JAM GUIDE ─────────────────────────────────────────────  [Guitar ▾] · Jazz │ Blues │ Rock │ Bossa … ─┐
│  ii–V–I in C major   ·   your loop:  Dm7 → G7 → Cmaj7   ·   ♻ 2 bars/chord   ·   ~132 BPM            │
│                                                                                                       │
│  ┌──── bar 1 ───────────┬──── bar 2 ───────────┬──── bars 3-4 ──────────────┐   ◀ lookahead 1 beat   │
│  │      Dm7  (ii7)      │   ▶ G7  (V7)  ◀ now   │      Cmaj7  (Imaj7)        │                        │
│  │      D dorian        │      G mixolydian     │      C major  (avoid 4)    │   ← SCALE lane         │
│  ├──────────────────────┼──────────────────────┼────────────────────────────┤                        │
│  │  guide tones         │  guide tones          │  guide tones               │                        │
│  │   3rd ● F   7th ○ C  │   3rd ● B   7th ○ F   │   3rd ● E   7th ○ B        │   ← TARGET lane        │
│  │            ╲         │           ╲           │                            │   (land these on 1)    │
│  │   C ─────────▶ B     │   F ─────────▶ E      │   ( B holds → next loop )  │   ← VOICE-LEADING      │
│  │   7th of ii falls ½  │   7th of V falls ½    │   resolved — get light     │     rails (7→3)        │
│  ├──────────────────────┼──────────────────────┼────────────────────────────┤                        │
│  │  ▣▣·▣·  shell        │  ▣·▣▣·  shell         │  ▣▣·▣·  shell              │   ← voicing strip      │
│  │  R–♭3–♭7  (tap ▸)    │  R–3–♭7   (tap ▸)     │  R–3–7    (tap ▸)          │     (secondary)        │
│  └──────────────────────┴──────────────────────┴────────────────────────────┘                        │
│   ◐──────────────────────────────●─────────────────────────────────────────  loop playhead           │
│   │·····│·····│·····│·····│·····│●····│·····│·····│·····│·····│·····│·····│   ← beat grid (you here)  │
│                                                                                                       │
│  TIP  In any ii–V–I the 7th of one chord falls a half-step to the 3rd of the next — C→B, F→E.         │
│       That two-note rail is the whole map.   ·   tap a station → its guide tones light the fretboard ▸ │
└───────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

The same panel over a **minor blues** (`blues-minor`-style, key A minor) reads as a longer highway — 12 stations scroll horizontally under the fixed playhead, the TARGET lane showing the ♭3/♭7 of each i7/iv7/V7 and the VOICE-LEADING rail highlighting the chromatic approach into bar 11's return home. The lookahead flag always sits one chord to the right of the playhead so the soloist sees the *incoming* target before the band gets there.

**Why this layout:** the three stacked lanes (SCALE / TARGET / VOICE-LEADING) are the literal pedagogy of "playing the changes" turned into a picture you read at a glance. The voicing strip is one row, not the hero — a soloist needs *where to aim*, not *how to grip*, and can tap to expand a grip when comping.

---

## 3. Interaction & live-sync model

**Playhead = loop position, continuously.** The `●` rides the beat grid driven by the onset/BPM pipeline (`handleOnset` tempo histogram → BPM) and the `findLoopPosition` util (extracted in L-01). Two sync layers:

- **Coarse (chord-accurate, ships first):** the active *station* is whatever `findLoopPosition(chordHistory, detectedProgression)` returns — exactly how `ProgressionBanner` already highlights the loop. Re-uses proven logic; no new timing risk. The playhead snaps station-to-station on each detected change.
- **Fine (beat-interpolated, phase 5 polish):** between detected changes, advance the `●` across the station's beat cells by interpolating `(now − lastOnsetTime) × BPM/60`, clamped to the station's `bars × 4` beats. Purely visual easing — if detection corrects the position, the playhead re-snaps. Degrades gracefully to coarse when BPM is unknown.

**Lookahead.** The station immediately right of the playhead carries a persistent **lookahead flag** ("◀ lookahead"). Its TARGET lane is pre-lit at ~60% brightness a configurable lead (default 1 beat) before the playhead crosses the barline — this is L2's "next-chord preview tier" and the bassist's walking-line scaffold. The flag answers "what's coming" without the player losing the current station.

**Tap to drill deeper (progressive disclosure):**
- **Tap a station** → emits `onChordClick(chord)` (the prop `ProgressionBanner` already fires) so the existing `Fretboard`/`Piano` views light that chord's tones, *plus* a Roadmap-specific extra: the station's two guide tones render in the accent tier and its scale in the pentatonic/scale tiers — i.e. "show me where to aim on the neck."
- **Tap the SCALE label** → toggles the fretboard between the full scale and the chord-tone-only skeleton for that chord (the curriculum's "chord inside the scale" drill).
- **Tap the voicing strip `▸`** → expands that one cell into a full `ChordDiagram` (D-01) inline, without leaving the roadmap. This is the only place Concept C surfaces a real grip; it stays out of the way until asked.
- **Tap TIP** → expands the progression's `tip` plus any `lick.tab` whose `over` matches this progression id, rendered as monospace tab under the highway.

**Live behaviour when no loop is matched.** Fallback to a single-station roadmap centred on `currentChord`: its guide tones, a `getCompatibleScales`-derived scale, and the voicing strip — so the panel is never empty (same fallback contract as the kb-plan §4 matching note).

**Keyboard / a11y.** Left/Right arrows move focus station-to-station (independent of the playhead); Enter = tap; the active station carries `aria-current="true"` and a visible focus ring (`ring-accent`). The playhead has `role="progressbar"` with `aria-valuetext` = current chord + beat. All lane colours meet AA against `bg-panel` (the accent `#a855f7` on `#1a1a1a` and amber `#f59e0b` for the held/secondary tone both clear 4.5:1; dimmed stations never drop below the 0.25 opacity floor the banner already uses for legibility).

---

## 4. KB-data mapping — what's data vs. what's computed

| Roadmap element | Source | Data field / helper |
|---|---|---|
| Station chord names (`Dm7 G7 Cmaj7`) | **derived at runtime** | detected loop → key root + `progression.degrees` + `qualities`, resolved like `getSuggestedProgressions` already does |
| Roman numerals (`ii7 V7 Imaj7`) | **data** | `progression.rn` (display) — falls back to computed `toRomanNumeral` for the no-match case |
| Bars per station (`bar 1 / bars 3-4`) | **data** | `progression.bars` — drives station width on the highway |
| SCALE lane (`D dorian`, `G mixolydian`) | **data, with computed fallback** | KB `improv.scales[{over, scale, why}]` keyed by the chord's `rn`. If a style's pack has no `improv.scales` entry for a degree → **compute** a default from `SCALES`/`getCompatibleScales` (e.g. Mixolydian over a dom7) |
| "avoid 4" / scale caveats | **data** | `improv.scales[].why` (the jazz pack literally says "avoid sitting on the 4th over the maj7") |
| TARGET lane — 3rd & 7th tones | **fully computed** | `getChordTones(chord)` → index 1 = 3rd, last = 7th (per `CHORD_TYPES.intervals` ordering). *No KB field stores guide tones; theory.js derives them.* |
| VOICE-LEADING rails (`C ▶ B`, `F ▶ E`) | **computed** | for adjacent stations, find the 7th of chord *n* and the 3rd of chord *n+1*; draw a rail when they're a half/whole step apart. The "7→3 falls ½" relationship comes from comparing `getChordTones` outputs — pure interval math |
| TARGET-lane prose hint | **data** | `improv.targetNotes` ("Land the 3rd of each chord on the downbeat") |
| Voicing strip (mini grid + `R–3–♭7`) | **data** | `plays[progId][0].chords[i].shape` (rendered tiny) + `.note` label; full grip on tap via `ChordDiagram` |
| TIP line | **data** | `progression.tip`; lick tab from `improv.licks[].tab` filtered by `over === progId` |
| Playhead position | **computed (live)** | `findLoopPosition` (L-01) + BPM from `handleOnset`; no KB data |
| BPM / feel label | **data + live** | `meta.tempoRange` / `meta.feel` for context; live BPM from the onset pipeline |

**Honesty note — the load-bearing computed pieces.** Concept C's two hero lanes are *not in the KB at all*:
1. **Guide tones** (3rd/7th badges) are computed from `getChordTones`. The KB stores *that* a scale fits and *that* the 7th resolves (prose), but never the literal pitches — those are derived per detected key. This is a feature: it stays key-agnostic (kb-plan principle 1) and works in all 12 keys for free.
2. **Voice-leading rails** are computed by diffing consecutive chords' tone sets. No new `theory.js` function is strictly required — `getChordTones` + a small `voiceLeadingPairs(chordA, chordB)` helper (≤15 lines: match each tone of A to its nearest tone in B, keep moves ≤2 semitones) covers it. I'd flag this helper to Maestro as a tiny shared `theory.js`/`match.js` addition Luthier owns; Muse only consumes its output.

Everything else is straight KB reads. The scale lane degrades gracefully: data-driven where a pack authored `improv.scales`, computed-default where it didn't — so the roadmap renders for *any* style cell, even a minimal one.

---

## 5. Pros / cons / what it sacrifices

**Pros**
1. **Directly teaches improv** — guide tones + scale + voice-leading rails are the curriculum's "playing the changes" pillar rendered literally; this is the only concept that answers *"what do I solo with?"* rather than *"what's the chord?"*
2. **Lookahead is built in** — the one-beat-early next-target preview is L2's headline learning feature and the thing a soloist physically needs; it's structural here, bolted-on elsewhere.
3. **Maximises the KB's prose assets** — `improv.scales[].why`, `targetNotes`, `tip`, and `licks` (rich, sourced text the Professor wrote) get top billing instead of being buried under diagrams.
4. **Key-agnostic by construction** — the two hero lanes are computed, so one KB cell drives a correct roadmap in all 12 keys with zero extra data.

**Cons**
1. **Two computed subsystems** (guide-tone extraction, voice-leading pairing) before it looks "real" — more theory.js surface than A or B, which mostly *display* stored data. Mitigated: both are tiny and reuse `getChordTones`.
2. **Horizontal scroll on long forms** — a 12-bar blues exceeds one screen; stations must shrink or scroll. The fixed-playhead / scrolling-highway pattern solves it but is more layout work than a static grid.
3. **Voicing is genuinely secondary** — a player who opened the panel to *find a grip* has to tap to get it. That's the deliberate trade (see below).

**What it sacrifices**
- **Voicing comparison.** Concept B shows 3 ways to grip every chord side-by-side; Concept C shows *one* grip per station as a thumbnail and makes you tap for the rest. A jammer whose actual need is "give me a chord shape right now" is better served by A or B. Roadmap bets that the higher-value, harder-to-find guidance is *where to aim your solo* — and that voicings, being concrete and well-served elsewhere in the app, can wait behind a tap.

---

```PREVIEW
ROADMAP  — improv-first: the loop as a highway you solo across
 ii–V–I in C   Dm7 → G7 → Cmaj7    ♻ 2 bars/chord   ~132 BPM
 ┌── Dm7 (ii7) ──┬─▶ G7 (V7) ◀now ─┬── Cmaj7 (Imaj7) ──┐ ◀ look-
 │  D dorian     │  G mixolydian   │  C major (avoid 4) │   ahead
 │ 3rd●F  7th○C  │ 3rd●B  7th○F    │ 3rd●E  7th○B       │ ← targets
 │   C ──▶ B     │   F ──▶ E       │  ( B holds → loop )│ ← 7→3 rail
 │ ▣▣·▣· shell ▸ │ ▣·▣▣· shell ▸   │ ▣▣·▣· shell ▸      │ ← voicing
 └───────────────┴─────────────────┴────────────────────┘
  ◐────────────────●──────────────────────────────────  playhead
  │··│··│··│··│··│●·│··│··│··│··│··│··│   beat grid (here)
 TIP  7th of one chord falls ½-step to the 3rd of the next:
      C→B, F→E — that two-note rail is the whole map.
 tap a station → its guide tones light up the fretboard ▸
```
