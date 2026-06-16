// Mini piano keyboard.
//
// TWO render modes, chosen by props (additive — legacy path is the default):
//
//  1. LEGACY  <MiniPiano rootPc={..} lh={[..]} rh={[..]} />
//     Used by ChordDetailModal + ExplorePanel. `lh`/`rh` are semitone intervals
//     ABOVE the root (left hand shown blue, right hand shown purple), spanning a
//     2-octave keyboard. Behaviour here is UNCHANGED — byte-for-byte the same
//     output the existing consumers have always rendered.
//
//  2. VOICING  <MiniPiano voicing={pianoVoicing(...)} size="thumb|full" />
//     Renders the output of src/lib/piano.js `pianoVoicing({rootPc,quality},opts)`:
//       voicing.notes — ABSOLUTE semitone key positions, 0 = C of the low octave,
//                        range [0,36]. A note value `n` maps to the key `n`
//                        semitones above the low C (octave = ⌊n/12⌋, pc = n%12).
//       voicing.pcs   — pitch classes sounding.
//       voicing.bass  — lowest absolute note (the LH anchor) — marked distinctly.
//       voicing.style / voicing.label — captions (shown in `full` size).
//     The root pitch class lights in accent purple; the bass key is ringed as the
//     LH anchor; the other voicing tones light in a lighter purple.
//
// Design tokens (tailwind.config.js): accent #a855f7. The SVG also uses the
// established Piano/Fretboard note language (accent purple for the focal tone).

const WW = 22    // white key width
const WH = 60    // white key height
const BW = 14    // black key width
const BH = 38    // black key height

// White key pitch classes within an octave, in order
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11]  // C D E F G A B
const WHITE_NAMES = ['C','D','E','F','G','A','B']
// Black key offsets (x position relative to white key 0) and pitch classes
const BLACK_OFFSETS = [
  { pc: 1,  afterWhite: 0 },  // C#
  { pc: 3,  afterWhite: 1 },  // D#
  { pc: 6,  afterWhite: 3 },  // F#
  { pc: 8,  afterWhite: 4 },  // G#
  { pc: 10, afterWhite: 5 },  // A#
]

// ─── Design tokens (literal — SVG fills can't read Tailwind classes) ───────────
const ACCENT      = '#a855f7'   // text-accent — root pitch class (focal tone)
const ACCENT_SOFT = '#c084fc'   // lighter accent — non-root voicing tones
const LH_BLUE     = '#3b82f6'   // legacy left-hand colour (unchanged)
const WHITE_FILL  = '#f5f5f5'
const BLACK_FILL  = '#1f2937'
const WHITE_STROKE = '#374151'
const BLACK_STROKE = '#111827'
const BASS_RING   = '#fbbf24'   // amber ring marking the LH bass anchor (AA on keys)

function legacyNoteColor(hand) {
  return hand === 'L' ? LH_BLUE : ACCENT
}

function handLabel(hand) {
  return hand === 'L' ? 'LH' : 'RH'
}

// ════════════════════════════════════════════════════════════════════════════
// LEGACY render path — {rootPc, lh, rh}. UNCHANGED from the original component.
// ════════════════════════════════════════════════════════════════════════════
function LegacyPiano({ rootPc, lh = [], rh = [] }) {
  const OCTAVES = 2
  const TOTAL_WHITES = WHITE_PCS.length * OCTAVES  // 14
  const SVG_W = WW * TOTAL_WHITES + 2
  const SVG_H = WH + 24

  // Build a set of highlighted notes: pc → { hand, interval }
  // We span 2 octaves (semitones 0…23 above root), mapped to absolute pitch classes
  const highlights = new Map()  // absIdx → { color, label }

  function addNotes(intervals, hand) {
    for (const iv of intervals) {
      const octave = Math.floor(iv / 12)
      const pc = (rootPc + iv) % 12
      highlights.set(`${octave}-${pc}`, { color: legacyNoteColor(hand), label: handLabel(hand) })
    }
  }
  addNotes(lh, 'L')
  addNotes(rh, 'R')

  function isHighlighted(octave, pc) {
    return highlights.get(`${octave}-${pc}`)
  }

  // White keys
  const whites = []
  for (let oct = 0; oct < OCTAVES; oct++) {
    for (let wi = 0; wi < WHITE_PCS.length; wi++) {
      const pc = WHITE_PCS[wi]
      const absWi = oct * WHITE_PCS.length + wi
      const x = absWi * WW + 1
      const hl = isHighlighted(oct, pc)
      whites.push({ x, pc, oct, wi, absWi, hl, name: WHITE_NAMES[wi] + (oct + 4) })
    }
  }

  // Black keys
  const blacks = []
  for (let oct = 0; oct < OCTAVES; oct++) {
    for (const { pc, afterWhite } of BLACK_OFFSETS) {
      const absWi = oct * WHITE_PCS.length + afterWhite
      const x = absWi * WW + WW - BW / 2
      const hl = isHighlighted(oct, pc)
      blacks.push({ x, pc, oct, hl })
    }
  }

  return (
    <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="overflow-visible">
      {/* White keys */}
      {whites.map(({ x, hl, name, absWi }) => (
        <g key={`w${absWi}`}>
          <rect
            x={x} y={1} width={WW - 1} height={WH}
            rx={2}
            fill={hl ? hl.color : WHITE_FILL}
            stroke={WHITE_STROKE}
            strokeWidth={0.5}
          />
          {hl && (
            <text x={x + (WW - 1) / 2} y={WH - 8}
              textAnchor="middle" fill="white" fontSize={7} fontWeight="bold">
              {hl.label}
            </text>
          )}
        </g>
      ))}

      {/* Black keys */}
      {blacks.map(({ x, pc, oct, hl }, i) => (
        <g key={`b${oct}-${pc}`}>
          <rect
            x={x} y={1} width={BW} height={BH}
            rx={2}
            fill={hl ? hl.color : BLACK_FILL}
            stroke={BLACK_STROKE}
            strokeWidth={0.5}
          />
          {hl && (
            <text x={x + BW / 2} y={BH - 5}
              textAnchor="middle" fill="white" fontSize={6} fontWeight="bold">
              {hl.label}
            </text>
          )}
        </g>
      ))}

      {/* Root label at bottom */}
      {whites.map(({ x, pc, oct, name, absWi }) => {
        const isRoot = pc === rootPc && oct === 0
        if (!isRoot) return null
        return (
          <text key={`lbl${absWi}`} x={x + (WW - 1) / 2} y={WH + 14}
            textAnchor="middle" fill={ACCENT} fontSize={8} fontWeight="bold">
            R
          </text>
        )
      })}
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// VOICING render path — renders a pianoVoicing({notes,pcs,bass,style,label}).
// `notes` are absolute semitone positions, 0 = C of the low octave, range [0,36].
// ════════════════════════════════════════════════════════════════════════════
function VoicingPiano({ voicing, size }) {
  const isFull = size === 'full'
  const notes = Array.isArray(voicing?.notes) ? voicing.notes : []
  const rootPc = ((voicing?.rootPc ?? (notes.length ? notes[0] : 0)) % 12 + 12) % 12
  const bass = typeof voicing?.bass === 'number' ? voicing.bass : (notes.length ? Math.min(...notes) : null)

  // Span enough octaves to contain the highest note (notes ≤ 36 → 3 octaves + the
  // closing high C, so a value of 36 lands on the last white key).
  const maxNote = notes.length ? Math.max(...notes) : 0
  const OCTAVES = Math.min(3, Math.max(2, Math.ceil((maxNote + 1) / 12)))
  // White keys: OCTAVES full octaves + 1 trailing C so the top octave's C (e.g. 36) shows.
  const TOTAL_WHITES = WHITE_PCS.length * OCTAVES + 1
  const scale = isFull ? 1 : 0.8
  const baseW = WW * TOTAL_WHITES + 2
  const SVG_W = baseW * scale
  const SVG_H = (WH + (isFull ? 26 : 4)) * scale

  // A highlighted absolute note → its render style. Keyed by absolute note value.
  const noteSet = new Set(notes)
  function styleFor(absNote) {
    if (!noteSet.has(absNote)) return null
    const pc = ((absNote % 12) + 12) % 12
    return {
      isRoot: pc === rootPc,
      isBass: absNote === bass,
      color: pc === rootPc ? ACCENT : ACCENT_SOFT,
    }
  }

  // White keys across OCTAVES octaves + trailing C.
  const whites = []
  for (let oct = 0; oct < OCTAVES; oct++) {
    for (let wi = 0; wi < WHITE_PCS.length; wi++) {
      const pc = WHITE_PCS[wi]
      const absWi = oct * WHITE_PCS.length + wi
      const absNote = oct * 12 + pc       // absolute semitone of this white key
      const x = absWi * WW + 1
      whites.push({ x, absWi, absNote, hl: styleFor(absNote) })
    }
  }
  // Trailing high C (top of the renderable window, e.g. note 36 when OCTAVES=3).
  {
    const absWi = OCTAVES * WHITE_PCS.length
    const absNote = OCTAVES * 12
    whites.push({ x: absWi * WW + 1, absWi, absNote, hl: styleFor(absNote) })
  }

  // Black keys across OCTAVES octaves.
  const blacks = []
  for (let oct = 0; oct < OCTAVES; oct++) {
    for (const { pc, afterWhite } of BLACK_OFFSETS) {
      const absWi = oct * WHITE_PCS.length + afterWhite
      const absNote = oct * 12 + pc
      const x = absWi * WW + WW - BW / 2
      blacks.push({ x, pc, oct, absNote, hl: styleFor(absNote) })
    }
  }

  const ariaLabel = `Piano voicing${voicing?.label ? `: ${voicing.label}` : ''}`

  return (
    <svg
      width={SVG_W} height={SVG_H} viewBox={`0 0 ${baseW} ${WH + (isFull ? 26 : 4)}`}
      className="overflow-visible" role="img" aria-label={ariaLabel}
    >
      {/* White keys */}
      {whites.map(({ x, hl, absWi }) => (
        <g key={`w${absWi}`}>
          <rect
            x={x} y={1} width={WW - 1} height={WH}
            rx={2}
            fill={hl ? hl.color : WHITE_FILL}
            stroke={WHITE_STROKE}
            strokeWidth={0.5}
          />
          {hl?.isBass && (
            <rect
              x={x + 1} y={2} width={WW - 3} height={WH - 2}
              rx={2} fill="none" stroke={BASS_RING} strokeWidth={2}
            />
          )}
          {hl?.isRoot && (
            <text x={x + (WW - 1) / 2} y={WH - 8}
              textAnchor="middle" fill="white" fontSize={8} fontWeight="bold">
              R
            </text>
          )}
        </g>
      ))}

      {/* Black keys */}
      {blacks.map(({ x, pc, oct, hl }) => (
        <g key={`b${oct}-${pc}`}>
          <rect
            x={x} y={1} width={BW} height={BH}
            rx={2}
            fill={hl ? hl.color : BLACK_FILL}
            stroke={BLACK_STROKE}
            strokeWidth={0.5}
          />
          {hl?.isBass && (
            <rect
              x={x + 1} y={2} width={BW - 2} height={BH - 2}
              rx={2} fill="none" stroke={BASS_RING} strokeWidth={2}
            />
          )}
          {hl?.isRoot && (
            <text x={x + BW / 2} y={BH - 5}
              textAnchor="middle" fill="white" fontSize={6} fontWeight="bold">
              R
            </text>
          )}
        </g>
      ))}

      {/* Caption (full size only): label + style */}
      {isFull && voicing?.label && (
        <text x={baseW / 2} y={WH + 20}
          textAnchor="middle" fill={ACCENT} fontSize={9} fontWeight="bold">
          {voicing.label}
        </text>
      )}
    </svg>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// Public component — dispatches on whether `voicing` is supplied (additive).
// ════════════════════════════════════════════════════════════════════════════
export default function MiniPiano({ rootPc, lh = [], rh = [], voicing, size = 'thumb' }) {
  if (voicing) {
    return <VoicingPiano voicing={voicing} size={size} />
  }
  return <LegacyPiano rootPc={rootPc} lh={lh} rh={rh} />
}
