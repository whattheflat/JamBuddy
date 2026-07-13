# One Screen — the jam dashboard (task D-50)

> **Thesis:** the page stops being a tall stack of full-width bands and becomes a
> **viewport-fitting jam dashboard**: a full-width *slim loop strip* (the banner
> minus its big now-playing chord), then LEFT (~744px) the compact instrument
> view, the licks strip, and a new loop-relative *Related progressions* card;
> RIGHT (~500px) the suggested-voicings rail — the design's ONE justified
> internal scroller (§4). The dashboard is a **self-contained unit designed to
> fit 100vh at 1280×900**; a **JAM VIEW toggle** in the controls bar (§1.1)
> locks the page to exactly that unit (and goes browser-fullscreen,
> best-effort) while playing. In normal mode everything that is learning or
> behind-the-scenes (LoopStation, Debug, Drum, Tuner, KnowledgeDock) stays
> below the dashboard on the ordinary page scroll; in jam view it is hidden.
>
> User directive (2026-07-11, verbatim): *"the chord view and the chord loop
> incl the instrument below is too big, it takes up too much space, i want you
> to reconsider the positioning as this main view doesnt really add value:
> seeing the big chord 'now playing' in big is also unnecessary as you already
> see that one in the chords (loop) part. the suggested progressions on the
> right are also almost useless. they are nice but we need to rethink them in
> the form of SUGGESTED VOICINGS and the progressions we add relating to the
> loop. i'd like to have the suggested voicings on the right side of the screen
> (the jam guide). … i wanna see the chords, the loop, the voicings, the
> progressions, the licks all on one screen, everything you need to follow the
> jam correctly"*
>
> Refinement (2026-07-11, verbatim): *"it can still have a scroll down, but the
> main concept needs to be in one screen: potentially we add a fullscreen
> button so we can just show that when we are playing a jam. so that it fits
> the entire screen, everything that is learning and behind the scenes etc you
> can keep below/scrollable but we need one main view for live jams where we
> see everything at once (relating to the jam and the voicings and the licks
> and the chords and the loop)"* — the 100vh fit is a **hard design
> constraint** for the dashboard, not an aspiration; the fullscreen button is
> in scope (L-50 commit 3, §6.1); internal wrap/scroll inside a panel is a
> last resort and every instance below is justified.

**Supersedes** `integrated-glance.md` §1's full-width-band placement (the user
tested it and asked for the right column). That doc's **verified geometry stays
the arithmetic source here**: guitar cell ~93px, piano cells 160/284px, worst
piano gallery ~1,178px of cells, licks thumb card ~165px (in a 220px strip
slot), cell line heights ~140px guitar / ~125–130px piano. Standing principles
(user memory): scroll > click; nothing shown twice; ONE global instrument
selector; the playhead highlights, never hides.

**Decision authority:** per the sprint header (no user gate), Muse picks the
strongest option and records rejected alternatives (§9).

---

## 0. What exists today (read from the code)

App.jsx mount order: `ProgressionBanner` (~608) → instrument row (~617–629:
`Fretboard`/`BassFretboard`/`Piano` at 70% + `ProgressionSuggestions` at 30%) →
`JamGuide` full-width band (~635: GlanceRail all-expanded rows + LicksStrip) →
`LoopStation` → Debug/Drum/Tuner collapsibles → `KnowledgeDock` last. The band
starts ≈570px down at 1280×900 — voicings never share the screen with the
instrument view, and the licks strip sits another rail-height below that. The
banner burns its right 30% on a text-6xl "Now Playing" chord that duplicates
both the enlarged last history chip and the highlighted loop chip. The
directive kills all of that.

---

## 1. The grid

Assumed usable content box at a 1280×900 window: **~1,256 × ~836px** (Electron
title bar ~32px eats into the 900; App's `p-3` eats 24px each axis — heights
below are estimates, cell geometry is verified).

```
┌──────────────────────────────────────────────────────────────┐  ─┐
│ header (~52)                                                  │   │
│ controls bar — instrument · key lock · ⛶ JAM VIEW (~52)       │   │
│ SLIM LOOP STRIP — key · history · ♻ loop chips (~76)          │   │ the
├───────────────────────────────────────┬──────────────────────┤   │ dashboard
│ LEFT  ~744px (flex-1)                 │ RIGHT 500px,          │   │ = 100vh
│                                       │ own scroll (§4)       │   │ in jam
│  compact instrument view   (~240)     │                       │   │ view
│  licks strip               (~190)     │  SUGGESTED VOICINGS   │   │
│  related progressions      (~200)     │  rail — GlanceRail /  │   │
│                                       │  BassGuideRows rows   │   │
├───────────────────────────────────────┴──────────────────────┤  ─┘
│ LoopStation · Behind the Scenes · Rhythm · Tuner · Knowledge  │  normal mode
│ (the learning / behind-the-scenes area — page scroll)         │  only; hidden
└──────────────────────────────────────────────────────────────┘  in JAM VIEW
```

- The **slim strip stays full width** (not inside the left column): it is the
  status line for the whole dashboard — the rail's playhead and the strip's
  active loop chip are the same "now", and a full-width one-liner costs only
  ~76px. (Putting it inside the left column would buy the rail ~88px of
  first-paint height; the rail is internally scrollable anyway, and a
  ~450px-content strip floating in a 744px column looks broken. Not worth it.)
- **Grid:** `flex gap-3 items-start` → left `flex-1 min-w-0`, right
  `w-[500px] shrink-0`, active at `xl:` (≥1280); below that the columns stack
  (§7). 500px is the top of the licensed 420–520 range because piano cells
  need it (§4): at 500 the row interior is ~456px, which fits a 284px
  two-octave cell **plus** a 160px one-octave cell per line (by ~4px — D-51
  hardens the margin, §4); at 420 every two-octave cell rides alone.
- **The rail is height-bounded: `xl:max-h-[calc(100vh-1.5rem)]
  xl:overflow-y-auto` — and NOT sticky.** (`sticky top-3` here would be inert:
  inside the flex row the rail is the tallest item, so its containing block
  equals its own height and there is zero travel to pin against — specifying
  it would be a lie in class form.) What the bound actually buys, honestly:
  the rail is the one unbounded surface (§4 math — a jazz piano loop is
  ~3,000px of rows). **(a)** Unbounded, it stretches the *document* to
  ~3,000px+, pushing the below-grid region (LoopStation, the whole learning
  area) thousands of pixels down instead of one flick below the dashboard.
  **(b)** The bound is exactly what jam view swaps to `h-full` — an unbounded
  rail can never fit `h-screen` (§1.1). The rail's depth scrolls *within* its
  column; the left column stays whole; at rest the rail shows ~644px (the
  grid height). D-40 Rejected E (internal scroller) was rejected for the
  *full-width band*, where it capped visible rows below 4 and nested a
  scrollbar inside the page's only axis; in a two-column dashboard, bounding
  the one unbounded column is what makes the dashboard a fixed-height unit —
  the rejection does not carry over. **No auto-scroll in this sprint** (§4).

Vertical budget, normal mode at rest: 836 − 52 (header) − 52 (controls) − 88
(strip + gap) ≈ **644px for the grid**. Left stack ≈ 240 + 190 + ~200 + 24
gaps ≈ **654px** — everything on screen except the last ~10–20px of the
related progressions card at exactly 900px window height; a micro-flick shows
it. In normal mode that residue is acceptable (the page scrolls anyway); **in
jam view it is not** — §1.1 makes the fit exact by construction, with the
related card as the left column's flex absorber.

### 1.1 Jam view — the one-screen lock + fullscreen toggle

The refinement's "fullscreen button". **Mechanism chosen: one button, two
layers on one state.**

- **Layer 1 — CSS jam view (the guarantee).** App gains a `jamView` boolean
  (pure UI-state — nowhere near the audio callbacks/refs). When true:
  - the page root becomes `h-screen overflow-hidden flex flex-col` (normal
    mode: today's `min-h-screen` flow);
  - **everything below the dashboard is not rendered** — LoopStation, Behind
    the Scenes, Rhythm Analyser, Tuner, KnowledgeDock (conditional mount, not
    `hidden`, so collapsed-state chrome can't leak height). Header, controls
    bar, strip, grid remain — Stop/Start, the instrument selector, and the key
    lock are jam-relevant chrome;
  - the grid gets `flex-1 min-h-0`; the rail wrapper swaps its normal-mode
    `xl:max-h-[calc(100vh-1.5rem)]` bound for `h-full overflow-y-auto` (the
    column IS the viewport remainder, so the viewport-calc bound gives way to
    the exact column height);
  - the left column becomes `flex flex-col min-h-0`: instrument view and
    licks strip fixed-height, the related progressions card `flex-1 min-h-0
    overflow-y-auto` — the **one flex absorber** that soaks up the ±20px
    between window sizes. Internal scroll here is the licensed last resort
    and only engages below ~950px-tall windowed viewports (numbers below).
- **Layer 2 — browser fullscreen (the enhancement, best-effort).** The same
  toggle calls `document.documentElement.requestFullscreen()` on enter and
  `document.exitFullscreen()` on exit. Both return **Promises** — a bare
  try/catch does not swallow the rejection; the calls must be
  `.catch(() => {})` (or awaited inside try/catch). Electron grants it (plain
  renderer, no IPC needed); if a browser build ever refuses, jam view still
  works at layer 1. Fullscreen reclaims the ~32px
  title bar (and any taskbar), which is exactly what turns "fits minus 20px"
  into "fits clean" at 900-high screens.
- **The button** lives at the right end of the controls bar (the global,
  always-visible chrome — same reasoning as the instrument selector):
  `⛶ Jam view` / `✕ Exit` , `aria-pressed`, min-32px target,
  `focus-visible:ring-2 ring-accent`, tokens only.
- **Exit paths, all restoring normal flow:** the button; **Escape** (a
  `keydown` listener active only while `jamView` — needed because layer 1 can
  exist without layer 2); and the native fullscreen Esc, synced via a
  `fullscreenchange` listener (leaving fullscreen by any means switches
  `jamView` off — one state, never half-exited). Entering does NOT auto-start
  listening; leaving does NOT stop it — the toggle is layout-only.

**Jam-view budget (the hard numbers).** Grid height = viewport − p-3 (24) −
header 52 − controls 52 − strip + gap 88:

| Viewport | Grid (= rail height) | Left: fixed 454 (instrument 240 + licks 190 + gaps) → related card gets | Verdict |
|---|---|---|---|
| 1280×900 window (layer 1 only, content ~836) | **644px** | ~190px → heading + ~2.8 of 3 entries | fits; the card's last entry may shave ~20px — its internal scroll absorbs it |
| 1280×900 screen, true fullscreen (content ~876) | **684px** | ~230px → 3 entries fully clear, ~20px spare | **fits clean — the ~20px story is gone** |
| 1280×960+ screen, true fullscreen (content ≥936) | **≥744px** | ≥290px → up to 5 entries | fits with room |

The rail's *depth* still exceeds any of these for piano loops (§4 table — a
4-chord jazz loop is ~2,600–3,000px of rows). That is the one place "see
everything at once" and "every voicing, all levels, zero clicks" (D-30)
mathematically collide; the cell strategy compresses first (recommended cell
leads; the 284+160 pair-fit halves mixed-station heights, §4) and the
remainder falls to the rail's contained scroll — the justified internal
scroller. All four *bounded* surfaces (strip, instrument, licks, progressions)
fit whole; guitar and bass rails fit ~2.5–3 of 4 rows with the "now" row
highlighted wherever it sits.

### 1.2 The slim loop strip — banner inventory

What `ProgressionBanner` renders today, and its disposition:

| Banner element today | Disposition |
|---|---|
| Key chip (root text-2xl accent + mode + confidence %) | **Survives** — leftmost, unchanged |
| Chord history (last 8, age-faded, tap → ChordDetailModal; current chip enlarged text-3xl + amber rn + pop-in animation) | **Survives, capped to last 5** — the enlarged current chip IS the now-playing display now; the pop-in animation moves with it |
| Loop row (♻ + chips, chord + rn, active chip accent-glow via `findLoopPosition`, "→ loop" tail) | **Survives, promoted onto the same row** as key + history (divider between) |
| `hidden lg:block` divider + right 30% column: "NOW PLAYING" label, **text-6xl amber chord**, rn, "tap for voicings" | **GONE.** The user's words: the loop chips already carry it. The tap-for-voicings affordance is not lost — every chip already opens ChordDetailModal, and the rail shows the loop's voicings permanently |
| Empty states ("Detecting key…", "Start listening…", "Play a chord") | First two survive; "Play a chord" dies with its column |

One row: key chip (~90px) + 5 history chips (~230px) + divider + up to 8 loop
chips (~320px) + tail ≈ ~720px — fits 1,256 with room; 12-chord loops (12-bar
blues) wrap the loop chips to a second line (strip ~104px, still fine).
**Strip chrome trim (part of the slimming):** `p-4 → p-2` and drop the history
wrapper's `pb-1` — the enlarged current chip (text-3xl + rn + chip padding) is
~58px tall on its own, so with p-4 the strip lands at ~92–96px; the trim is
what makes the **~76px** figure true. Goes in L-50 commit 1 with the column
removal (§6.1).
Duplication audit: the current chord appears twice (last history chip + active
loop chip) — pre-existing, and the user's directive explicitly endorses the
loop chip as the "now"; the big third copy is what dies.

---

## 2. Compact instrument view — the mechanism

**Chosen: a `compact` prop on Fretboard / Piano / BassFretboard = trimmed card
chrome + a natural-width cap on the SVG. No fret reduction, no transform
scaling.**

- **Natural-width cap:** each SVG keeps `width:100%` but gains
  `max-width: <its viewBox width>px` (Fretboard 674px, Piano 562px), i.e. it
  never renders *above* scale 1.0. In the 744px left column (≈718px card
  interior with the compact `p-3`) the fretboard sits at its designed 1.0 scale → SVG height
  **186px** (today at 70% of 1,256 it renders at ~1.23 scale ≈ 229px + fat
  chrome ≈ 320px card). Piano: 150px SVG.
- **Trimmed chrome:** `p-6 → p-3`, heading `mb-4 → mb-2`, and the legend row
  (chord tone / pentatonic / scale dots) merges onto the heading line
  (right-aligned) instead of a separate `mt-3` row. Card totals: fretboard
  ≈ **240px** (was ~320), piano ≈ **205px**.
- **Legibility, honestly:** at scale 1.0 the fretboard is at its *designed*
  size — 20px note dots, 9px note labels, 10px string/fret labels, exactly
  what ChordDiagram-era eyes were tuned on; nothing shrinks below today's
  rendering (today it renders *larger* than designed, which is part of "too
  big"). The compact card is smaller because the chrome and the over-scale go,
  not because the notes do. Below ~700px column width the SVG scales down with
  the column; at 0.9 scale (≈606px) labels are ~8px — the floor I'd defend.
  The narrow plan (§7) gives the view the full window width anyway, so the
  sub-1.0 zone only exists between ~1280 and ~1140px windows if the grid
  breakpoint were lower — hence `xl:` for the grid, not `lg:`.
- Rejected mechanisms: **fewer frets** (0–7) kills position playing above the
  7th fret — soloists live there; **CSS `transform: scale()`** blurs text and
  shrinks hit targets — dishonest compactness; **hard height cap with
  letterboxing** wastes the saved space as empty gutters.

---

## 3. What's removed / moved (full inventory)

| Surface | Disposition |
|---|---|
| Big "Now Playing" chord (banner right 30% + divider) | **Removed** (§1.2) |
| `ProgressionSuggestions` | **Unmounted; file kept in place** (EducationPanel/RoadmapTrack precedent — joins the retire-then-delete backlog item). Its job splits in two per the directive: "what to play on these chords" → the voicings rail; "where these changes can go" → RelatedProgressions (§5). Its generic genre/mood table and circle-of-fifths padding retire with it |
| The 70/30 instrument row | **Dissolved** — the instrument view becomes the left column's first block; the 30% slot's replacement is the rail column |
| JamGuide band (rail + licks, full width) | **Recomposed** — JamGuide stops rendering a band and renders the grid's jam surfaces: rail into the right column, LicksStrip + a related-progressions slot into the left (§6, component boundary) |
| LicksStrip | **Stays module-local in JamGuide.jsx** — no file move. It renders from JamGuide's match/context memos (`activeStyle`, `contextStation`); extracting it to its own file buys nothing and forces prop plumbing for the token-boundary context sort. It just mounts in the left column now |
| LoopStation | **Below the grid, first — and hidden in jam view.** Recorded call: the user's enumeration of the live-jam view is "the jam and the voicings and the licks and the chords and the loop", where "the loop" is the *chord* loop (the strip's ♻ chips), not the audio looper. LoopStation is a performance tool, but it is not on the list — it goes below with the learning surfaces, first in line because it feeds the detected loop. If the user misses it mid-jam, admitting it into jam view is a one-line conditional — the reversal path is cheap and noted in §9 |
| Behind the Scenes / Rhythm Analyser / Tuner collapsibles | Below LoopStation, unchanged |
| KnowledgeDock | **Last, unchanged** — browse & study stays below the fold |
| ChordDetailModal, AudioCapture, all `src/lib/**` audio/theory | Zero changes |

In **normal mode** everything below the grid remains exactly what the
refinement asks for — the learning / behind-the-scenes area on the ordinary
page scroll ("everything that is learning and behind the scenes etc you can
keep below/scrollable"). In **jam view** this whole region is hidden (§1.1) —
the dashboard is the entire page.

---

## 4. The rail at column width (~500px shell, ~456px row interior)

Row interior arithmetic: 500 − rail section `p-3` + border (~26) − row `p-2` +
border (~18) ≈ **456px** for header + cells. The inherited 93/160/284 figures
are already **box values** — integrated-glance's own verified sums prove it
(4×284 + gaps + chrome ≈ 1,178 with no extra per-cell padding), so nothing
gets padding added on top below. Cell strategy: **recommended-first, gallery
wrapped below — all cells always rendered, zero clicks** (D-30's "all at once"
directive stands; only the *geometry* adapts).

- **The recommended cell leads and reads as the answer.** The station's own
  voicing (guitar: KB play shape badged "play"; piano: the authored/threaded
  voicing with its honest label) keeps its accent-bordered figure and is
  always the first cell — at column width it is frequently alone on line one,
  which makes prominence free. D-51 may add nothing more than a slightly
  stronger figure treatment (accent/60 border → accent) — no size difference,
  no new colour.
- **Guitar:** cells ~93px (box) → **4 per line** (4×93 + 3×8 gaps = 396 ≤ 456
  — fits with ~60px to spare, not borderline; a 5th cell at 497 does not).
  Typical station = play cell + 3–6 placeable shapes = 4–7 cells → 1–2 cell
  lines (~140px each). Header content (chord + rn + now/next + solo label +
  aim dots + transition chip ≈ 540px of inline content) **wraps to 2 lines
  ≈ 50px** — fine, it already `flex-wrap`s. Row ≈ **206–350px**.
- **Piano:** one-octave cells ~160px (box) → 2 per line (328 ≤ 456);
  two-octave cells ~284px (box) → alone or, critically, **paired with a
  one-octave cell: 284 + 160 + 8 = 452 ≤ 456 — the mixed pair FITS today, by
  ~4px**. That 4px is real but fragile (a longer label, a scrollbar gutter, a
  browser rounding step could break it), so D-51's cell padding/gap shave is
  **margin-hardening for an already-passing fit**, not a rescue — the pairing
  is the difference between 5 and 3 cell lines on mixed stations. Worst
  station (root above D with a true 7th — all five cells two-octave, per the
  D-40 corrected math; 2×284 + 8 = 576 > 456 so they never pair with each
  other): **5 cell lines ≈ 650 + header ≈ ~700px per row**. Best (roots C–D /
  triads): 3 lines ≈ ~490px.
- **Bass:** BassGuideRows text rows (~70px) or BassPatternCard rows — narrow
  by construction; the column fits them with no adaptation beyond wrap, which
  it inherits.
- **Wrap, never horizontal scroll** — unchanged invariant. The only permitted
  horizontal scroller stays VoicingBrowser's per-cell guard around MiniPiano
  thumbs on sub-320px pathologies.

### The honest vertical budget

| Scenario | Full rail height | Visible: normal rest (~644px) / jam view fullscreen (~684px) |
|---|---|---|
| 4-chord loop, guitar | ≈ 4×~275 avg + chrome ≈ **~1,150px** | ~2.3 / ~2.5 rows |
| 4-chord loop, piano (jazz flagship, mostly worst-case rows) | ≈ **~2,600–3,000px** | ~1 / ~1.1 rows |
| 8–12 chord loop (12-bar) | guitar ~2,300 / piano ~5,000+ | scroll; the strip's loop chips always carry the position |

**What "one screen" honestly means:** all five surfaces are simultaneously
present at 1280×900 (whole, in jam view — §1.1) — but the rail's *depth* is a
scroll, contained in its column: it is the one panel whose content is
unbounded by construction (every voicing of every loop chord, D-30's "all at
once"), so it is the design's justified last-resort internal scroller; the
cell strategy above compresses first. A 4-chord guitar loop is ~1.4
rail-screenfuls; a 4-chord jazz piano loop is ~3.5. The playhead highlight
travels whether or not the row is in the scroller's window; the strip up top
always shows where you are. **No
auto-scroll in D-51** — same reasoning as D-40 §4, plus: contained auto-follow
is now *technically safe* (the scroller is no longer the document, so it can't
yank the page), so I flag it to Maestro as an optional 1-point follow-up
**after** the user has felt the manual version — auto-motion during a jam is
exactly the "it changes while I play" complaint in a new hat, so it must be
user-pulled, not designer-pushed.

Flag (not in scope): a **root-aligned MiniPiano crop** would turn most
two-octave piano cells into one-octave ones (~160px), roughly halving piano
rail heights. It reopens D-24's C-aligned-crop decision and MiniPiano is
frozen this sprint — Maestro may file it as a D-52 candidate.

---

## 5. Related progressions — the spec for L-51

**What it is:** 3–5 KB progressions genuinely related to the *detected loop*,
replacing ProgressionSuggestions' generic genre table. KB-sourced only
(`kb[style].progressions` — id, name, rn, degrees, qualities, level, songs),
loop-relative by construction.

### Ranking (computable today, no new theory)

Inputs: `detectedProgression` (chord-name strings), the KB registry, and
`matchLoopToProgression`'s result. Reuse `src/lib/match.js` machinery —
`loopToDegrees` and `canonicalDegrees` are currently module-private and must
become **additive exports** (L-51 lock addition; no behaviour change), next to
the already-exported `matchLoopToProgression`/`buildLoopIndex`.

1. `loopDeg = loopToDegrees(loop)`; bail to empty state if null.
   `loopCanon = canonicalDegrees(loopDeg)`. `match = matchLoopToProgression(…)`
   (the component computes its own — see §6's parallelism note).
2. Build the loop's **transition set** `T(loop)`: for each i (wrap-around),
   the triple `(Δ = (deg[i+1]−deg[i]) mod 12, q[i], q[i+1])` with qualities
   from the chord-name suffixes (unmappable suffix → wildcard: match on Δ
   alone). Same for every KB progression from its `degrees`/`qualities`.

   **Collapse first — mandatory.** The live `detectedProgression` is a
   *collapsed* form (detection never commits the same chord twice in a row),
   while KB `degrees` are *raw*, bar-per-bar — blues-12bar is
   `[0,0,0,0,5,5,0,0,7,5,0,7]`. Compared raw, the +100 same-canonical-shape
   term would NEVER fire for the ~10 collapse-affected KB progressions —
   silently killing the flagship "this 12-bar IS their 12-bar" relation (it
   degrades, never misfires, which is why it would go unnoticed). So: before
   `canonicalDegrees(p.degrees)` AND before building `T(p)`, **collapse
   consecutive equal `(degree, quality)` pairs** in `p` (also with the
   wrap-around pair). This additionally removes the harmless-but-deflating
   `Δ=0` self-transitions from `T(p)`. Alternative once D-62's fix (a) lands
   collapsed-form indexing in match.js: consume that shared collapsed form
   instead of collapsing locally — coordinate via the §9 match.js
   shared-file note.
3. Score every KB progression `p` with `p.id !== match.id`:
   - **+100** if `canonicalDegrees(p.degrees) === loopCanon` — the same
     changes in another style/length ("this turnaround IS jazz's I–vi–ii–V");
   - **+40** if `p.style === match.style` (0 when nothing matched — the
     ranking still works loop-relative off the raw degrees);
   - **+12 per shared transition** (distinct triples in `T(loop) ∩ T(p)`),
     capped at 36 — this is what finds "shares the ii→V" honestly;
   - **+ up to 16** for rebased degree-set overlap (Jaccard × 16);
   - **−1 per chord of length difference** (tie-break toward similar-size loops).
4. Floor **24** (at least a shared transition + some overlap, or same-style +
   substance) — never pad with junk; fewer honest entries beat five stretches.
   Sort desc (stable by style, id), take **max 5; the dashboard budget
   guarantees 3 visible** (§1.1) — the card is the left column's flex
   absorber, so entries 4–5 show on tall viewports and scroll within the card
   on tight ones.

### Per-entry render (~56px each)

- Line 1: **name** (gray-100 semibold) · style label (gray-500) · **level
  chip** (ExplorePanel's `LevelBadge` language — untagged counts foundation) ·
  annotation (gray-500, [10px]): `same changes` when the +100 fired, else
  `shares {rn_a}→{rn_b}` naming p's rn at the top shared transition, else
  `same style`.
- Line 2: the **chord chain realized in the current key** — rootPc =
  `(keyRoot + degree) mod 12` + `CHORD_TYPES[quality].suffix` (the
  stationVoicings formula), rendered as tappable chips with rn beneath
  (banner-chip visual language, smaller); 12-bar chains truncate to the first
  8 + "…". **Tap a chord → `onChordClick` → ChordDetailModal** — the existing
  per-chord pattern (ExploreSection does exactly this); no new modal, no dock
  deep-link API invented for v1.

### Empty states (honest)

- No loop detected → one-liner (~40px, dashed border):
  *"Loop a progression — related changes from the songbook land here."*
- Loop but nothing ≥ floor → *"Nothing in the songbook genuinely relates to
  this loop yet."* (never pad).
- Loop unmatched but candidates score (shape/transition terms only) → render
  normally; the annotation still explains *why* each entry is there.

---

## 6. Component boundary + migration order (green at every commit)

**Boundary call:** `JamGuide` (default export) is promoted from "band" to
**jam-grid owner**: it renders the two-column `flex` region and takes two JSX
slot props from App — `mainView` (the instrument view — App keeps choosing
Fretboard/BassFretboard/Piano; JamGuide never imports them) and `relatedSlot`
(RelatedProgressions, mounted by App). Left column = `mainView` + LicksStrip +
`relatedSlot`; right column = the height-bounded scroller wrapping GlanceRail /
BassGuideRows / the heard-live fallback. Rationale: the match / stationVoicings
/ canonicalPos / focus machinery stays in ONE component with no context and no
logic lifted into App (the 🚨 App.jsx contract); the slots keep App as pure
mounts. **RelatedProgressions computes its own match** (memoized on the loop
key — `matchLoopToProgression` over a module-level index is trivially cheap);
this small duplicate computation is what makes L-51's files disjoint from
D-51's (they can run in parallel) and keeps the component pure/prop-driven:
`{ loop, keyInfo, onChordClick }`.

Sequenced: **L-50 → (D-51 ‖ L-51) → C-50.** Critic gates each.

### 6.1 L-50 (Luthier) — the dashboard restructure

**Files (re-lock at promotion):** `src/App.jsx` (layout/mounts only, 🚨 audio
contract grep-gated), `src/components/ProgressionBanner.jsx`,
`src/components/JamGuide.jsx`, `src/components/Fretboard.jsx`,
`src/components/Piano.jsx`, `src/components/BassFretboard.jsx` (compact prop —
mechanical chrome trim + max-width cap per §2; D-51 polishes visuals if
needed). **Not touched:** ProgressionSuggestions.jsx (unmounted, not edited),
GlanceRail.jsx, VoicingBrowser.jsx, all `src/lib/**`.

1. **Commit 1 — slim strip.** ProgressionBanner: delete the right 30% column +
   divider + its `currentRN`/big-chord code path; merge key + history + loop
   onto one row; `HISTORY_SHOWN` 8 → 5; chrome trim `p-4 → p-2` + drop the
   history wrapper's `pb-1` (what makes the ~76px strip true, §1.2).
   Standalone green.
2. **Commit 2 — the grid (atomic).** These land together or the page has a
   hole: App replaces the 70/30 row + band with the `xl:` two-column grid;
   **ProgressionSuggestions unmounted** (import + mount deleted); JamGuide
   gains `mainView`/`relatedSlot` props and renders left/right columns, rail
   wrapped in the height-bounded scroller (`xl:max-h-[calc(100vh-1.5rem)]
   xl:overflow-y-auto` — no sticky, §1); instrument views gain
   `compact` and App passes it; App passes `relatedSlot={null}` (slot renders
   nothing until L-51). Green; contract grep clean.
3. **Commit 3 — jam view (§1.1).** App: `jamView` UI-state + the controls-bar
   `⛶ Jam view` toggle button; page root `h-screen overflow-hidden flex
   flex-col` + grid `flex-1 min-h-0` + left-column flex layout while active;
   below-dashboard region conditionally unmounted; JamGuide's rail wrapper
   accepts a `fill` (or `jamView`) prop switching the max-h bound → `h-full
   overflow-y-auto`; best-effort `requestFullscreen()`/`exitFullscreen()`
   **with `.catch(() => {})`** (they return Promises — a bare try/catch does
   not swallow the rejection) + `fullscreenchange` sync + Escape keydown
   (active only while `jamView`).
   🚨 Pure layout/UI-state — zero contact with audio callbacks, refs, or
   AudioCapture props; the toggle never starts/stops listening. Standalone
   green on top of commit 2.

### 6.2 D-51 (Muse) — rail at column width

**Files:** `src/components/GlanceRail.jsx`, `src/components/VoicingBrowser.jsx`
(dense-path spacing only). Recommended-cell prominence; cell padding/gap shave
as **margin-hardening for the ~4px-tight 284+160 piano pair fit** (§4 — it
passes today; the shave makes it robust to label length / scrollbar gutters /
rounding); header wrap tuning at ~456px; verify wrap-never-scroll, playhead
highlight, AA contrast + focus rings; eyeball 1280×900, 1440×900, ~640px
stacked; recompute §4's table against the built thing. No auto-scroll
introduced.

### 6.3 L-51 (Luthier) — RelatedProgressions

**Files:** `src/components/RelatedProgressions.jsx` (new), `src/lib/match.js`
(**additive exports only**: `loopToDegrees`, `canonicalDegrees` — flag the
shared-file lock to Maestro at promotion), `src/App.jsx` (one-line: pass
`relatedSlot={<RelatedProgressions …/>}`). Ranking per §5, exported from the
component file for smoke coverage; honest empty states; build + smoke green.
Disjoint from D-51 (App.jsx/match.js vs GlanceRail/VoicingBrowser) → may run
in parallel after L-50.

---

## 7. Narrow plan (< xl, and the ~640px check)

Columns stack in the jam-following order: **loop strip → instrument view →
voicings rail → licks strip → related progressions** — i.e. the right column
tucks between mainView and LicksStrip, matching the user's list order.
Implementation: the rail block is simply the second child inside the stacked
flow below `xl` (JamGuide reorders its own children with responsive classes or
conditional order — no duplicate mounts). The rail **unbounds** below `xl`
(the max-h/overflow classes are `xl:`-prefixed) and lays out at natural height
in page flow — a nested scroller inside a scrolling page is a trap on touch.
Cell wrap at ~576px interior: guitar 5/line, piano cells **pair** (a 284px
two-octave + a 160px one-octave = 452, or two two-octaves at the 576 boundary) —
the same margin-hardened pairing D-51 verified for the bounded column (§4),
with more room here, not the "cells ride alone" of the narrower bounded width. The instrument
selector never moves: it lives in the controls bar, global, above everything
at every width.

**Jam view below `xl`:** the toggle still works — below-dashboard surfaces
hide and fullscreen still fires — but the stacked dashboard is taller than any
narrow viewport, so the page keeps scrolling (`h-screen overflow-hidden`
applies only at `xl:`+ alongside the grid). One-screen is a two-column
promise; jam view narrows honestly to "distraction-free" rather than
pretending the geometry works.

---

## 8. Rejected alternatives

**Rejected A — keep the rail as the full-width band and put licks +
progressions in the right column instead.** The rail is the surface the
directive names for the right side ("i'd like to have the suggested voicings
on the right side of the screen (the jam guide)") — and the math agrees: full
width doesn't make the rail *shorter* in any useful way (rows are height-bound
by cell-line count, and at 1,240px most piano galleries fit one line, but the
band still starts below the instrument view and pushes licks/progressions off
screen — today's exact failure). Licks and progressions are short; they fit
under the instrument view; the tall thing is what needs the dedicated column.

**Rejected B — one-screen by truncation: show only the recommended voicing per
station, gallery behind a tap.** Fits 4 stations in ~640px with zero scroll —
and violates three standing calls at once: scroll > click, D-30's "all at once"
gallery directive, and the learning value the user praised ("potentially learn
new ways to play it while you are playing"). The gallery stays; its depth
becomes a contained scroll, not a click.

**Rejected C — rail in the LEFT column, detection surfaces right.** Reading
order puts the primary, continuously-tracked surfaces (strip, instrument view)
top-left where Western eyes rest; the rail is a reference you glance at. Also
geometric: the instrument view wants the wide column (674px natural fretboard
width > 500px rail), and swapped columns would force the fretboard to ~0.68
scale — sub-legible labels.

**Rejected D — compact the instrument view via CSS `transform: scale()` or a
reduced fret range.** Covered in §2: transform blurs text and shrinks targets;
frets 0–7 amputates upper-position play. The natural-width cap + chrome trim
achieves the same ~80px saving honestly.

**Rejected E — page-flow rail (no height bound, no contained scroll).** The
"pure" reading of the no-nested-scrollbar taste rule — and it structurally
fails the refinement: an unbounded rail stretches the *document* to the rail's
full height (a jazz piano loop ≈ ~3,000px+), so the below-grid region —
LoopStation and the whole learning area — lands thousands of pixels down
instead of one flick below the dashboard; and in jam view an unbounded rail
can never fit `h-screen`, so the 100vh hard constraint is unmeetable without
the bound anyway. (The left column's five surfaces sit at the top either way —
the cost is the document's length and the jam-view fit, not their
co-presence.) Below `xl` this rejection inverts — §7 — because stacked
layouts have no second column to preserve.

---

## 9. Out of scope / flags for Maestro

- **Contained auto-follow** inside the rail scroller — now technically safe,
  deliberately deferred; user-pulled follow-up only (§4).
- **LoopStation in jam view** — excluded per the user's own enumeration (§3
  recorded call); if missed mid-jam, admitting it is a one-line conditional.
  User-pulled follow-up only.
- **Root-aligned MiniPiano crop** (halves piano rail height) — reopens D-24;
  D-52 candidate (§4).
- **`src/lib/match.js` additive exports** in L-51 — shared-file lock note at
  promotion (§6.3). Same coordination point covers D-62: if its fix (a) lands
  collapsed-form indexing in match.js first, L-51's ranking consumes that
  shared collapsed form instead of collapsing locally (§5).
- **Retire-then-delete backlog** grows by ProgressionSuggestions.jsx
  (unmounted L-50) alongside RoadmapTrack/CurrentJamPanel/EducationPanel.
- KnowledgeDock deep-link ("open Explore at style X") — not invented for v1;
  RelatedProgressions taps go per-chord to ChordDetailModal (§5).
- No new tokens, no new colours, no dependencies, no KB/theory/audio changes
  anywhere in this design. Geometry figures verified per integrated-glance.md;
  module heights are estimates and D-51/C-50 re-measure the built thing.
