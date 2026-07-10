# Glance Mode — the Knowledge Center while the jam plays (task D-31)

> **Thesis:** while a loop is live, the Jam Guide section stops being "Roadmap + one
> thumbnail per chord, tap to see more" and becomes a **playhead accordion**: a
> station-aligned rail under the Roadmap where the *current* station's column is
> expanded to the full D-30 voicing gallery (every placeable guitar shape, or every
> piano style, side by side) and every other station shows its recommended thumb.
> The expansion **follows the playhead** — over one loop cycle you see every
> variation of every chord with **zero clicks**. A licks strip for the matched style
> sits directly below, auto-sorted to the chord you're on.
>
> User directive (2026-07-10, verbatim): *"expand the learn session so we see as
> much as possible in voicing variations and styles without having to click buttons,
> the idea is to have it open as the jam is playing."*

**Decision authority:** per the sprint header (user away, no user gate), Muse picks
the strongest layout and records rationale + rejected alternatives (§6).
Implementation is task **L-33**; this doc is its blueprint. Depends on **D-30**
(VoicingBrowser becomes an all-variations gallery — chips removed, every
shape/style rendered simultaneously, each with its own ▶).

---

## 0. What exists today (read from the code, not assumed)

- `JamGuide.jsx` §jam renders `RoadmapAssembly`: `RoadmapTrack` on top, then a
  **voicing strip** — ONE thumb per station (ChordDiagram thumb 75×72 px, or
  MiniPiano D-24 cropped thumb ≈142 px for a 1-octave voicing / ≈266 px for a
  2-octave one), tap-to-enlarge → full diagram + a `VoicingBrowser` mount.
  Variations are therefore **one click away per chord** — the exact thing the
  directive kills.
- `canonicalPos` (playhead station index, canonical KB order) already exists and
  already drives `scrollIntoView` on the strip. **All glance data is already in
  the component.**
- `VoicingBrowser` (post-D-30) renders ALL matching guitar shapes side by side
  (cells ≈90–120 px wide) and all four piano styles side by side (cropped
  MiniPiano thumbs ≈140 px+), each independently playable. Placeable guitar
  shapes per chord: **3–5** (maj: 4 movable + 1 native open; min7/dom7/maj7: 3–4;
  dim/half_dim: 2). Piano styles: always **4** (root/shell/rootlessA/rootlessB),
  or the authored recipe (L-24) plus the computed four.
- `LickCard` has `size="thumb"` and `LicksSection` already knows how to read
  `kb[style].instruments.guitar.licks` defensively.

---

## 1. Chosen layout — the playhead accordion

```
┌ KNOWLEDGE CENTER — ii–V–I in C major ────────────────────────────────── ▲ ┐
│ [▶ Jam Guide ●] [Explore] [Voicings] [Licks & Techniques]                  │
│ [🎸 Guitar][🎹 Piano][🎵 Bass]  ·  [Jazz●][Blues][Rock]…                    │
│ ┌─ ROADMAP ──────────────────────────────────────────────────────────────┐ │
│ │  Dm7 (ii)  ──C→B──  G7 (V) «NOW»  ──F→E──  Cmaj7 (I)   ▁▁▁▂█▂▁▁▁ beat  │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ ┌─ VARIATIONS · follows the playhead ────────────────────────────────────┐ │
│ │  Dm7        ┃ G7 — every shape                      ┃ Cmaj7             │ │
│ │  [thumb]    ┃ [E Barre][A7 Barre][D Shape][Open G7] ┃ [thumb]           │ │
│ │  (recmd.)   ┃   ▶        ▶         ▶        ▶       ┃ (recmd.)          │ │
│ └─────────────┸───────────────────────────────────────┸───────────────────┘ │
│ ┌─ JAZZ LICKS · over the V7 first ───────────────────────────  (scroll) ──┐ │
│ │  [lick thumb «fits G7»] [lick thumb] [lick thumb] …                     │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Columns = stations** (canonical KB order — the kb-plan §4 grid intent,
  finally literal): the rail's columns sit under the Roadmap's stations, same
  order, same labels/rn.
- **Active column = expanded**: the station at `canonicalPos` renders the full
  D-30 gallery (`<VoicingBrowser rootPc quality show={instrument}/>`). Collapsed
  columns render today's recommended thumb (the KB play's shape / the threaded
  piano voicing) — so the loop context and lookahead never disappear.
- **The accordion advances with the playhead.** Chord changes are the animation;
  nothing else moves. Constant footprint: expanding one column collapses the
  previous one, so the rail never grows taller mid-jam.
- **Licks strip** below: thumb LickCards for the active style, level-filtered,
  sorted current-chord-context first (see §2.4).

Why this wins: it satisfies "as much as possible without clicking" *without*
pretending everything fits at once (§3 shows it can't) — across one loop cycle
the player is shown 100% of the variations, always for the chord their hands are
on, which is when a variation is actually learnable.

---

## 2. Auto-follow rules (zero clicks, precisely)

1. **Driver = `canonicalPos`** (already computed in JamGuide from
   `findLoopPosition` + `match.rotation`). Expanded column = `canonicalPos`;
   `position === -1` (loop known but playhead unknown) → station 0 expands, so
   the rail is never all-collapsed. The active column auto-scrolls into view
   (`scrollIntoView({inline:'center'})` — the existing strip pattern, prop-driven
   off `position`, **no rAF, nothing tied to the audio thread**). Respect
   `prefers-reduced-motion`: `behavior: 'auto'` instead of `'smooth'` (new —
   today's strip smooth-scrolls unconditionally; fix while in there).
2. **Instrument tab** (existing) selects the gallery family — guitar shapes vs
   piano styles. It's a mode preference, not a per-chord click; it keeps its
   current default/behaviour.
3. **Loop change** (`match.id` / style / instrument change): rail re-derives from
   the new `stationVoicings`, any pin (§4) resets — this is the *existing*
   `selectedStation` reset effect, renamed. **No loop matched but chords are
   committing** (`currentChord` set, `match.matched` false): the rail degrades to
   a single "heard live" gallery — `parseChord(currentChord)` (the same
   `src/lib/voicings.js` parser `VoicingsSection` uses) → one expanded
   VoicingBrowser, re-aimed on every chord commit. **Nothing heard at all**: the
   existing dashed empty state; no rail, no licks strip.
4. **Licks strip**: `kb[activeStyle].instruments.guitar.licks` (the defensive
   read `LicksSection`'s local `licksFor` helper already implements), shared
   level filter applied. Sort: licks whose `chordContext` matches the current
   station's rn or quality first, with an accent ring + "fits G7 — now"
   microcopy on those; re-sorts as the playhead advances (a reorder of ≤4 thumb
   cards, cheap). `chordContext` is **free text** — the match MUST be
   token-boundary on rn/quality (a naive substring makes rn "I" match "♭VII",
   "Imaj7", "I7"); never ship "fits G7" on a ♭VII lick. The ring + "fits — now"
   microcopy are **strip-owned chrome** rendered around the card — LickCard
   itself shows `chordContext` only at `size="full"` and stays untouched, as §5
   promises. Licks are **guitar-only in the KB**: when the instrument tab is
   piano, the strip still shows the guitar licks (consistent with the existing
   Licks & Techniques section, which does the same) and says so in its heading
   ("guitar licks"). Style has no licks → the strip **hides entirely**; an
   empty state would steal glance space to say nothing.
5. **No auto-sound, ever.** Auto-follow never triggers `chordAudio` — speaker
   output feeds the live mic and would poison the detection that drives the
   playhead (the L-20 caveat becomes a feedback loop). Every ▶ stays a gesture.
   The rail shows the mic-feedback microcopy once, not per gallery.
6. **`onFocusChord` (D-03 Fretboard link) stays gesture-driven.** Auto-follow
   does NOT emit focus-chord — repainting the main fretboard every 2 s
   uninvited would fight the player's own key view. Only a pin (§4) emits it,
   preserving today's semantics exactly.

---

## 3. Density & space budget — honest math

Geometry sources: dock body = 70vh; RoadmapTrack station min-width 168 px + 34 px
rail; ChordDiagram thumb 75×72 px (+label); MiniPiano cropped thumb 142 px
(1-octave voicing) to 266 px (2-octave, e.g. most rootless voicings) × ~51 px
tall; D-30 gallery cells ≈ 90–120 px (guitar) / ≈ 140–280 px (piano) wide,
≈ 140 px (guitar) / ≈ 125 px (piano) tall including label + ▶.

### 1280 × 900 (the target the task names)

Vertical: dock body 630 px − section nav ≈ 49 − instrument/style row ≈ 47 −
content padding 32 − RoadmapTrack ≈ 230 − gap 16 = **≈ 256 px glance budget**.

- Guitar rail (heading + one row of cells ≈ 190 px): **fits**. ~66 px spare.
- Piano rail (≈ 175 px): **fits**.
- Licks strip (thumb LickCard ≈ 165 px; heading + thumb row ≈ 190 px): does
  **NOT** also fit — 190 + 190 = 380 > 256. It sits just below the fold,
  reachable by the dock's existing vertical scroll (a flick, not a click).
  Fully above the fold only from ≈ 1070 px window height. Said plainly:
  **at 1280×900 you get Roadmap + the full variations rail without scrolling;
  licks are one scroll-flick down.**

Horizontal (~1200 px usable): collapsed guitar column ≈ 95 px; collapsed piano
column ≈ 160–280 px (D-24 crop width varies with voicing span); expanded guitar
gallery 3–5 cells ≈ 340–540 px. **Expanded piano gallery — the honest figure:**
root/shell cells are 1-octave crops ≈ 160 px, but **rootless A/B of any true-7th
chord span past one octave** (e.g. Dm7 rootlessA → notes [17, 21, 24, 28]), so
D-24's crop gives them a 2-octave keyboard = 266 px thumb ≈ 284 px cell. The
gallery is therefore 160 + 160 + 284 + 284 + gaps + section p-3 ≈ **940 px** —
not the ~640 px four 1-octave cells would suggest.

| Loop | Guitar rail width | Piano rail width | One row? |
|---|---|---|---|
| 3–4 stations | 2–3×95 + ~450 ≈ **640–740 px** | 2–3×~200 + ~940 ≈ **1350–1550 px** | guitar ✓ · piano ✗ (scrolls at ~1200 usable) |
| 8 stations (post-L-30) | 7×95 + ~450 ≈ **1115 px** | 7×~200 + ~940 ≈ **2300 px** | guitar ✓ (just) · piano ✗ |

**Cut order (what goes first):**
1. **Licks strip drops below the fold** (never cut, just deferred to scroll).
2. **Rail scrolls horizontally** with the active column auto-centred (the
   existing strip pattern) — cells are **never shrunk** below the D-30 sizes;
   a diagram you can't read is worth less than one you scroll to. This is the
   piano rail's **normal state on any loop containing 7th chords — i.e. most
   of them** (a rootless gallery is ~940 px on its own), not just long loops;
   L-33's commit-5 viewport check must expect the piano rail to scroll, never
   assert "one row fits".
3. **Narrow only (§ below): collapsed columns reduce to "next" only.**

### ~640 px wide (half-snapped window)

~576 px usable. The rail flips to the kb-plan §4 narrow rule — one thing per row:
- Row 1: the expanded gallery for the current station (guitar: 5 cells wrap to
  2 rows ≈ 300 px; piano: 4 cells wrap to 2 rows ≈ 260 px).
- Row 2: a single **"next: Cmaj7"** collapsed thumb (lookahead is the one piece
  of context worth its pixels at this width); other stations are dropped — the
  Roadmap above still shows the whole loop.
- Licks strip: single-column, below, via vertical scroll.
Glance guarantee at narrow = **current chord's full gallery + the next chord's
thumb**, no interaction.

### 1280 × 800 (the older Electron-default figure in D-20)

Budget shrinks to ≈ 186 px — the guitar rail (~190 px) is 1 row of cells with the
heading merged into the rail's top edge (drop the standalone heading line,
−18 px) and fits; everything else as at 900.

---

## 4. Interaction stays optional (but stays)

Nothing essential is behind a click; everything useful still responds to one:

- **▶ per gallery cell** (D-30): audition that voicing. Keyboard-reachable,
  descriptive `aria-label`s, one-at-a-time playback (D-30's stop-previous
  contract).
- **Pin a station**: tapping a *collapsed* column pins its gallery open,
  overriding auto-follow (the accordion stops moving) — this **replaces**
  today's tap-to-enlarge and inherits its semantics: the pinned station emits
  `{rootPc, quality}` via `onFocusChord` (D-03 Fretboard guide tones), and the
  existing reset effect (loop/style/instrument change → null) clears it.
  Unpin = tap again or tap the visible "follow the jam" chip that appears while
  pinned. `aria-pressed` on columns, `aria-current` on the live one.
- **Tap a lick thumb** → the card enlarges inline (`size="full"`); tap again to
  collapse. The thumb already shows the full tab shape — enlarging is comfort,
  not information.
- **Chord label tap** → `onChordClick` → ChordDetailModal, as everywhere else.

Focus order follows DOM order (columns left→right, then licks); all targets keep
`focus-visible:ring-2 ring-accent`, min 32 px height. Tokens only — everything
here uses existing `surface/panel/border/accent` + amber; **no new colour**.
Contrast inherits the measured D-20 §8 commitments (accent small text on
`bg-surface` cards; gray-400 floor for load-bearing labels; gray-500 microcopy
only).

---

## 5. Migration order for L-33 (green at every commit)

**App.jsx contract: UNTOUCHED — zero changes, not even additive.** Every input
glance mode needs (`detectedProgression`, `keyInfo`, `chordHistory`, `bpm`,
`currentChord`, `onFocusChord`, `onChordClick`) already flows into JamGuide.
Audio callbacks are therefore untouched by construction. If L-33 finds a gap,
the rule is prop-addition-only on the existing mount, never a callback/ref edit.

Files (for Maestro to re-lock at promotion):

| File | Kind of change |
|---|---|
| `src/components/GlanceRail.jsx` | **NEW** — pure presentational: props `{ stations, activeIndex, pinnedIndex, onPin, instrument, keyRoot }`; composes collapsed thumbs (existing ChordDiagram/MiniPiano) + one `<VoicingBrowser show={instrument}/>` for the expanded column |
| `src/components/JamGuide.jsx` | **Restructured (jam section only)** — RoadmapAssembly's voicing strip + enlarge block replaced by GlanceRail + LicksStrip; `selectedStation` becomes `pinnedStation` (same reset effect, same `onFocusChord` wiring); `licksFor` — today a closure-local function inside `LicksSection` (JamGuide.jsx:489), not an export — is **lifted out during the restructure** and shared with the strip. Sections 2–4, the shell, nav, and collapsed bar untouched |
| `src/components/VoicingBrowser.jsx` | **Additive-optional** — a `dense` prop (trim section padding, suppress the per-mount mic microcopy since the rail shows it once). Skip entirely if the D-30 cells already sit within the §3 budget |
| `src/components/LickCard.jsx` | **Untouched** (`thumb`/`full` already exist) |
| `src/App.jsx`, `RoadmapTrack.jsx`, `MiniPiano.jsx`, `ChordDiagram.jsx`, all `src/lib/**` | **Untouched** |

Commit order:

1. **Extract `GlanceRail.jsx`** rendering *today's* strip behaviour verbatim
   (thumbs + tap-to-enlarge), JamGuide mounts it — a pure move, zero visual diff.
2. **Accordion**: expanded column = `activeIndex` (auto-follow off
   `canonicalPos`), pin/unpin replaces tap-to-enlarge, the VoicingBrowser mount
   moves from the enlarge block into the expanded column; reduced-motion guard
   on the auto-scroll.
3. **No-loop fallback**: `parseChord(currentChord)` single gallery.
4. **LicksStrip**: thumb cards, level filter, context-first sort + live ring,
   hide-when-empty, tap-to-enlarge.
5. **Narrow reflow + cut rules** (§3): horizontal-scroll behaviour, ≤640 px
   next-only collapse; check 1280×900, 1280×800, ~640 px.

Each commit: `npm run build` + `node scripts/smoke.mjs` green; Critic gates.

---

## 6. Rationale + rejected alternatives (no user gate this sprint)

**Chosen — playhead accordion**, because: (a) it is the kb-plan §4 grid
(columns = chords, active-column highlight, narrow → one-per-row) applied to
variations; (b) constant footprint that survives 8-station loops (L-30) instead
of degrading; (c) 100% of variations shown per loop cycle with zero clicks, and
always for the chord under the player's hands — the moment a grip is learnable;
(d) it *reuses* D-30's gallery as-is and App.jsx needs nothing.

**Rejected A — "everything expanded" grid** (every station × every variation at
once — the literal maximal reading of the directive). Killed by §3's math: piano
is 4 stations × 4 styles = 16 cells at the honest §3 sizes (rootless cells
≈ 284 px) ≈ **3,500+ px** wide, or 3+ wrapped rows ≈ 480 px
tall — both force scrolling *while playing*, which is worse than zero clicks:
it's continuous manual tracking. At 8-station loops it's hopeless on any
viewport. Guitar-only at exactly 3 stations barely fits — a layout that only
works for its demo case is not a design.

**Rejected B — "Now panel"** (full-width mega-view of only the current chord:
giant gallery + licks + scale, no station columns). Maximum per-chord detail,
but it discards lookahead — mid-jam the *next* chord matters more than the one
already sounding — and at 120 BPM a 4-chord loop swaps the entire panel every
~2 s: visually violent, nothing is on screen long enough to read. The accordion
keeps 80% of the detail and all of the context.

**Rejected C — side-by-side split** (Roadmap left, variations dock right).
A 4-station track already needs 4×168 + 3×34 ≈ 774 px; splitting 1280 gives it
~640 — the flagship Roadmap gains a permanent horizontal scrollbar to make room
for a panel that duplicates its station order 90° rotated. Collapses entirely at
narrow. Rejected on viewport economics.

**Rejected D — timed carousel** (auto-cycle variations for the current chord
every N seconds). Zero clicks, technically — but motion untied to the music is
the most distracting thing a stage display can do, and it invents a second clock
next to the playhead. The music already provides the rhythm of change; follow it.

---

## 7. Out of scope / flags for Maestro

- **Explore/Voicings/Licks sections**: unchanged; glance mode lives entirely in
  the jam section. (The Voicings section already follows `currentChord` — that
  behaviour is untouched.)
- **Piano collapsed-thumb width variance** (142–266 px per D-24's span-crop) is
  the piano rail's main width pressure; if Critic finds real loops where it
  reads badly, a future D-task could cap collapsed piano thumbs to a 1-octave
  window around the bass — **not** in L-33's scope.
- **`dense` prop on VoicingBrowser** is optional and Muse-owned; L-33 should
  attempt the rail with plain D-30 cells first.
- No new tokens, no new dependencies, no KB/theory/audio changes anywhere in
  this design.
