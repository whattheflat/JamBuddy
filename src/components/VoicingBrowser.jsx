// VoicingBrowser — a standalone, playable voicing browser for ONE chord (task D-21).
//
// For a given { rootPc, quality } it shows every way the KB knows to voice that
// chord, switchable via chips, each auditionable through the speakers:
//
//   Guitar row — all `GUITAR_SHAPES[quality]` entries from src/lib/voicings.js
//     that are placeable for this root (open shapes only in their native key,
//     movable shapes only when the whole grip fits under fret 15), rendered via
//     the existing <ChordDiagram/> ({rootStr, offsets} / {frets, onlyRoot} + rootPc).
//   Piano row — the four src/lib/piano.js `pianoVoicing` styles
//     (root / shell / rootlessA / rootlessB) rendered via <MiniPiano voicing/>,
//     chips carrying each voicing's honest label (e.g. "rootless A (3-5-7-9)").
//
// Playback: src/lib/chordAudio.js (L-20). Each row's ▶ plays the SELECTED
// voicing; the previous sound is always stopped via the returned {stop} handle
// before a new one starts (switching chips also stops it), so previews never
// layer. First ▶ click is the user gesture that lazily creates the AudioContext.
//
// Mount points (docs/design/knowledge-center.md §3 — wired by L-21/L-22, NOT here):
// Knowledge Center Voicings section, ChordDetailModal Guitar/Piano tabs, and the
// Jam Guide station-enlarge view. This component stays pure & prop-driven.
//
// Props:
//   rootPc  — chord root pitch class 0–11 (default 0 = C)
//   quality — CHORD_TYPES key; unknown values fall back to 'maj'
//             (matching voicings.js / piano.js behaviour)

import { useEffect, useMemo, useRef, useState } from 'react'
import ChordDiagram from './ChordDiagram'
import MiniPiano from './MiniPiano'
import { GUITAR_SHAPES } from '../lib/voicings'
import { pianoVoicing, hasTrueSeventh } from '../lib/piano'
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

// Selection chip. Active state puts small accent text on bg-surface (#0f0f0f),
// where accent #a855f7 measures ≈4.8:1 — AA for small text (surface-background
// rule); inactive text is gray-300 on surface (AA comfortable).
function Chip({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      title={title}
      className={
        'h-8 shrink-0 rounded-full border px-3 text-xs leading-none outline-none transition ' +
        'focus-visible:ring-2 focus-visible:ring-accent ' +
        (active
          ? 'border-accent bg-surface font-semibold text-accent'
          : 'border-border bg-surface text-gray-300 hover:border-gray-500 hover:text-gray-100')
      }
    >
      {children}
    </button>
  )
}

function PlayButton({ ariaLabel, onClick }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-accent ' +
        'bg-surface px-3 text-xs font-semibold text-accent outline-none transition ' +
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

// ─── The browser ──────────────────────────────────────────────────────────────

export default function VoicingBrowser({ rootPc = 0, quality = 'maj' }) {
  const pc = mod12(Number.isFinite(rootPc) ? rootPc : 0)
  const name = chordName(pc, quality)
  const chordKey = `${pc}:${quality}`

  const guitarShapes = useMemo(() => matchingShapes(quality, pc), [quality, pc])
  const pianoOptions = useMemo(
    () =>
      PIANO_STYLES.map((style) => ({
        style,
        voicing: pianoVoicing({ rootPc: pc, quality }, { style }),
      })),
    [pc, quality],
  )

  const [guitarIdx, setGuitarIdx] = useState(0)
  const [pianoStyle, setPianoStyle] = useState(hasTrueSeventh(quality) ? 'shell' : 'root')

  // One live playback handle for the whole browser: any new play (or chip
  // switch, chord change, unmount) stops the previous sound first — the
  // L-20 {stop} contract, so previews never layer or leak.
  const handleRef = useRef(null)
  const stopCurrent = () => {
    handleRef.current?.stop()
    handleRef.current = null
  }

  // New chord → reset selections, silence the old preview.
  useEffect(() => {
    setGuitarIdx(0)
    setPianoStyle(hasTrueSeventh(quality) ? 'shell' : 'root')
    stopCurrent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chordKey])

  // Unmount → release whatever is still ringing.
  useEffect(() => stopCurrent, [])

  // Guard against a stale index during the one render before the reset effect.
  const gi = Math.min(guitarIdx, Math.max(0, guitarShapes.length - 1))
  const selectedShape = guitarShapes[gi] ?? null
  const selectedPiano =
    pianoOptions.find((o) => o.style === pianoStyle) ?? pianoOptions[0]

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
      {/* ── Guitar row ── */}
      <section
        aria-label={`Guitar voicings for ${name}`}
        className="min-w-[240px] flex-1 basis-[300px] rounded-lg border border-border bg-panel p-3"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <SectionHeading>Guitar · {name}</SectionHeading>
          {selectedShape && (
            <PlayButton
              ariaLabel={`Play ${name} — ${selectedShape.label} guitar voicing`}
              onClick={() => playGuitar(selectedShape)}
            />
          )}
        </div>

        {guitarShapes.length === 0 ? (
          // Graceful: nothing placeable for this root/quality — say so, no crash.
          <p className="text-xs text-gray-400">
            No guitar shape sits comfortably for {name} — try the piano voicings.
          </p>
        ) : (
          <>
            <div
              role="group"
              aria-label={`${name} guitar shape options`}
              className="mb-2 flex flex-wrap gap-1.5"
            >
              {guitarShapes.map((shape, i) => (
                <Chip
                  key={`${shape.label}-${i}`}
                  active={i === gi}
                  title={`${shape.label} shape`}
                  onClick={() => {
                    stopCurrent()
                    setGuitarIdx(i)
                  }}
                >
                  {shape.label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <ChordDiagram
                shape={selectedShape}
                rootPc={pc}
                size="full"
                label={name}
              />
            </div>
          </>
        )}
      </section>

      {/* ── Piano row ── */}
      <section
        aria-label={`Piano voicings for ${name}`}
        className="min-w-[240px] flex-1 basis-[300px] rounded-lg border border-border bg-panel p-3"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <SectionHeading>Piano · {name}</SectionHeading>
          <PlayButton
            ariaLabel={`Play ${name} — ${selectedPiano.voicing.label} piano voicing`}
            onClick={() => playPiano(selectedPiano.voicing)}
          />
        </div>

        <div
          role="group"
          aria-label={`${name} piano voicing options`}
          className="mb-2 flex flex-wrap gap-1.5"
        >
          {pianoOptions.map(({ style, voicing }) => (
            <Chip
              key={style}
              active={style === selectedPiano.style}
              title={voicing.label}
              onClick={() => {
                stopCurrent()
                setPianoStyle(style)
              }}
            >
              {voicing.label}
            </Chip>
          ))}
        </div>

        {/* MiniPiano's SVG has a fixed pixel width (up to ~390px for 3 octaves);
            scroll it on narrow columns rather than letting it break the layout.
            pianoVoicing() output carries no rootPc, and without it VoicingPiano
            falls back to the LOWEST voice for its "R" badge — wrong for rootless
            voicings, whose bass is the 3rd (A) or 7th (B). Supply the chord root. */}
        <div className="max-w-full overflow-x-auto">
          <MiniPiano voicing={{ ...selectedPiano.voicing, rootPc: pc }} size="thumb" />
        </div>
      </section>

      {/* Mic-feedback caveat, per the L-20 header + D-20 §3 (microcopy tier). */}
      <p className="w-full basis-full text-[11px] text-gray-500">
        Previews play through your speakers — while the mic is live, detection may
        hear them.
      </p>
    </div>
  )
}
