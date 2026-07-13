// VoicingBrowser — a playable voicing GALLERY for ONE chord (task D-30; was the
// chip-switched browser of D-21/D-23).
//
// For a given { rootPc, quality } it shows every way the KB knows to voice that
// chord — ALL AT ONCE, no chips, no selection state (user directive 2026-07-10:
// "see all the variations G shape, C shape, etc in one view without having to
// push a button. so they all line up next to each other"):
//
//   Guitar section — every placeable `GUITAR_SHAPES[quality]` entry from
//     src/lib/voicings.js (open shapes only in their native key, movable shapes
//     only when the whole grip fits under fret 15), each cell = shape label +
//     <ChordDiagram size="thumb"/>.
//   Piano section — all four src/lib/piano.js `pianoVoicing` styles
//     (root / shell / rootlessA / rootlessB), each cell = the voicing's honest
//     label (e.g. "rootless A (3-5-7-9)") + <MiniPiano voicing/>.
//
// No playback (L-70 / dashboard-polish.md §3): the per-cell ▶ preview was removed
// from EVERY mount — the user settled "leave them off, better not." The component
// is now purely visual; src/lib/chordAudio.js is no longer imported here.
//
// Mount points (wired by L-21/L-22, NOT here): Knowledge Center Voicings
// section, ChordDetailModal Guitar/Piano tabs (show="guitar"/"piano", L-25),
// and the Jam Guide station rail / heard-live view (dense). This component stays
// pure & prop-driven.
//
// Layout: each instrument section is a flex-wrap gallery of fixed-content-width
// cells, so it reflows to fewer columns (down to one cell per row) inside a
// narrow modal or the Jam Guide dock — no horizontal scroll needed except the
// per-cell guard around the widest MiniPiano thumbs (~266px for 2-octave
// rootless voicings).
//
// Props:
//   rootPc  — chord root pitch class 0–11 (default 0 = C)
//   quality — CHORD_TYPES key; unknown values fall back to 'maj'
//             (matching voicings.js / piano.js behaviour)
//   show    — 'guitar' | 'piano' | 'both' (default 'both', task D-23): which
//             instrument section(s) to render. 'bass' (task D-41, D-40 §3)
//             renders NEITHER gallery — guitar shapes are not bass patterns and
//             pianoVoicing is piano, so showing either under the global BASS
//             selector would lie; an honest one-liner renders instead. Any
//             OTHER value still falls back to both, so every pre-existing
//             mount renders identically with no prop.
//   dense   — boolean (default false, task L-33 — additive per D-31 §5; D-41
//             restyled it for the all-expanded GlanceRail rows): drops the
//             section chrome (border/panel background/heading — the row header
//             already names the chord) and suppresses the per-mount
//             mic-feedback microcopy (the rail shows it ONCE for the whole
//             rail, D-31 §2.5). D-51 (one-screen.md §4) additionally tightens
//             the DENSE cell spacing for the 500px right column — cell p-2 →
//             p-1.5 and gallery gap-2 → gap-1.5 — which hardens the column's
//             two-octave + one-octave piano pair fit (279.6 + 6 + 156.4 = 442
//             ≤ 451px row interior even with a classic Windows scrollbar in
//             the rail's scroller; it was 452 vs 456, a ~4px squeak, before).
//             L-70 (dashboard-polish.md §2) additionally renders the piano
//             styles as a 2×2 grid of `size="mini"` keyboards under dense, and
//             applies the `.dark-scroll` utility to each cell's scroller. Every
//             pre-existing mount renders identically with no prop.
//   recommended — a shape object (guitar) or voicing object (piano) marking the
//             KB play's own voicing (dashboard rail only). Guitar: matched into
//             the list by `label`, floated to cell #1, badged "play" + accent
//             border, and the list reordered recommended-first (§1.2). Piano:
//             matched by `voicing.style`, that 2×2 cell gets the accent border
//             (§2.1). Default null → no highlight, order untouched.
//   max     — cap the guitar list to this many cells (dashboard rail passes 4).
//             Undefined → no cap (all placeable shapes). Off-rail mounts pass
//             neither `recommended` nor `max`, so the guitar list keeps its raw
//             `matchingShapes` declared order — byte-identical to today.

import { useMemo } from 'react'
import ChordDiagram from './ChordDiagram'
import MiniPiano from './MiniPiano'
import { GUITAR_SHAPES } from '../lib/voicings'
import { pianoVoicing } from '../lib/piano'
import { NOTES, CHORD_TYPES } from '../lib/theory'

// Standard-tuning open-string pitch classes, low-E first (mirrors ChordDiagram).
const OPEN_PCS = [4, 9, 2, 7, 11, 4]
const PIANO_STYLES = ['root', 'shell', 'rootlessA', 'rootlessB']

const mod12 = (n) => ((n % 12) + 12) % 12

// The shapes of `quality` that can actually be shown for this root:
//  - open shapes only when their native root matches (onlyRoot === rootPc);
//  - movable shapes only when every fretted string lands in 0–15 under
//    ChordDiagram's placement convention (root-at-open-string → fret-12 barre).
// Unknown quality falls back to maj (same fallback voicings.js itself uses).
function matchingShapes(quality, rootPc) {
  const shapes = GUITAR_SHAPES[quality] ?? GUITAR_SHAPES.maj
  return shapes.filter((shape) => {
    if (Array.isArray(shape.frets)) {
      // Open shape: fixed grip, valid only in its native key.
      return shape.onlyRoot === undefined || shape.onlyRoot === rootPc
    }
    if (!Array.isArray(shape.offsets) || !Number.isFinite(shape.rootStr)) return false
    const idx = 6 - shape.rootStr // rootStr 6 = low E → low-E-first index 0
    let baseFret = mod12(rootPc - (OPEN_PCS[idx] ?? 4))
    if (baseFret === 0) baseFret = 12 // ChordDiagram's octave-barre placement
    const abs = shape.offsets.filter((o) => typeof o === 'number').map((o) => baseFret + o)
    if (abs.length === 0) return false
    return Math.min(...abs) >= 0 && Math.max(...abs) <= 15
  })
}

// Lowest base fret of a movable shape under ChordDiagram's placement convention
// (root-at-open-string → fret-12 barre). Open shapes sit at the nut (0).
function baseFretOf(shape, rootPc) {
  if (Array.isArray(shape.frets)) return 0
  const idx = 6 - shape.rootStr
  let bf = mod12(rootPc - (OPEN_PCS[idx] ?? 4))
  if (bf === 0) bf = 12
  return bf
}

// Count of muted strings in a shape's grip (fewer = a fuller voicing wins ties).
function mutedCount(shape) {
  const arr = Array.isArray(shape.frets) ? shape.frets : shape.offsets
  return Array.isArray(arr) ? arr.filter((v) => v === 'x').length : 0
}

// The rail's ≤max, recommended-first ordering (dashboard-polish.md §1.2). Only
// invoked when `recommended` and/or `max` are supplied (the dashboard rail) —
// non-dense mounts skip it entirely and keep `matchingShapes` declared order,
// so VoicingsSection/ChordDetailModal stay byte-identical.
//   1. recommended first (matched into the placeable list by label; prepended
//      even if it was filtered out as unplaceable);
//   2. open-position forms (Array.isArray(frets));
//   3. movable/barre by lowest base fret ascending;
//   4. tiebreak: fewer muted strings, then declared order in GUITAR_SHAPES.
// Then slice to `max` (recommended deduped so it never repeats). <max placeable
// shapes just show what exist — the rule caps, never pads.
function orderGuitarShapes(shapes, rootPc, recommended, max) {
  const declaredIndex = new Map(shapes.map((s, i) => [s, i]))
  let rec = null
  if (recommended?.label) {
    rec = shapes.find((s) => s.label === recommended.label) ?? recommended
  }
  const rest = shapes.filter((s) => s.label !== rec?.label)
  rest.sort((a, b) => {
    const aOpen = Array.isArray(a.frets) ? 0 : 1
    const bOpen = Array.isArray(b.frets) ? 0 : 1
    if (aOpen !== bOpen) return aOpen - bOpen
    if (aOpen === 1) {
      const bf = baseFretOf(a, rootPc) - baseFretOf(b, rootPc)
      if (bf !== 0) return bf
    }
    const mc = mutedCount(a) - mutedCount(b)
    if (mc !== 0) return mc
    return (declaredIndex.get(a) ?? 0) - (declaredIndex.get(b) ?? 0)
  })
  const ordered = rec ? [rec, ...rest] : rest
  const list = Number.isFinite(max) ? ordered.slice(0, max) : ordered
  return { list, recLabel: rec?.label ?? null }
}

// "C", "Cm7", "Cmaj7"… — display name from the app's canonical chord model.
function chordName(rootPc, quality) {
  const q = CHORD_TYPES[quality] ? quality : 'maj'
  return `${NOTES[mod12(rootPc)]}${CHORD_TYPES[q].suffix}`
}

// ─── Small presentational atoms ───────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </h4>
  )
}

// One gallery cell: label on top, diagram/keyboard thumb underneath.
// bg-surface inside the bg-panel section gives the cells a quiet inlay border;
// label is gray-300 on surface (AA comfortable at 11px semibold).
// `dense` (D-51): p-1.5 instead of p-2 — 4px off each cell's box width, part of
// the right-column margin-hardening. Non-dense output is byte-identical.
// `recommended` (L-70, dashboard-polish.md §1.2): the KB play's shape/style —
// accent border + a "play" badge (finger-this, not audio; ▶ is gone), the
// prominence the old GlanceRail own-cell carried. Only ever set under the
// dashboard rail, so non-recommended cells stay byte-identical.
function GalleryCell({ label, recommended = false, dense = false, children }) {
  return (
    <figure className={`flex min-w-0 flex-col items-center gap-1.5 rounded-md border ${recommended ? 'border-accent' : 'border-border'} bg-surface ${dense ? 'p-1.5' : 'p-2'}`}>
      {recommended ? (
        <figcaption
          className="flex max-w-full items-center gap-1.5 text-center text-[11px] font-medium leading-tight text-gray-300"
          title={label}
        >
          <span className="rounded bg-accent px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
            play
          </span>
          <span className="break-words">{label}</span>
        </figcaption>
      ) : (
        <figcaption
          className="max-w-full break-words text-center text-[11px] font-medium leading-tight text-gray-300"
          title={label}
        >
          {label}
        </figcaption>
      )}
      {/* Scroll guard: MiniPiano's SVG has a fixed pixel width (up to ~266px
          for a 2-octave thumb window); scroll inside the cell on very narrow
          viewports rather than letting it break the wrap layout. `dark-scroll`
          (L-70 §4) dresses this scroller on the dashboard rail only (dense) —
          the KC/modal keep the OS default, so non-dense stays byte-identical. */}
      <div className={`max-w-full overflow-x-auto${dense ? ' dark-scroll' : ''}`}>{children}</div>
    </figure>
  )
}

// ─── The gallery ──────────────────────────────────────────────────────────────

export default function VoicingBrowser({
  rootPc = 0, quality = 'maj', show = 'both', dense = false, recommended = null, max,
}) {
  const pc = mod12(Number.isFinite(rootPc) ? rootPc : 0)
  const name = chordName(pc, quality)

  // Section gating (D-23; 'bass' added by D-41 per D-40 §3). 'guitar' hides
  // the piano section, 'piano' hides the guitar section, 'bass' hides BOTH
  // (neither gallery is honest for a bassist — the one-liner below renders
  // instead, so the dock's VoicingsSection under the global BASS selector
  // stops showing guitar+piano). Anything else (incl. the 'both' default)
  // shows both. Hooks stay unconditional.
  const showGuitar = show !== 'piano' && show !== 'bass'
  const showPiano = show !== 'guitar' && show !== 'bass'

  const allGuitarShapes = useMemo(() => matchingShapes(quality, pc), [quality, pc])

  // Guitar list: the dashboard rail (recommended and/or max supplied) reorders
  // recommended-first + caps to `max` (§1.2); every other mount keeps the raw
  // `matchingShapes` declared order untouched — byte-identical to today.
  const guitarView = useMemo(() => {
    if (!recommended && !Number.isFinite(max)) {
      return { list: allGuitarShapes, recLabel: null }
    }
    return orderGuitarShapes(allGuitarShapes, pc, recommended, max)
  }, [allGuitarShapes, pc, recommended, max])
  const guitarShapes = guitarView.list

  const pianoOptions = useMemo(
    () =>
      PIANO_STYLES.map((style) => ({
        style,
        voicing: pianoVoicing({ rootPc: pc, quality }, { style }),
      })),
    [pc, quality],
  )
  // Piano "recommended" (dashboard rail): the station's authored voicing matches
  // one of the four styles → that 2×2 cell gets the accent border (§2.1). Guitar-
  // shape `recommended` objects have no `.style`, so this stays null off-rail.
  const recStyle = recommended && typeof recommended.style === 'string' ? recommended.style : null

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2">
      {/* ── Guitar section: every placeable shape, side by side ── */}
      {showGuitar && (
      <section
        aria-label={`Guitar voicings for ${name}`}
        className={`min-w-[240px] flex-1 basis-[300px] ${dense ? '' : 'rounded-lg border border-border bg-panel p-3'}`}
      >
        {/* dense (a GlanceRail row): the row header already names the chord and
            the global selector names the instrument — no repeated heading. */}
        {!dense && (
          <div className="mb-2">
            <SectionHeading>Guitar · {name}</SectionHeading>
          </div>
        )}

        {guitarShapes.length === 0 ? (
          // Graceful: nothing placeable for this root/quality — say so, no crash.
          <p className="text-xs text-gray-400">
            No guitar shape sits comfortably for {name} — try the piano voicings.
          </p>
        ) : (
          <div
            role="group"
            aria-label={`${name} guitar shapes — every shape shown, each playable`}
            className={`flex flex-wrap items-stretch ${dense ? 'gap-1.5' : 'gap-2'}`}
          >
            {guitarShapes.map((shape, i) => (
              <GalleryCell
                key={`${shape.label}-${i}`}
                label={shape.label}
                recommended={guitarView.recLabel !== null && shape.label === guitarView.recLabel}
                dense={dense}
              >
                <ChordDiagram shape={shape} rootPc={pc} size="thumb" />
              </GalleryCell>
            ))}
          </div>
        )}
      </section>
      )}

      {/* ── Piano section: all four voicing styles, side by side ── */}
      {showPiano && (
      <section
        aria-label={`Piano voicings for ${name}`}
        className={`min-w-[240px] flex-1 basis-[300px] ${dense ? '' : 'rounded-lg border border-border bg-panel p-3'}`}
      >
        {!dense && (
          <div className="mb-2">
            <SectionHeading>Piano · {name}</SectionHeading>
          </div>
        )}

        {/* dense (dashboard rail, §2.1): the four styles render as a tidy 2×2
            grid of compact `size="mini"` keyboards (two per column fit the
            ~451px row interior). Non-dense keeps today's flex-wrap gallery at
            size="thumb" — byte-identical. */}
        <div
          role="group"
          aria-label={`${name} piano voicings — every style shown, each playable`}
          className={dense ? 'grid grid-cols-2 gap-1.5' : 'flex flex-wrap items-stretch gap-2'}
        >
          {/* pianoVoicing() output carries no rootPc, and without it VoicingPiano
              falls back to the LOWEST voice for its "R" badge — wrong for rootless
              voicings, whose bass is the 3rd (A) or 7th (B). Supply the chord root. */}
          {pianoOptions.map(({ style, voicing }) => (
            <GalleryCell
              key={style}
              label={voicing.label}
              recommended={recStyle !== null && style === recStyle}
              dense={dense}
            >
              <MiniPiano voicing={{ ...voicing, rootPc: pc }} size={dense ? 'mini' : 'thumb'} />
            </GalleryCell>
          ))}
        </div>
      </section>
      )}

      {/* ── show='bass' (D-41, D-40 §3): no gallery would be honest — say so
             in one line instead of rendering guitar+piano under BASS. ── */}
      {!showGuitar && !showPiano && (
        <p className="text-xs text-gray-400">
          No bass voicings for {name} yet — authored bass patterns are on the way
          (blues first). Guitar and piano voicings live under those instruments.
        </p>
      )}

    </div>
  )
}
