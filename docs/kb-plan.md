# Knowledgebase Plan — Styles × Instruments × Progressions × Voicings

The plan for building JamBuddy's **jam knowledgebase**: an intermediate guide to the standard progressions of each style (Jazz, Blues, Rock, Bossa Nova, …) and the different ways to *play* them per instrument (guitar first, then piano, then bass) — expandable one session at a time via a repeatable loop, and rendered live in a large **Jam Guide** panel at the bottom of the app.

Three principles drive everything:

1. **Key-agnostic data.** Everything is stored as scale degrees and movable shapes, never absolute chords. The app detects the key; one KB entry renders in all 12 keys. This is the same convention `PROGRESSIONS.degrees` and the movable shapes in `voicings.js` already use.
2. **Machine-verifiable quality.** A validator proves every voicing actually contains the chord's tones before content lands. That's what makes agent-generated content trustworthy over many loop iterations.
3. **One bounded cell per session.** Each expansion session completes exactly one style × instrument cell (researched, authored, validated, committed). Small enough to review, big enough to matter.

---

## 1. Architecture

```
src/data/kb/
  index.js                 — registry aggregating all styles (UI reads only this)
  SCHEMA.md                — the authoring contract (formats below, with one full example)
  jazz/
    meta.js                — { id, label, feel, tempoRange, character }
    progressions.js        — the style's standard progressions (instrument-independent)
    guitar.js              — guitar pack: plays + comping + improv
    piano.js               — piano pack
    bass.js                — bass pack
  blues/ …                 — same shape per style
scripts/
  validate-kb.mjs          — quality gate, run with `node scripts/validate-kb.mjs`
docs/
  kb-backlog.md            — the cell matrix with statuses (the loop's queue)
```

`index.js` imports whatever style folders exist — the Jam Guide's style tabs grow automatically as the loop fills cells. A style is usable for one instrument before the others exist (guitar-first rollout).

### Progression entry (per style)

```js
// kb/jazz/progressions.js
export default [
  {
    id: 'jazz-251-major',
    name: 'ii–V–I',
    rn: ['ii7', 'V7', 'Imaj7'],
    degrees: [2, 7, 0],                    // semitone offsets from key root
    qualities: ['min7', 'dom7', 'maj7'],   // keys of CHORD_TYPES in theory.js
    bars: [1, 1, 2],
    mode: 'major',
    songs: ['Autumn Leaves', 'All The Things You Are'],
    tip: 'The 7th of each chord resolves down a half-step to the 3rd of the next.',
  },
  // … 4-8 progressions per style (see docs/progression-repertoire.md §1 for the lists)
]
```

### Instrument pack — guitar

```js
// kb/jazz/guitar.js
export default {
  styleIntro: '2-3 sentences on the guitarist's role in this style.',
  comping: [{ label: 'Four-to-the-bar (Freddie Green)', rhythm: '♩ ♩ ♩ ♩', description: '…' }],
  plays: {
    'jazz-251-major': [                    // ≥2 "ways to play" per progression
      {
        label: 'Shell voicings',
        level: 'intermediate',
        chords: [                          // one entry per progression step
          { shape: { rootStr: 5, offsets: ['x', 0, 'x', 0, 1, 'x'], fingers: [0,1,0,2,3,0] },
            note: 'root–♭7–♭3' },
          // …
        ],
        tips: 'Stay light; the 3rds and 7ths do all the work.',
      },
      { label: 'Drop-2 on top four strings', /* … */ },
    ],
  },
  improv: {
    scales: [{ over: 'ii7', scale: 'dorian', why: '…' }],
    targetNotes: 'Land the 3rd of each chord on beat 1.',
    licks: [{ tab: 'e|---…', description: '…', over: 'jazz-251-major' }],
  },
}
```

**Shape format** follows the existing `voicings.js` convention so the renderer is shared: movable shapes use `rootStr` + `offsets` relative to the root fret (renders in any key); open shapes use absolute `frets` + `onlyRoot` (pitch class) and only render when the key matches. Strings are arrays of 6, low-E first, `'x'` = muted.

### Instrument pack — piano

Voicings are **interval recipes** resolved per chord quality (no fingering data needed):

```js
plays: {
  'jazz-251-major': [
    {
      label: 'Rootless A/B alternation',
      level: 'intermediate',
      chords: [
        { recipe: { LH: ['3', '5', '7', '9'] }, note: 'Type A' },     // ii7
        { recipe: { LH: ['7', '9', '3', '13'] }, note: 'Type B' },    // V7
        { recipe: { LH: ['3', '5', '7', '9'] }, note: 'Type A' },     // Imaj7
      ],
      register: 'top note between C4 and C5',
      tips: 'Alternate types so inner voices barely move.',
    },
  ],
}
```

Degrees are chord-degree strings (`'1' '3' 'b7' '9' '13'`); the resolver maps them through the chord quality's intervals (which `theory.js` chord templates already encode).

### Instrument pack — bass

Line patterns per progression step, in degrees plus approach annotations:

```js
plays: {
  'blues-12bar': [
    {
      label: 'Walking, chromatic approach',
      level: 'intermediate',
      bars: [{ beats: ['R', '3', '5', 'chrom→next'] } /* … per bar */],
      tips: 'Beat 1 is always the new root; beat 4 walks into it.',
    },
  ],
}
```

---

## 2. Quality gates

### Mechanical — `scripts/validate-kb.mjs` (must pass before any commit)

- ids unique; every `plays` key references an existing progression id; `chords`/`bars` length matches the progression length
- `degrees` ∈ 0–11; `qualities` are keys of `CHORD_TYPES`; `mode` is a known mode
- guitar shapes: 6 entries per array, frets 0–15, **fret span ≤ 4** (intermediate hands), and — the strong check — the shape's computed pitch classes (standard tuning EADGBE) must contain the chord's root and defining tones (3rd/7th or quality equivalent) and contain **no out-of-chord tones**
- piano recipes: every degree resolvable for that chord quality
- coverage per cell: ≥ 4 progressions, ≥ 2 plays per progression, improv section present (guitar/piano), styleIntro present

### Musician checklist (human/agent self-review, in SCHEMA.md)

- Are the plays *idiomatically different* (register, density, difficulty), not just transpositions of each other?
- Is each play genuinely intermediate — no 5-fret stretches, no 2-octave rootless clusters?
- Does the style actually sound like the style (bossa ≠ jazz with different labels: distinct rhythm descriptions)?
- Do tips teach a *transferable* idea (voice leading, register, space), not just "play this"?

---

## 3. The expansion loop

### The queue

`docs/kb-backlog.md` holds the matrix of cells with statuses (`todo` / `in-progress` / `done` + date + coverage). Order: **all guitar cells first** (most voicing complexity — it sets the quality bar), then piano, then bass. Style priority within each instrument: jazz → blues → rock → bossa → funk → reggae → country/folk → R&B/neo-soul → gospel → pop.

### The session protocol (encoded as the `/kb-expand` project skill)

Each session:

1. **Orient** — read this plan, `SCHEMA.md`, the backlog, and the gold-standard cell (`kb/jazz/guitar.js`, the first one built).
2. **Claim** — take the first `todo` cell, mark it `in-progress`.
3. **Research** — dispatch web-research agent(s) for that style × instrument: the style's standard progressions (cross-check against `docs/progression-repertoire.md`), the 2-3 idiomatic intermediate ways to play each, comping rhythms, improv approach. Named sources required.
4. **Author** — write `progressions.js` (if the style is new) and the instrument pack, conforming to SCHEMA.md.
5. **Validate** — run `node scripts/validate-kb.mjs`; fix until green; run the musician checklist.
6. **Integrate** — register the style in `kb/index.js`; `npm run build` must pass.
7. **Record** — mark the cell `done` with date + coverage stats in the backlog; commit (`kb: add <style> <instrument> pack`).
8. **Report** — summarize what was added and name the next cell.

**Session 0 (bootstrap):** if `src/data/kb/`, `SCHEMA.md`, or the validator don't exist yet, the first session builds them *plus* the jazz/guitar gold-standard cell. Every later session imitates that exemplar.

### How to run it

- One session: type **`/kb-expand`** — does exactly one cell.
- Several in a row: `/loop /kb-expand` and let it self-pace, or run `/kb-expand` whenever there's time.
- Review cadence: cells are individual commits on a branch — review/merge per instrument tranche if preferred.

30 cells ≈ 30 short sessions; guitar's 10 cells deliver user-visible value immediately because the Jam Guide reads whatever exists.

---

## 4. The Jam Guide panel (UI)

A large panel at the **bottom of the main scroll** — while jamming you scroll down and the current progression's playbook is laid out to fit the screen.

```
┌─ JAM GUIDE ─────────────────────────────── [Guitar|Piano|Bass]  [Jazz][Blues][Rock][Bossa]… ─┐
│  Matched: ii–V–I in G major        your loop:  Am7 → D7 → Gmaj7                              │
│                                                                                              │
│                 Am7 (ii7)         D7 (V7)          Gmaj7 (Imaj7)                             │
│                 ▼ playing now                                                                │
│  Shells         [diagram]         [diagram]        [diagram]       root–3–7, four-to-the-bar │
│  Drop-2         [diagram]         [diagram]        [diagram]       top-4 strings, stays high │
│  Triads 1-3     [diagram]         [diagram]        [diagram]       fills between vocal lines │
│  ─────────────────────────────────────────────────────────────────────────────              │
│  IMPROV   D dorian → G mixo → G major  ·  target the 3rds: C → F# → B  ·  lick ▸ tab…        │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Component:** `JamGuide.jsx`, mounted last in `App.jsx`; collapsed header always visible, expands to ~70vh.
- **Inputs:** `keyInfo`, `detectedProgression`, `currentChord` — plus instrument + style selection (persisted in settings; style tabs are generated from `kb/index.js`, so the panel grows as the loop runs).
- **Matching:** convert the detected loop to degrees relative to the key root, match against the selected style's progressions **rotation-invariantly** (same canonicalization idea as `detectRepeatingProgression`). No match → fallback: per-chord voicing alternatives from `voicings.js`, so the panel is never empty.
- **Live sync:** the active chord column highlights using the loop-position logic in `ProgressionBanner.jsx` (`findLoopPosition` — extract it to a shared util). The player reads the *next* voicing in time, in rhythm with the band.
- **Diagrams:** new small renderers — `ChordDiagram.jsx` (6-string × 5-fret SVG grid, consumes the shape format), `MiniPiano.jsx` (~2-octave SVG, highlights resolved recipe notes), bass patterns as degree badges (R · 3 · 5 · ♭7) over a mini string diagram. Reuse design tokens (`bg-panel`, `border-border`, accent purple for chord tones).
- **Smart fit:** CSS grid — columns = progression chords (4–6), rows = plays; rows beyond what fits collapse behind "more ways ▾"; diagrams scale to column width; on narrow windows the grid flips to one play per row, chords scrolling horizontally.
- **Key-aware rendering:** movable shapes get their fret position computed from the detected key; open shapes appear only when the chord's root matches; piano recipes resolve through the chord quality. All 12 keys for free, per principle 1.

---

## 5. Phases

| Phase | What | Outcome |
|---|---|---|
| 0 | Foundation: `kb/` dirs, `SCHEMA.md`, validator, backlog, `/kb-expand` skill, jazz/guitar gold standard | The loop exists and has an exemplar |
| 1 | Jam Guide MVP: panel + matching + guitar `ChordDiagram` + live sync | jazz/guitar visible in the app while jamming |
| 2 | Loop guitar cells: blues, rock, bossa, funk, reggae, country, R&B, gospel, pop | Full guitar guide across styles |
| 3 | Piano: `MiniPiano` renderer + recipe resolver, loop piano cells | Second instrument live |
| 4 | Bass: pattern renderer, loop bass cells | Third instrument live |
| 5 | Polish: improv layer with tabs/licks, Progression Builder integration (GOAL G3), ToneGym-style tap-to-hear | Guide ↔ Builder round-trip |

### Success criteria

- During a jam, scrolling to the Jam Guide shows ≥ 3 ways to play the detected progression on the selected instrument, in the detected key, with the active chord highlighted in time.
- `/kb-expand` completes a cell in one session with the validator green, no hand-holding.
- A new style added by the loop appears in the UI with **zero code changes** (data + registry only).
- An intermediate player can switch Jazz → Bossa over the same ii–V–I and see *genuinely different* voicings and rhythm guidance.
