// BassPatternCard — per-station authored bass pattern as compact 4-string tab
// (task L-42, per docs/design/integrated-glance.md §3's gallery-slot contract
// and SCHEMA.md "Bass play").
//
// Given a station's { rootPc, quality }, one play's per-station `pattern`, and
// the NEXT station's root (approach pitches derive from it — the loop wraps),
// this renders the REALIZED line: the degree/approach data resolved to actual
// pitches and placed on the bass. Visually it rhymes with LickCard's tab SVG
// (same string-line + surface-pill-number language, same technique-glyph
// vocabulary) but with the bass rendering convention from SCHEMA.md:
//
//   standard 4-string tuning E–A–D–G, string 1 = G (HIGHEST) rendered on top,
//   string 4 = low E at the bottom — the same "1 = highest string" counting as
//   lick tab and `rootStr`, so no third scheme exists in this codebase.
//
// ── Realization rules (SCHEMA.md "Bass play") ─────────────────────────────────
// Pitch space: semitones above open low E (E1). Open strings sit at 0 (E),
// 5 (A), 10 (D), 15 (G); the playable ceiling is 30 (G string, fret 15).
//
//  · The station ROOT lands on its lowest playable position:
//    rootAbs = (rootPc − 4) mod 12   (open E's pitch class is 4).
//  · A `deg` note sits at rootAbs + resolveDegree(deg, quality) + 12·octave.
//    The schema caps the resolved offset at 19 semitones, so every deg note
//    fits ≤ 30 by construction (11 + 19); anything unresolvable nulls the
//    whole pattern and the card renders its placeholder instead of lying.
//  · An `approach` note's PITCH CLASS derives from the next station's root:
//    chrom-below = next−1 · chrom-above = next+1 · fifth-of-next = next+7
//    (mod 12). Its OCTAVE is the placement nearest the previous realized note
//    (approaches are terminal, so a previous note always exists), which keeps
//    the walkup/walkdown contour the author described — e.g. the 12-bar bar-4
//    walkup C–D–E♭ lands its E right above the E♭, not two octaves away.
//  · 🚨 C-41 gate rule — the open-E floor: a chrom-below into a next root at
//    open E (abs 0) has NO pitch below the instrument (−1 does not exist).
//    When the nearest placement falls below abs 0 it is OCTAVE-DISPLACED up
//    (+12): the approach plays a half-step under the OCTAVE root instead —
//    e.g. D♯ at abs 11 leading into E. The symmetric ceiling guard (> 30 →
//    −12) exists for completeness. This is the displacement rule the ledger
//    row mandates; keep it.
//  · String/fret: each realized pitch takes the HIGHEST-tuned open string at
//    or below it — the minimum-fret assignment. Because the root starts at
//    its lowest position (fret ≤ 11 worst case, usually ≤ 8) and strings are
//    tuned in fourths, the whole pattern lands in one hand position within
//    frets 0–15 (the schema's ≤ 19-semitone span guarantee).
//
// ── Rendering ─────────────────────────────────────────────────────────────────
// Beat spacing when every note carries a `beat` (columns proportional to beat,
// faint beat numbers under the bottom string); plain even columns otherwise.
// Approach notes draw AMBER (the established secondary-tone colour) with a
// small arrow after the final one — they belong to the NEXT chord. Technique
// marks reuse the lick glyph vocabulary in its light form (amber letter/symbol
// above the note; ghost notes parenthesise and dim, as in LickCard).
//
// ── Playback (▶) ──────────────────────────────────────────────────────────────
// Sequential single-note scheduling through chordAudio's playVoicing (one call
// per note — playVoicing itself sorts/dedupes, which is wrong for a melodic
// line, so the ORDER lives here in setTimeout scheduling). Bass register:
// realized abs − 20 puts open E at chordAudio note −20 = E1 ≈ 41.2 Hz
// (chordAudio's space is 0 = C3; negatives are documented-legal input).
// Timing: beats at a fixed preview tempo when present, else even eighths.
// One pattern at a time module-wide: each play stops the previous sequence
// AND calls stopAll() so it never layers over a VoicingBrowser preview.

import { useEffect } from 'react'
import { NOTES } from '../lib/theory'
import { resolveDegree } from './JamGuide'
import { playVoicing, stopAll } from '../lib/chordAudio'

// SVG palette — mirrors LickCard's token constants (SVG fills can't read
// Tailwind classes): amber = technique/approach, surface = backing pills.
const AMBER = '#f59e0b'
const FRET_TEXT = '#e5e7eb'    // gray-200
const GHOST_TEXT = '#9ca3af'   // gray-400
const STRING_LINE = '#3a3a3a'
const STRING_LABEL = '#6b7280' // gray-500
const BEAT_LABEL = '#6b7280'
const CARD_BG = '#0f0f0f'      // token `surface`

// Strings top → bottom: 1 = G (highest), 4 = low E. `open` = semitones above E1.
const STRINGS = [
  { n: 1, name: 'G', open: 15 },
  { n: 2, name: 'D', open: 10 },
  { n: 3, name: 'A', open: 5 },
  { n: 4, name: 'E', open: 0 },
]
const OPEN_E_PC = 4 // pitch class of the low E string
const ABS_MAX = 30  // G string fret 15 — the playable ceiling

// Approach-type → semitone delta from the NEXT station's root (SCHEMA.md).
const APPROACH_DELTA = { 'chrom-below': -1, 'chrom-above': 1, 'fifth-of-next': 7 }

// Technique mark drawn above the note (light form of LickCard's glyphs; the
// full vocabulary is legal per SCHEMA.md — ghost-note is handled by the
// parenthesised dim label, double-stop by equal beats, chromatic-approach and
// unknown words get no mark, exactly like LickCard's graceful default).
const TECH_MARK = {
  'hammer-on': 'h',
  'pull-off': 'p',
  slide: '⟋',
  bend: '↑',
  vibrato: '~',
}

const mod12 = (n) => ((n % 12) + 12) % 12

// abs (semitones above open E1 = MIDI 28) → "E1"/"C2"… scientific spelling.
function absName(abs) {
  return `${NOTES[mod12(abs + OPEN_E_PC)]}${Math.floor((abs + 28) / 12) - 1}`
}

// Min-fret string assignment: highest-tuned open string at or below the pitch.
function placeOnString(abs) {
  for (const s of STRINGS) {
    if (abs >= s.open && abs - s.open <= 15) return { string: s.n, fret: abs - s.open }
  }
  return null // abs outside [0, 30] — caller nulls the pattern
}

/**
 * realizeBassPattern(pattern, rootPc, quality, nextRootPc)
 *   → [{ abs, string, fret, beat?, technique?, approach }] | null
 *
 * Pure realization per the header rules. Returns null on ANY malformed or
 * unplaceable note so the caller can render a placeholder — authored data is
 * validator-guaranteed, but a renderer must never crash on bad input.
 */
export function realizeBassPattern(pattern, rootPc, quality, nextRootPc) {
  if (!Array.isArray(pattern) || pattern.length === 0) return null
  if (!Number.isFinite(rootPc)) return null
  const rootAbs = mod12(rootPc - OPEN_E_PC) // lowest playable root position
  const out = []
  let prev = rootAbs // approach placement anchor (root until a note lands)
  for (const note of pattern) {
    if (!note || typeof note !== 'object') return null
    let abs
    if (note.deg !== undefined && note.approach === undefined) {
      const off = resolveDegree(String(note.deg), quality)
      if (off === null || off === undefined) return null
      abs = rootAbs + off + (note.octave === 1 ? 12 : 0)
    } else if (note.approach !== undefined && note.deg === undefined) {
      const delta = APPROACH_DELTA[note.approach]
      if (delta === undefined || !Number.isFinite(nextRootPc)) return null
      const pc = mod12(nextRootPc + delta)
      const base = mod12(pc - OPEN_E_PC)
      // Nearest octave placement to the previous note (ties resolve upward).
      abs = base + 12 * Math.round((prev - base) / 12)
      // C-41 open-E floor: chrom-below into a next root at open E resolves to
      // abs −1, which does not exist on the instrument — octave-displace the
      // approach up (+12: a half-step under the OCTAVE root). Ceiling mirror.
      if (abs < 0) abs += 12
      if (abs > ABS_MAX) abs -= 12
    } else {
      return null // exactly one of deg | approach per note (schema)
    }
    const placed = placeOnString(abs)
    if (!placed) return null
    out.push({
      abs,
      string: placed.string,
      fret: placed.fret,
      beat: Number.isFinite(note.beat) ? note.beat : undefined,
      technique: typeof note.technique === 'string' ? note.technique : undefined,
      approach: note.approach !== undefined,
    })
    prev = abs
  }
  return out
}

// ─── Sequential playback (module-level: one pattern at a time, app-wide) ─────

const PREVIEW_BPM = 96 // relaxed shuffle-ish preview tempo (display is tempo-free)

let currentSeq = null // { timeouts: number[], handles: {stop}[] }

function stopPattern() {
  if (!currentSeq) return
  for (const t of currentSeq.timeouts) clearTimeout(t)
  for (const h of currentSeq.handles) h.stop()
  currentSeq = null
}

function playPattern(realized) {
  stopPattern()
  stopAll() // never layer over a VoicingBrowser (or any other) preview
  const beatMs = 60000 / PREVIEW_BPM
  const hasBeats = realized.every((n) => Number.isFinite(n.beat))
  // Beats drive onsets when authored; otherwise even eighths.
  const times = realized.map((n, i) => (hasBeats ? (n.beat - 1) * beatMs : (i * beatMs) / 2))
  const seq = { timeouts: [], handles: [] }
  realized.forEach((n, i) => {
    // Ring until the next distinct onset (equal beats = a dyad, same onset);
    // the last note gets one beat. Small floor so ghost-short gaps still sound.
    const nextT = times.slice(i + 1).find((t) => t > times[i])
    const durMs = Math.max(160, (nextT !== undefined ? nextT - times[i] : beatMs) + 120)
    seq.timeouts.push(
      setTimeout(() => {
        // abs − 20: open E1 in chordAudio's 0 = C3 note space (negatives legal).
        seq.handles.push(playVoicing([n.abs - 20], { strumMs: 0, durMs, gain: 0.5 }))
      }, times[i]),
    )
  })
  currentSeq = seq
}

// ─── SVG geometry (LickCard's idiom, 4 strings) ───────────────────────────────

const STR_GAP = 13
const PAD_T = 14
const PAD_B = 6
const PAD_L = 20
const PAD_R = 12
const COL_W = 26
const BEAT_ROW = 10 // extra bottom room for beat numbers when beats render

function layoutPattern(realized) {
  const hasBeats =
    realized.every((n) => Number.isFinite(n.beat)) &&
    realized.every((n, i) => i === 0 || n.beat >= realized[i - 1].beat)
  let xs, width, maxBeat, unit = null
  if (hasBeats) {
    // Columns proportional to beat; scale so the tightest gap ≥ one column.
    const gaps = realized
      .map((n, i) => (i > 0 ? n.beat - realized[i - 1].beat : 0))
      .filter((g) => g > 0)
    const minGap = gaps.length ? Math.min(...gaps) : 1
    unit = Math.min(COL_W / minGap, COL_W * 4)
    xs = realized.map((n) => PAD_L + (n.beat - 1) * unit + 10)
    maxBeat = realized[realized.length - 1].beat
    width = PAD_L + (maxBeat - 1) * unit + 20 + PAD_R
  } else {
    xs = realized.map((_, i) => PAD_L + i * COL_W + COL_W / 2)
    width = PAD_L + realized.length * COL_W + PAD_R
    maxBeat = null
  }
  return {
    hasBeats,
    maxBeat,
    unit,
    width,
    height: PAD_T + 3 * STR_GAP + PAD_B + (hasBeats ? BEAT_ROW : 0),
    notes: realized.map((n, i) => ({
      ...n,
      x: xs[i],
      y: PAD_T + (n.string - 1) * STR_GAP,
      ghost: n.technique === 'ghost-note',
      label: n.technique === 'ghost-note' ? `(${n.fret})` : String(n.fret),
    })),
  }
}

function PatternSvg({ layout, ariaLabel }) {
  const { notes, width, height, hasBeats, maxBeat, unit } = layout
  const bottomY = PAD_T + 3 * STR_GAP
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ display: 'block', height: 'auto', maxWidth: width * 1.4 }}
      role="img"
      aria-label={ariaLabel}
    >
      {/* String lines — string 1 (G) on top, string 4 (low E) at the bottom. */}
      {STRINGS.map((s, i) => {
        const y = PAD_T + i * STR_GAP
        return (
          <g key={s.name}>
            <line
              x1={PAD_L - 6} y1={y} x2={width - PAD_R + 6} y2={y}
              stroke={STRING_LINE} strokeWidth={i === 3 ? 1.4 : 1}
            />
            <text x={7} y={y + 3} textAnchor="middle" fontSize={7} fill={STRING_LABEL}>
              {s.name}
            </text>
          </g>
        )
      })}

      {/* Beat numbers under the bottom string (only when beats are authored;
          x mirrors the note columns: beat 1 at PAD_L + 10, `unit` px per beat). */}
      {hasBeats &&
        Array.from({ length: Math.floor(maxBeat + 1e-6) }, (_, b) => (
          <text
            key={`b${b}`}
            x={PAD_L + b * unit + 10}
            y={bottomY + BEAT_ROW}
            textAnchor="middle" fontSize={6.5} fill={BEAT_LABEL}
          >
            {b + 1}
          </text>
        ))}

      {/* Technique marks (light lick vocabulary) above their notes. */}
      {notes.map((n, i) =>
        TECH_MARK[n.technique] ? (
          <text
            key={`t${i}`} x={n.x} y={n.y - 8} textAnchor="middle" fontSize={8}
            fontStyle="italic" fill={AMBER}
          >
            {TECH_MARK[n.technique]}
          </text>
        ) : null,
      )}

      {/* Fret numbers on surface pills; approach notes amber (next chord's). */}
      {notes.map((n, i) => {
        const w = n.label.length * 5.2 + 3
        const isLast = i === notes.length - 1
        return (
          <g key={`n${i}`}>
            <rect x={n.x - w / 2} y={n.y - 5.5} width={w} height={11} rx={2} fill={CARD_BG} />
            <text
              x={n.x} y={n.y + 3.2} textAnchor="middle" fontSize={9.5} fontWeight="600"
              fill={n.approach ? AMBER : n.ghost ? GHOST_TEXT : FRET_TEXT}
            >
              {n.label}
            </text>
            {/* The final approach points at the next chord. */}
            {n.approach && isLast && (
              <text x={n.x + w / 2 + 5} y={n.y + 3} textAnchor="middle" fontSize={8} fill={AMBER}>
                →
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── The card ─────────────────────────────────────────────────────────────────

// Same ▶ pill as VoicingBrowser's gallery cells (its PlayButton is file-local;
// classes mirrored so the two galleries read identically).
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

/**
 * <BassPatternCard rootPc quality nextRootPc pattern playLabel feel note chordLabel />
 *
 * Pure/presentational gallery cell for one station of one bass play. Renders
 * the realized 4-string tab + the authored per-station note + its own ▶.
 * Malformed/unplaceable patterns render an honest placeholder, never crash.
 */
export default function BassPatternCard({
  rootPc,
  quality,
  nextRootPc,
  pattern,
  playLabel,
  feel,
  note,
  chordLabel,
}) {
  const realized = realizeBassPattern(pattern, rootPc, quality, nextRootPc)

  // Unmount (loop/style/instrument change) silences any running sequence —
  // module-level state, so this is idempotent across sibling cards.
  useEffect(() => () => stopPattern(), [])

  if (!realized) {
    return (
      <div
        role="group"
        aria-label={`${playLabel ?? 'bass pattern'} — unavailable`}
        className="flex min-h-[72px] min-w-[140px] flex-col items-center justify-center rounded-md border border-dashed border-border p-2 text-gray-500"
      >
        <span className="text-lg leading-none" aria-hidden="true">—</span>
        <span className="mt-1 text-[10px]">pattern unavailable</span>
      </div>
    )
  }

  const layout = layoutPattern(realized)
  const pitchNames = realized.map((n) => absName(n.abs)).join(', ')
  const label = playLabel ?? 'Bass pattern'

  return (
    <figure className="flex w-[220px] min-w-0 shrink-0 flex-col gap-1.5 rounded-md border border-border bg-surface p-2">
      <figcaption
        className="text-[11px] font-medium leading-tight text-gray-300"
        title={feel ?? undefined}
      >
        {label}
      </figcaption>
      <div className="max-w-full overflow-x-auto">
        <PatternSvg
          layout={layout}
          ariaLabel={`Bass tab for ${chordLabel ?? 'this chord'} — ${label}: ${pitchNames}`}
        />
      </div>
      {note && <p className="text-[10px] leading-snug text-gray-500">{note}</p>}
      <PlayButton
        ariaLabel={`Play ${chordLabel ?? 'chord'} bass pattern — ${label}`}
        onClick={() => playPattern(realized)}
      />
    </figure>
  )
}
