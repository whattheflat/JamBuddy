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
//     <ChordDiagram size="thumb"/> + its own ▶.
//   Piano section — all four src/lib/piano.js `pianoVoicing` styles
//     (root / shell / rootlessA / rootlessB), each cell = the voicing's honest
//     label (e.g. "rootless A (3-5-7-9)") + <MiniPiano voicing size="thumb"/> +
//     its own ▶.
//
// Playback: src/lib/chordAudio.js (L-20). ONE live {stop} handle for the whole
// gallery — any ▶ stops the previous sound before starting (chord change and
// unmount also stop it), so previews never layer. First ▶ click is the user
// gesture that lazily creates the AudioContext.
//
// Mount points (wired by L-21/L-22, NOT here): Knowledge Center Voicings
// section, ChordDetailModal Guitar/Piano tabs (show="guitar"/"piano", L-25),
// and the Jam Guide station-enlarge view. This component stays pure & prop-driven.
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
//             instrument section(s) to render. Any other value falls back to
//             both, so every pre-existing mount renders identically with no prop.

import { useEffect, useMemo, useRef } from 'react'
import ChordDiagram from './ChordDiagram'
import MiniPiano from './MiniPiano'
import { GUITAR_SHAPES } from '../lib/voicings'
import { pianoVoicing } from '../lib/piano'
import { playVoicing, guitarShapeToNotes } from '../lib/chordAudio'
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

// "C", "Cm7", "Cmaj7"… — display name from the app's canonical chord model.
function chordName(rootPc, quality) {
  const q = CHORD_TYPES[quality] ? quality : 'maj'
  return `${NOTES[mod12(rootPc)]}${CHORD_TYPES[q].suffix}`
}

// ─── Small presentational atoms ───────────────────────────────────────────────

// Per-cell ▶. Small accent text sits on bg-surface (#0f0f0f), where accent
// #a855f7 measures ≈4.8:1 — AA for small text (surface-background rule).
function PlayButton({ ariaLabel, onClick }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-accent ' +
        'bg-surface px-2.5 text-xs font-semibold text-accent outline-none transition ' +
        'hover:bg-accent hover:text-black focus-visible:ring-2 focus-visible:ring-accent'
      }
    >
      <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 fill-current">
        <path d="M2.5 1.5v9l8-4.5z" />
      </svg>
      Play
    </button>
  )
}

function SectionHeading({ children }) {
  return (
    <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </h4>
  )
}

// One gallery cell: label on top, diagram thumb, its own ▶ underneath.
// bg-surface inside the bg-panel section gives the cells a quiet inlay border;
// label is gray-300 on surface (AA comfortable at 11px semibold).
function GalleryCell({ label, playLabel, onPlay, children }) {
  return (
    <figure className="flex min-w-0 flex-col items-center gap-1.5 rounded-md border border-border bg-surface p-2">
      <figcaption
        className="max-w-full break-words text-center text-[11px] font-medium leading-tight text-gray-300"
        title={label}
      >
        {label}
      </figcaption>
      {/* Scroll guard: MiniPiano's SVG has a fixed pixel width (up to ~266px
          for a 2-octave thumb window); scroll inside the cell on very narrow
          viewports rather than letting it break the wrap layout. */}
      <div className="max-w-full overflow-x-auto">{children}</div>
      <PlayButton ariaLabel={playLabel} onClick={onPlay} />
    </figure>
  )
}

// ─── The gallery ──────────────────────────────────────────────────────────────

export default function VoicingBrowser({ rootPc = 0, quality = 'maj', show = 'both' }) {
  const pc = mod12(Number.isFinite(rootPc) ? rootPc : 0)
  const name = chordName(pc, quality)
  const chordKey = `${pc}:${quality}`

  // Section gating (D-23). 'guitar' hides the piano section, 'piano' hides the
  // guitar section, anything else (incl. the 'both' default) shows both — so at
  // least one section ALWAYS renders, and the mic-feedback microcopy below
  // stays with it. Hooks stay unconditional; the shared stop-handle discipline
  // (stop on chord change / unmount) is untouched by hiding a section.
  const showGuitar = show !== 'piano'
  const showPiano = show !== 'guitar'

  const guitarShapes = useMemo(() => matchingShapes(quality, pc), [quality, pc])
  const pianoOptions = useMemo(
    () =>
      PIANO_STYLES.map((style) => ({
        style,
        voicing: pianoVoicing({ rootPc: pc, quality }, { style }),
      })),
    [pc, quality],
  )

  // One live playback handle for the whole gallery: any new play (or chord
  // change, or unmount) stops the previous sound first — the L-20 {stop}
  // contract, so previews never layer or leak.
  const handleRef = useRef(null)
  const stopCurrent = () => {
    handleRef.current?.stop()
    handleRef.current = null
  }

  // Chord change → cleanup silences the old preview; same cleanup covers unmount.
  useEffect(() => stopCurrent, [chordKey])

  // Known advisory (L-20 gate): when a movable shape's root lands on an open
  // string (base fret 0), ChordDiagram draws the fret-12 octave barre while
  // guitarShapeToNotes places the grip at the open position — the SAME chord,
  // one octave lower than drawn. Deliberately left as-is on both sides.
  function playGuitar(shape) {
    stopCurrent()
    handleRef.current = playVoicing(guitarShapeToNotes(shape, { rootPc: pc }), {
      strumMs: 45, // a light strum reads "guitar"
      durMs: 1800,
    })
  }

  function playPiano(voicing) {
    stopCurrent()
    handleRef.current = playVoicing(voicing?.notes ?? [], {
      strumMs: 15, // near-block chord reads "piano"
      durMs: 1800,
    })
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap gap-2">
      {/* ── Guitar section: every placeable shape, side by side ── */}
      {showGuitar && (
      <section
        aria-label={`Guitar voicings for ${name}`}
        className="min-w-[240px] flex-1 basis-[300px] rounded-lg border border-border bg-panel p-3"
      >
        <div className="mb-2">
          <SectionHeading>Guitar · {name}</SectionHeading>
        </div>

        {guitarShapes.length === 0 ? (
          // Graceful: nothing placeable for this root/quality — say so, no crash.
          <p className="text-xs text-gray-400">
            No guitar shape sits comfortably for {name} — try the piano voicings.
          </p>
        ) : (
          <div
            role="group"
            aria-label={`${name} guitar shapes — every shape shown, each playable`}
            className="flex flex-wrap items-stretch gap-2"
          >
            {guitarShapes.map((shape, i) => (
              <GalleryCell
                key={`${shape.label}-${i}`}
                label={shape.label}
                playLabel={`Play ${name} — ${shape.label} guitar voicing`}
                onPlay={() => playGuitar(shape)}
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
        className="min-w-[240px] flex-1 basis-[300px] rounded-lg border border-border bg-panel p-3"
      >
        <div className="mb-2">
          <SectionHeading>Piano · {name}</SectionHeading>
        </div>

        <div
          role="group"
          aria-label={`${name} piano voicings — every style shown, each playable`}
          className="flex flex-wrap items-stretch gap-2"
        >
          {/* pianoVoicing() output carries no rootPc, and without it VoicingPiano
              falls back to the LOWEST voice for its "R" badge — wrong for rootless
              voicings, whose bass is the 3rd (A) or 7th (B). Supply the chord root. */}
          {pianoOptions.map(({ style, voicing }) => (
            <GalleryCell
              key={style}
              label={voicing.label}
              playLabel={`Play ${name} — ${voicing.label} piano voicing`}
              onPlay={() => playPiano(voicing)}
            >
              <MiniPiano voicing={{ ...voicing, rootPc: pc }} size="thumb" />
            </GalleryCell>
          ))}
        </div>
      </section>
      )}

      {/* Mic-feedback caveat, per the L-20 header + D-20 §3 (microcopy tier).
          At least one section always renders (see the gating above), so this stays. */}
      <p className="w-full basis-full text-[11px] text-gray-500">
        Previews play through your speakers — while the mic is live, detection may
        hear them.
      </p>
    </div>
  )
}
