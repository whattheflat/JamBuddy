# Dashboard polish — rail + licks (task D-70)

Concept doc for `sprint-dashboard-polish`. Revises the rail/licks layout that
`docs/design/one-screen.md` §4 and D-51 established, per the user directive of
2026-07-13 ("this looks amazing" + six refinements). No code here — this specs
the two bounded implementation tasks **L-70** (rail) and **L-71** (licks) and
proves the numbers.

Design tokens only (`tailwind.config.js`): `surface` #0f0f0f, `panel` #1a1a1a,
`border` #2a2a2a, `accent` #a855f7, plus the SVG note language already mirrored
in `MiniPiano`/`ChordDiagram`/`LickCard` (amber #f59e0b secondary, ACCENT_SOFT
#c084fc chord-tone, BASS_RING #fbbf24). No new colour is introduced.

The column geometry we build against (from D-51 / one-screen.md §4, unchanged):

```
right column          500px
 − section border+p-2  −18
 − row border+p-1.5    −14
 − vertical scrollbar  −17 (classic Windows) … −8 (the thin bar we add in §2)
 = row interior        451px worst case (classic) · 460px (thin) · 468 (none)
```

All fits below are proven against the **conservative 451px** interior; the thin
scrollbar we introduce in §2 only ever makes them more comfortable.

---

## 0. Scope boundary — dashboard only (user refinement 2026-07-13)

> "perhaps within the knowledge center it could be nice but leave it for now as
> is, only in the main JAM FULL SCREEN we need to optimize what we show."

**The net boundary (two settled user clarifications, 2026-07-13):**

- **Dashboard** (always-open band + ⛶ jam-view fullscreen) = **full visual
  optimisation**: guitar ≤4, 2×2 smaller piano, uniform licks, dark scoped
  scrollbars, no ▶.
- **Knowledge Center dock** (`KnowledgeDock`'s VoicingsSection + LicksSection,
  the Circle of Fifths) **and `ChordDetailModal`** = **layout UNCHANGED** (all
  shapes, normal piano, current lick size) **except the ▶ play buttons are
  removed** — the user decided "then leave them off, better not," so ▶ comes off
  **everywhere**, not just the rail.

So there are **two** kinds of change with **two** scopes: the *visual layout*
changes are **dashboard-only** (gated behind the dashboard fork), while the
*▶ removal* is a **deliberate global** change across every mount.

The trap is **shared components**:

| component | dashboard mount | Knowledge Center / modal mount | how they differ today |
|---|---|---|---|
| `VoicingBrowser` | GlanceRail rows + heard-live (`dense`) | VoicingsSection + ChordDetailModal (**no `dense`**) | the `dense` flag already forks them |
| `LickCard` | LicksStrip (`size="thumb"`) | LicksSection (`size="full"`) | the `size` prop already forks them |
| `MiniPiano` | rail thumbs (`size="thumb"`) | modal/ExplorePanel (`size="thumb"`/`"full"`) | needs a **new** `size="mini"` variant |
| `PianoLickCard` | LicksStrip (new wiring) | **never mounted** | no KC concern at all |

**The rule: gate the *visual* optimisations behind the dashboard fork and change
no default there; remove ▶ globally.** Concretely:

- `VoicingBrowser` — *visual, dashboard-only:* guitar ≤4 + piano 2×2 apply
  **only under `dense`** (the flag only dashboard mounts pass); non-dense
  (VoicingsSection + ChordDetailModal) keeps **all shapes + the normal piano
  layout**. *Global:* the ▶ is **removed from the component outright** (§3) — no
  mount wants it anymore.
- `MiniPiano`: the smaller keyboard is a **new additive `size="mini"`**; `thumb`
  and `full` are byte-untouched, so the modal/ExplorePanel render identically.
- `LickCard`: the uniform footprint is imposed **at the dashboard-strip mount**
  (a wrapper box), **not** in `LickCard` — its default footprint is unchanged.
  `LickCard` itself is edited only if it must lose a ▶ (it has none — see §3.3),
  so the dock's LicksSection (`size="full"`) renders unchanged. `PianoLickCard`
  is all-new to the strip.
- Scrollbar CSS: a **scoped `.dark-scroll` class** on the dashboard scrollers
  only — the KC's own scrolling keeps the OS default.

**Restated L-70/L-71 byte-identity DoD:** the dock's VoicingsSection /
LicksSection and `ChordDetailModal` render **byte-identical to today EXCEPT the
▶ buttons are gone** (the D-41/D-51 non-dense-mount precedent — Critic
diff-checks it: the only permitted diff in those mounts is the removed play
button + its now-dead wiring).

---

## 1. Guitar: ≤4 shapes, recommended-first (dashboard `dense` only)

### 1.1 What changes structurally

Today the rail's guitar station shows a **separate own-cell** (the KB play's
recommended shape, accent border, "play" badge — `GlanceRail` StationRow
:215-231) **plus** `VoicingBrowser`'s full gallery of *every* placeable shape
(`matchingShapes` :76 returns all). Two problems: (a) the recommended shape is
usually also in `matchingShapes`, so it renders **twice**; (b) `maj`/`min`/`dom7`
have 5-6 placeable shapes, so own-cell + gallery = 6-7 cells that wrap to a
second line.

**Decision:** centralise the ≤4 rule inside `VoicingBrowser` and **delete the
separate own-cell**. `GlanceRail` passes the recommended shape down; the browser
renders it as the badged first cell and caps the total.

- New `VoicingBrowser` props (additive, default-off so modal/dock stay
  byte-identical): `recommended` (a shape object) and `max` (number).
- `GlanceRail` (dense rail) passes `recommended={st.shape}` and `max={4}`.
- Non-dense mounts (`ChordDetailModal` Guitar tab, `KnowledgeDock` VoicingsSection)
  pass neither → they keep showing **all** shapes with no cap (a detail view
  should be exhaustive; the ≤4 fit constraint is the rail's alone).

This removes the pre-existing duplicate and guarantees ≤4 in one place.

### 1.2 The top-4 selection rule (exact ordering + tiebreak)

`matchingShapes(quality, rootPc)` still returns every placeable shape. The rail
then orders and slices:

1. **Recommended first** — the KB play's shape (`recommended`, matched into the
   list by `label`; if it was filtered out as unplaceable, prepend it anyway).
   Badged `play`, accent border — "the answer" prominence the old own-cell had,
   now cell #1 of the row.
2. **Open-position forms** — shapes with an `Array.isArray(shape.frets)` grip
   (open chords). They sit at the nut, sound the most idiomatic, and are what a
   player reaches for first.
3. **Movable / barre forms by lowest base fret ascending** — closest to the nut
   first (easiest hand position, most common voicing). Base fret is the value
   `matchingShapes` already computes (`mod12(rootPc − OPEN_PCS[idx])`, 0→12).
4. **Tiebreak** at equal category/base fret: **fewer muted strings first**
   (count of `'x'` in `frets`/`offsets` — a fuller voicing wins), then the
   shape's **declared order in `GUITAR_SHAPES[quality]`** (stable, honours the
   KB author's priority). Deterministic — no reflow flicker as the root moves.

Take the first **4** (recommended + up to 3 more, recommended deduped so it
never repeats). **Qualities with <4 placeable shapes just show what they have**
— the rule is a cap, never padding; nothing is invented to reach four.

### 1.3 It fits one line

Guitar `GalleryCell` (dense, **no play button** — see §3): `ChordDiagram` thumb
75px + p-1.5 (12) + border (2) = **89px** box. Four across:

```
4×89 + 3×6 (gap-1.5) = 356 + 18 = 374 ≤ 451 ✓   (a 5th would be 469 ✗)
```

Four shapes on **one horizontal line, no wrap, no scroll** — exactly the user's
"4 guitar options visible so it would fit without scrolling."

---

## 2. Piano: 2×2 of compact MiniPianos (dashboard `dense` only)

### 2.1 The grid

**Under `dense`** the four `pianoVoicing` styles (`root` / `shell` / `rootlessA`
/ `rootlessB`, `PIANO_STYLES` :67) render as a **2-column × 2-row CSS grid**
(`grid-cols-2 gap-1.5`) — one clean 2×2 per chord. **Non-dense** (VoicingsSection,
ChordDetailModal) keeps today's flex-wrap gallery at `MiniPiano size="thumb"`
(0.8) with ▶ — byte-identical. As with guitar, the **separate own-cell is
dropped for piano**; the 2×2 *is* the chord's voicings. If the station's
authored voicing corresponds to one of the four styles (match on
`voicing.style`), that cell gets the accent border — the "recommended" signal,
for free, without a fifth cell. (Fuzzy-authored voicings that match no style →
no highlight; honest.)

Because the own-cell is gone, the piano grid spans the **full row interior**
(the `basis-[320px] flex-1` gallery column grows to ~451px), so each of the two
grid columns is `(451 − 6)/2 = 222.5px`.

### 2.2 The scale — arithmetic

`MiniPiano` VOICING thumb geometry: `baseW = 22·(7·OCTAVES + 1) + 2`,
`SVG_W = baseW · scale`, `SVG_H = (60 + 4)·scale`. Today `thumb` scale = **0.8**:

| crop | baseW | SVG_W @0.8 | cell box @0.8 (+14) | two-up + gap |
|---|---|---|---|---|
| 1-octave | 178 | 142.4 | 156.4 | 318.8 ≤ 451 ✓ |
| 2-octave | 332 | 265.6 | 279.6 | **565.2 > 451 ✗** |

So 0.8 **cannot** put two 2-octave crops side by side (the brief's 532>456). The
2-octave crop (the rootless 7th-chord voicings — `rootlessA/B` of `min7`/`dom7`/
`maj7` whose span pushes past one octave) dictates the scale. Solve for a column
of 222.5px:

```
332·scale + 14 ≤ 222.5  →  scale ≤ 208.5 / 332 = 0.628 (the ceiling)
```

**Chosen: a new uniform `size="mini"` at scale 0.60** — below the 0.628 ceiling,
leaving a robust ~19px margin for sub-pixel rounding and the classic-scrollbar
worst case:

| crop @ **0.60** | SVG_W | cell box (+14) | two-up + gap (6) | fits 451? |
|---|---|---|---|---|
| 1-octave | 106.8 | 120.8 | 247.6 | ✓ (203 spare) |
| 2-octave | 199.2 | 213.2 | **432.4** | ✓ (18.6 spare) |

`grid-cols-2` sizes every cell to the 222.5px column, so 1- and 2-octave cells
share one uniform grid — a true 2×2 at both crops. A thumb crop never exceeds
**2 octaves** (a 4-note `pianoVoicing` spans ≤24 semitones; `OCTAVES =
ceil((maxNote − octStart·12)/12) ≤ 2`), so 2-octave is the proven worst case —
no 3-octave escape hatch needed.

### 2.3 Legibility at 0.60 — the marks stay honest

White key = 22·0.60 = **13.2px** wide (vs `ChordDiagram`'s 11px string gap —
comparable, legibly playable). The root/bass signal is carried **primarily by
colour**, which does not shrink in meaning: root key = full accent #a855f7, other
tones = ACCENT_SOFT #c084fc, bass = amber ring #fbbf24 — the established tier
language. The "R" glyph and the amber ring are secondary reinforcement. Because
the SVG viewBox scales text with the keys, at 0.60 the `R` renders ~4.8px and the
ring ~1.2px — thin. **So `size="mini"` bumps the in-SVG `R` fontSize (8→10 in
viewBox units) and the bass-ring `strokeWidth` (2→2.5)** so both stay readable at
the smaller render. This is an additive branch in `MiniPiano.jsx` (Muse-owned SVG
renderer); the existing `thumb`/`full` paths are byte-untouched, so the modal and
dock render identically.

### 2.4 Row height (piano)

`MiniPiano` mini SVG_H = 64·0.60 = **38.4px**. Piano `GalleryCell` (dense, no
play): caption ~13 + gap-1.5 (6) + SVG 38.4 + p-1.5 (12) + border (2) = **71.4px**.
Two rows + grid row-gap (6) = **148.8px** for the 2×2 block — versus the old
gallery's ~3 wrapped cell-lines of ~118px each (~366px). Nearly halved (§6).

---

## 3. Remove ▶ everywhere (deliberate global removal)

Standing principle (memory): **glance over audio.** The user settled it — "then
leave them off, better not." So ▶ comes off **every mount**: the dashboard rail,
the dashboard strip, **and** the Knowledge Center + `ChordDetailModal`. Because no
mount wants playback, the machinery is **deleted outright**, not gated — this is
intended, not a side-effect.

### 3.1 `VoicingBrowser.jsx` (L-70) — delete the play machinery

- The `PlayButton` component (:103-121).
- `import { playVoicing, guitarShapeToNotes } from '../lib/chordAudio'` (:62).
- `handleRef` + `stopCurrent` (:184-188) and the `useEffect(() => stopCurrent,
  [chordKey])` cleanup (:191) — both now dead.
- `playGuitar` / `playPiano` handlers (:197-211).
- The `<PlayButton>` inside `GalleryCell` (:149) and its `playLabel`/`onPlay`
  props; the `playLabel`/`onPlay` passed at each call site (:243-244, :280-281).
- The mic-feedback microcopy (:300-309) — nothing plays anywhere now, so the
  caveat is false; delete it.
- Now-unused after the above: the `useRef`/`useEffect` imports and the `chordKey`
  local (only the deleted effect read it). Update the file-header comment.

This is the **only** permitted change to the non-dense (VoicingsSection /
ChordDetailModal) render — those mounts are otherwise byte-identical (all shapes,
normal piano layout); the visual `dense`-fork of §1/§2 leaves them alone.

### 3.2 `GlanceRail.jsx` (L-70) — dashboard-exclusive

`GlanceRail` is mounted **only** by the JamGuide rail, so its edits never leak:
- Delete the footer microcopy "▶ previews play through your speakers…"
  (:292-295); replace with nothing (or a quiet "voicings follow the loop").
- Delete the own-cell `<figure>` block (:215-231) — folded into `VoicingBrowser`
  per §1; pass `recommended={st.shape}` + `max={4}`.
- Update the header comment (":45 …every ▶ lives inside the gallery").

### 3.3 The licks strip (L-71)

- **`LickCard.jsx` has no play path** — the guitar tab card never had a ▶
  (verified: no `PlayButton`, no `chordAudio` import). Nothing to remove there;
  the dock's `size="full"` LickCards are unchanged.
- **`PianoLickCard.jsx` is the only lick ▶.** Remove: `import { playVoicing,
  stopAll } from '../lib/chordAudio'` (:73); the `PREVIEW_BPM`/`currentSeq`/
  `stopLick`/`playLick` sequencer (:167-198); the `PlayButton` component
  (:484-502) and its render (:606-609); the `useEffect(() => () => stopLick(),
  [])` unmount silence (:530, then drop the now-unused `useEffect` import). Keep
  the `resolveDegree` import — realization needs it.

### 3.4 `chordAudio.js` stays — verified importers

`grep chordAudio src/**` → importers are `VoicingBrowser.jsx` (▶ deleted in
§3.1), `PianoLickCard.jsx` (▶ deleted in §3.3), and **`BassPatternCard.jsx`**
(untouched — the bass-rail pattern previews the user did **not** ask to remove,
out of both locks); the rest are doc comments in `voicings.js`.
`ChordDetailModal.jsx` does **not** import it directly — it plays via
`VoicingBrowser`, so deleting that ▶ removes the modal's too, exactly as the
user's global decision intends. So `chordAudio.js` stays (for `BassPatternCard`),
but nothing in the voicing/lick UI plays.

### 3.5 The shared-sequencer blocker is eliminated

D-60 flagged that `BassPatternCard` and `PianoLickCard` each hold a **private
module-level `currentSeq`**, so their previews could layer once both mount — the
reason PianoLickCard was never wired into the strip. Removing PianoLickCard's
playback deletes its `currentSeq` entirely: **there is no piano sequencer left to
conflict with.** The strip becomes purely visual; `BassPatternCard`'s sequencer
lives only under the BASS selector (where the strip is hidden anyway). So
PianoLickCard wires into the strip (§5) with **no `currentSeq` collision** —
confirmed.

---

## 4. Hidden-but-scrollable dark scrollbars

### 4.1 Mechanism — a scoped utility, defined once in `index.css` (L-70)

```css
/* Thin, dark, overlay-feel scrollbars for the jam dashboard's scrollers.
   Scoped (a class), NOT global — the KnowledgeDock/Debug/Tuner/Settings
   below keep the OS default. Raw hex is unavoidable here: ::-webkit-scrollbar
   pseudo-elements are not reachable by Tailwind utilities. The values mirror
   the design tokens (border #2a2a2a, panel #1a1a1a). */
.dark-scroll {
  scrollbar-width: thin;                    /* Firefox */
  scrollbar-color: #2a2a2a transparent;     /* thumb=border token · track transparent */
}
.dark-scroll::-webkit-scrollbar { width: 8px; height: 8px; }        /* WebKit/Blink */
.dark-scroll::-webkit-scrollbar-track { background: transparent; }
.dark-scroll::-webkit-scrollbar-thumb {
  background: #2a2a2a; border-radius: 4px;  /* border token */
}
.dark-scroll::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
```

- **Scoped, not global** (`*`): the recommendation is a `.dark-scroll` opt-in
  class. Global would restyle every scroller in the app (the whole normal-mode
  page, the dock, Settings' full-screen scroller). The user's ask is about the
  dashboard's rail; keep the blast radius there.
- **Raw-hex exception, flagged to Maestro:** the DoD says "no raw hex outside
  `tailwind.config.js`," but `::-webkit-scrollbar` cannot consume a Tailwind
  class. `index.css` (which already carries the raw `#0f0f0f` body background)
  is the correct home; the values are documented as mirroring the `border`
  token. No *new* colour — #3a3a3a hover is a one-step lift of the same family;
  if Maestro prefers, use `panel` #1a1a1a for the base and `border` #2a2a2a for
  hover instead (both existing tokens). Either is fine.
- Contrast: a #2a2a2a thumb on the #0f0f0f/#1a1a1a surface is intentionally
  quiet — it is chrome, not content, so it is exempt from AA text contrast; it
  is still clearly grabbable (the point of "make them black or something").

### 4.2 Where it applies — every dashboard scroll container

| # | scroller | file:line | task | note |
|---|---|---|---|---|
| 1 | **rail right column** `xl:overflow-y-auto` | `JamGuide.jsx:484` | **L-71** | the headline visible bar |
| 2 | left column (jam-view) `xl:overflow-y-auto` | `JamGuide.jsx:475` | L-71 | consistency |
| 3 | LicksStrip horizontal `overflow-x-auto` | `JamGuide.jsx:888` | L-71 | the licks row |
| 4 | per-cell `overflow-x-auto` (voicing) | `VoicingBrowser.jsx:148` | L-70 | rarely triggers now (§2) — apply for the edge case |
| 5 | timeline/keyboard `overflow-x-auto` | `PianoLickCard.jsx:576,585` | L-71 | wide-lick edge case |

**File-collision resolution (the brief's ask):** the rail's *outer vertical
scroller lives in `JamGuide.jsx`*, which is **L-71's exclusive lock** — not
`GlanceRail`, not `App.jsx`. So the class **definition** ships in `index.css`
(L-70), and each `className="… dark-scroll"` **application** is made by whichever
task owns the file it lives in: L-70 applies it in `VoicingBrowser` (#4), L-71
applies it in `JamGuide` (#1-3) and `PianoLickCard` (#5). The class exists before
L-71 runs because **L-71 depends-on L-70** (already in the ledger). Zero shared
files. The visible rail bar is styled in L-71 — acceptable, because that scroller
was always a JamGuide-column concern, not a `GlanceRail` one.

---

## 5. Licks: uniform size + follow the instrument

### 5.1 The strip follows the global instrument

`instrument` already reaches the strip: App's global selector → `JamGuide`
`instrument` prop (:177) → `LicksStrip({ …, instrument })` (:433-445, :863).
Today the strip **always renders `LickCard`** (guitar), even under PIANO, with an
apologetic heading "(no piano licks in the KB yet)" (:885). Change:

- `guitar` → `LickCard` (unchanged renderer).
- `piano` → `PianoLickCard` (wire it in — the D-60 component, never mounted).
  Needs `rootPc` + `chordLabel` from the playhead `context` station (which
  carries `rootPc`/`quality`/`label`), and each lick carries its own `quality`.
- `bass` → the strip is already gated off (:432/:439 `instrument !== 'bass'`);
  render a slim honest line "No bass licks in the KB yet" instead of nothing, so
  the section doesn't silently vanish when a bassist is selected.

The licks reader `licksFor(id)` (:136) is **hardcoded to
`instruments.guitar.licks`** — L-71 generalises it to
`licksFor(id, instrument)`, reading `instruments.piano.licks` under piano, and
**filtering piano licks to the structured ones** (those with a `notes` array) so
prose-only entries don't render as `PianoLickCard` placeholders (see §5.3).

### 5.2 Uniform footprint — measure, target, change

Both are wrapped by the strip in `w-[220px]` (closed) / `w-[340px]` (open)
(:894), so **width is already uniform**. The gap is **height** — the two SVGs
auto-size by different aspect ratios:

- **`LickCard` thumb** (`layoutTab`): viewBox 96 units tall (17 + 5·14 + 9),
  `TabSvg` `maxWidth = width·1.3`; inside a 204px inner box it renders ~125px
  tall. Card ≈ 163px.
- **`PianoLickCard` thumb** (`layoutLick`): height = 14 + `plotH` + 8 (+10 beat
  row), `plotH = max(26, range·semi)` — **varies with the lick's pitch range**,
  so a wide lick is much taller than a narrow one and neither matches LickCard.

**Target: a shared thumb card of `220 × 150px`** (closed), `340px` wide (open).
**Imposed at the dashboard-strip mount, not inside the cards** (per the scope
refinement — do not touch `LickCard`'s default footprint). The `LicksStrip`
wrapper (JamGuide, L-71) that already sets `w-[220px]`/`w-[340px]` (:894) also
sets a **fixed content height** and normalises the card's SVG to fill it, e.g.
`class="… h-[150px] [&_svg]:!h-[104px] [&_svg]:!w-full"`. The cards' SVGs already
carry a `viewBox`, so `preserveAspectRatio="xMidYMid meet"` (the SVG default)
scales the tab / timeline to the 104px box and centres it — **zero edit to
`LickCard` or `PianoLickCard` internals.** Every card — guitar tab or piano roll —
then occupies the **same box**, "all the same size," and flips instrument in
place. (The `maxWidth: width·1.3/1.4` inline caps mean a short lick renders
narrower than 220 and centres — the card *box* is uniform; content is centred.)

**Scope proof (KC untouched):** the fixed-box CSS lives on the **`LicksStrip`
wrapper only** — a dashboard-exclusive element. `LickCard`'s and `PianoLickCard`'s
own geometry is unchanged, so the dock's LicksSection `size="full"` LickCards
(:817) render **byte-identical** (the L-71 DoD asserts it). `PianoLickCard` has no
KC mount at all.

### 5.3 KB coverage + empty-per-style behaviour

Verified against the KB (`instruments.piano.licks` with a structured `notes`
array — PianoLickCard-renderable):

| style | guitar licks | piano licks (structured) |
|---|---|---|
| jazz, blues, gospel, rnb | ✓ | ✓ (P-60/P-61) |
| pop | ✓ | **prose only** (`over`/`description`) — not renderable |
| bossa, country, funk, reggae, rock | ✓ | ✗ |

- **Guitar:** all 10 styles have tab licks — the strip works everywhere.
- **Piano:** structured, renderable licks exist for **jazz, blues, gospel, rnb**
  only. Pop's `piano.licks` are the old prose education entries (no `notes`) —
  the structured filter drops them, so pop reads as empty under piano too.
- **Empty-per-style:** today the strip returns `null` when empty (hides). Keep
  hide-on-empty for **guitar** (the default; a silent gap is fine). For **piano
  with zero structured licks** (pop + the 5 styles above), show a **slim honest
  line** — "No {style} piano licks yet" — because the user *actively switched to
  piano* and a vanished section is confusing there. Same slim line for bass.

---

## 6. Recomputed budget

Per-station row (row p-1.5 12 + border 2 + header block ~54 + gallery):

| | gallery block | **new row** | pre-polish row |
|---|---|---|---|
| Guitar | 4 cells ×1 line, no ▶ = **105px** | **~173px** | ~207px (5-6 cells, ▶, wraps) |
| Piano | 2×2 mini, no ▶ = **148.8px** | **~217px** | ~445px (0.8, ▶, 3 wrapped lines) |

Rail overhead (section p-2 16 + border 2 + h4 title ~22 + footer ~40) ≈ 80px;
rows joined by `gap-2` (8px).

| loop | instrument | **new total** | pre-polish | Δ |
|---|---|---|---|---|
| 4-chord | guitar | 80 + 4·173 + 24 = **796** | ~932 | −15% |
| 4-chord | piano | 80 + 4·217 + 24 = **972** | ~1884 | **−48%** |
| 8-chord | guitar | 80 + 8·173 + 56 = **1520** | ~1720 | −12% |
| 8-chord | piano | 80 + 8·217 + 56 = **1872** | ~3640 | **−49%** |

**Headline: the piano rail nearly halves (−48%), and the guitar row is now a
guaranteed single line (≤4, never wraps).** Every total still exceeds the 500px
column, so **the rail remains the dashboard's one vertical scroller** — which is
exactly what §2's dark thin scrollbar dresses, and what the user licensed ("it
can scroll if we need to"). The polish makes each row compact and the scroll
pretty; it does not (and need not) fit a whole loop in 500px.

---

## 7. Migration order + bounded scopes

**L-70 — the rail.** Files (file-disjoint from L-71):
`src/components/GlanceRail.jsx`, `src/components/VoicingBrowser.jsx`,
`src/components/MiniPiano.jsx` (new `size="mini"` + R/ring bump — additive),
`src/index.css` (define `.dark-scroll`).
Does: guitar ≤4 recommended-first, **dense-only** (§1); piano 2×2 mini @0.60,
**dense-only** (§2); ▶ **deleted globally** from `VoicingBrowser`, own-cell +
footer from `GlanceRail` (§3.1-3.2); `.dark-scroll` defined + applied to
VoicingBrowser's cell scroller (§4 #4). `MiniPiano.jsx` is safe to lock here — no
other polish task touches it (`PianoLickCard`/`LickCard` carry their **own**
keyboard geometry and do not import `MiniPiano`).
**DoD byte-identity:** the non-dense `VoicingBrowser` render (VoicingsSection +
ChordDetailModal) is byte-identical to today **except the ▶ is removed**;
`MiniPiano` `thumb`/`full` byte-untouched (new `mini` is additive).

**L-71 — the licks.** Files: `src/components/JamGuide.jsx` (LicksStrip +
`licksFor` + the fixed-box wrapper + the scroller classNames),
`src/components/PianoLickCard.jsx`. **`LickCard.jsx` is *not* edited** — it has no
▶ and its footprint is imposed from the strip wrapper (§5.2), so it drops out of
the lock (dock LicksSection unaffected).
Does: uniform 220×150 thumb via the **strip wrapper** (§5.2); instrument branch +
PianoLickCard wiring + piano/bass empty states (§5.1/5.3); ▶ deleted from
`PianoLickCard` (§3.3); `.dark-scroll` applied to JamGuide's three scrollers +
PianoLickCard's (§4 #1-3,5).
**DoD byte-identity:** the dock LicksSection's `size="full"` LickCards render
byte-identical to today (no ▶ existed to remove there).

**Serialise L-70 → L-71** (already the ledger's `depends-on`): they are
**file-disjoint** (no shared file — the `.dark-scroll` *class* is defined in
L-70's `index.css` and merely *referenced* by L-71's JSX, which is not a file
edit collision), and L-71 needs L-70's class to exist. `JamGuide.jsx` belongs to
**exactly one** task (L-71), so the rail-column scrollbar has a single owner — no
shared-file clash. Critic gates each; `C-70` closes the sprint.

### Rejected alternatives

1. **Shrink `MiniPiano`'s global `thumb` scale (0.8→0.6) instead of a new
   `mini`.** Rejected — it also shrinks the `ChordDetailModal` and dock thumbs,
   which have room to spare and benefit from the larger keys; a scoped `mini`
   variant keeps those byte-identical and confines the change to the rail.
2. **Give 2-octave piano crops their own full-width row (mixed cell sizes) at a
   larger scale (~0.7).** Rejected — it breaks the clean "2×2 for each chord" the
   user asked for; a uniform 0.60 grid keeps every chord a tidy 2×2 and 0.60 is
   still legibly playable (13.2px keys ≈ the guitar diagram's string gap).
3. **Keep the separate own-cell and cap the gallery to 3.** Rejected — it leaves
   the ≤4 rule split across two components (own-cell in `GlanceRail`, cap in
   `VoicingBrowser`) and preserves the today's recommended/gallery duplicate;
   centralising in `VoicingBrowser` (§1.1) is one place, one rule, no dupe.
4. **Global `*` scrollbar styling.** Rejected — restyles the entire app
   (dock/Debug/Tuner/Settings) for a dashboard-scoped ask; a `.dark-scroll`
   opt-in class is surgical.
