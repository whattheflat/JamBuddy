# Jam Guide — Concept A: "Stage"

> Design concept for the Jam Guide panel (ledger task **D-00a**). One of three concepts; the user picks. Tokens: `bg-surface` #0f0f0f, `bg-panel` #1a1a1a, `border-border` #2a2a2a, accent #a855f7, amber #f59e0b. Colour language inherited from `Fretboard.jsx`: **chord tone = accent purple**, **now-playing = amber**, scale = gray.

## 1. Name + thesis

**Stage** — a stage-monitor for your hands. It optimises for the **half-second glance mid-jam**: the current chord huge and unmistakable, the *next* chord pre-loaded so you can move in time, and exactly **one** big recommended voicing to put your fingers on. Everything a textbook would add collapses away. For the player who is already playing and just needs to be *told the next move*, readable across a rehearsal room.

## 2. Mockup — realistic panel proportions (full-width, short)

Real example: **Standard 12-bar blues in A** (`blues-12bar`, detected loop `A7→D7→E7`), play **"Barre-chord shuffle"** from `blues/guitar.js`. The big diagram is the `E_BARRE7` grip — `{ rootStr:6, offsets:[0,2,0,1,0,0] }` — placed in A: root on low E at fret 5, so the barre sits at fret 5.

```
┌─ JAM GUIDE ──── Blues · 12-bar in A ────────────────── [Guitar▾] [Blues▾] [Stage|Playbook|Roadmap]  ⌃collapse ─┐
│                                                                                                                │
│   NOW                                  ░░░ NEXT ░░░                  ── Barre-chord shuffle ──   I7 IV7 V7      │
│  ┌────────────┐                                                      shuffle · root on 6th str   ● ○ ○ ○       │
│  │            │   ┌────────┐   bar 5 of 12                           ┌──5fr──────────────┐       ○ ○ · ·       │
│  │   A7       │ → │   D7   │   ╾╾╾╾╾╾╾╾╾╾╾○╾╾╾ ── loop ──            e│ ●                 │  ← R   ● ○ · ○       │
│  │            │   └────────┘   ▮▮▮▮▮▮▮▮▮▮░░░░░                       B│ ●                 │  ← 5   ○ ○ ·       │
│  │   I7       │     IV7        2 bars → change                      G│   ●               │  ← 3                │
│  └────────────┘                                                     D│ ●                 │  ← R                │
│   ↑ playing now   prep this                                        A│   ●               │  ← 5                │
│                                                                    E│ ●  (5fr, barre)   │  ← R   "Strum short  │
│  ▸ improv: A mixolydian · target the 3 (C♯)                         └───────────────────┘    — shuffle's in   │
│                                                              R=purple  3=amber accent          the damp hand"  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

The `NOW` block is the loudest thing on screen — a single giant amber chord name with its Nashville/Roman number under it. `NEXT` is a smaller ghosted card to its right with an arrow and a literal countdown ("2 bars → change") fed by the loop-position logic. The right two-thirds is **one** large `ChordDiagram` (the recommended voicing for the *current* chord) plus a 12-bar position strip (`I7 IV7 V7` mini-map) so the eye can confirm where it is in the form without reading the whole grid.

## 3. Interaction & live-sync model

- **Chord change (detection):** when `currentChord` flips, the `NOW` card cross-fades (reuse the 200 ms `scale(0.85)→1` animation already in `ProgressionBanner.jsx`), the old `NOW` slides left into a brief "just played" ghost, and `NEXT` promotes into `NOW`. The big diagram swaps to the new chord's recommended voicing.
- **Loop detected:** the position strip (`▮▮▮▮▮░░░`) and "bar N of 12" appear; without a loop, Stage still works — `NEXT` simply shows the most-likely next chord from `ProgressionSuggestions` and the bar-counter hides.
- **Position in loop:** drives the `NEXT` card and the countdown ("2 bars → change"). The countdown is the differentiator — it lets the player *prepare the grip* before the change lands, which is the whole point of a stage monitor.
- **Animates:** only the `NOW`/`NEXT` swap and the position-strip fill. Deliberately almost nothing else moves, so the panel never competes with playing.
- **Taps:** tap `NOW` diagram → cycle to the *next way to play* this chord (the other plays in the same `plays[id]` array, e.g. "9th-chord stabs"). Tap `NEXT` → make it the focus (peek ahead). Tap the improv line → expand the one-line scale/target hint into the lick. Tap the collapse chevron → shrink to a one-line header (chord + next), the always-visible resting state.

## 4. KB-data mapping (buildable from data we already have — guitar packs exist)

| Panel part | KB source |
|---|---|
| `NOW` / `NEXT` chord names + numerals | detected `currentChord` + matched progression `degrees`/`rn` rendered in the live key (rotation-invariant match, L-01 util) |
| Which progression + "12-bar in A" label | matched `progressions[].id` + `name` + `keyInfo.root` |
| Position strip `I7 IV7 V7` + bar counter | progression `rn` + `bars` arrays; active index from `findLoopPosition` |
| "2 bars → change" countdown | sum of `bars` from active step to the next chord change |
| Big chord diagram | `plays[id][playIndex].chords[step].shape` — movable `rootStr`+`offsets` placed by key (or open `frets`+`onlyRoot`); rendered by `ChordDiagram.jsx` (D-01) |
| "Barre-chord shuffle" label + tip | `plays[id][playIndex].label` + `.tips`; per-chord caption from `chords[step].note` |
| Finger dots / R·3·5 labels | `shape.offsets` → pitch classes vs `getChordTones(currentChord)`; root + 3rd get the colour tier |
| Improv one-liner | `improv.scales[].scale` matched to current chord + `improv.targetNotes` |
| "more ways" on tap | length of `plays[id]` array |

Every field above exists today in the eight shipped guitar packs. Piano/bass packs don't exist yet; Stage degrades cleanly — the instrument tab only lists instruments present in `kb/index.js`, exactly as L-02 specifies.

## 5. Pros / cons / sacrifices

**Pros**
- **Fastest possible read** mid-jam: one chord, one next, one grip — no scanning. The thing the user actually needs in the half-second is the biggest thing on screen.
- **Preparation, not just status:** the `NEXT` card + bar countdown is unique to this concept — it tells you the move *before* it happens, which is what a live monitor is for.
- **Cheapest to build & cheapest to animate:** renders one `ChordDiagram` at a time (vs a full grid), so it's the lightest on the audio thread and the simplest D-01/D-02 surface.

**Cons**
- Shows **one voicing at a time** — you can't compare three ways to play A7 side by side without tapping.
- Less of a "study" surface; a player who wants to learn the whole form's options at rest gets less here than in Playbook.

**Sacrifices:** the full progression grid (all chords × all plays visible at once). Stage trades breadth for legibility — it assumes you'll learn the catalogue at home and use Stage to *perform*.

```PREVIEW
STAGE — one chord, the next, one grip. A stage-monitor for your hands.
┌─ JAM GUIDE · Blues 12-bar in A ················· [Guitar][Blues] ─┐
│  NOW              NEXT          Barre-chord shuffle   I7 IV7 V7    │
│ ┌──────────┐    ┌──────┐       ┌──5fr──────────┐     ▮▮▮▮▮░░░     │
│ │          │ →  │  D7  │      e│ ●             │      bar 5 / 12   │
│ │   A7     │    └──────┘      B│ ●             │                  │
│ │          │   2 bars →       G│   ● ←3        │   ↑ amber = now   │
│ │   I7     │   change         D│ ●             │   ● purple = root │
│ └──────────┘                  E│ ● 5fr barre   │                  │
│  ↑ playing      prep this      └───────────────┘                  │
│ ▸ A mixolydian · target the 3 (C♯)                                │
└───────────────────────────────────────────────────────────────────┘
```
