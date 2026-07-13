// Compact SVG guitar chord-diagram. Renders the KB guitar shape format (D-01b).
// Secondary per-station voicing thumbnail in the Roadmap panel.
//
// Two shape forms (see src/data/kb/SCHEMA.md):
//   movable: { rootStr, offsets, fingers }
//     - offsets: 6 entries low-E→high-E, integers = fret offset from the barre
//       (base) fret, 'x' = muted. The base fret is derived from where the chord
//       root (rootPc) sits on rootStr in standard tuning.
//   open:    { frets, onlyRoot, fingers }
//     - frets: 6 entries low-E→high-E, 0 = open, 'x' = muted, integers = absolute.
//
// Props:
//   shape    — movable or open form above
//   keyRoot  — tonic pitch class 0–11 (accepted; see note below)
//   rootPc   — chord root pitch class 0–11 (drives movable placement)
//   size     — 'thumb' (compact ~64px grid) | 'full' (enlarged + finger #s + label)
//   label    — optional chord label shown under the grid
//
// Note on key-awareness: the SCHEMA derives the movable base fret from where the
// root note sits "for the current key". In practice the absolute fret depends only
// on the chord root pitch class on rootStr, which is supplied directly as `rootPc`.
// keyRoot is accepted for contract compatibility and used as a fallback for rootPc.

// Standard tuning open-string pitch classes, indexed low-E (0) → high-E (5).
const OPEN_PCS = [4, 9, 2, 7, 11, 4] // E A D G B E

// We render strings top→bottom as high-E first (matches Fretboard.jsx idiom),
// so display index 0 = high E, 5 = low E. Data arrays are low-E first, so the
// data index for display row `di` is `5 - di`.

const ACCENT = '#a855f7'   // chord-tone tier (root highlight)
const DOT = '#e5e7eb'      // non-root finger dots (light gray, AA on dark board)
const DOT_TEXT_DARK = '#1a1a1a'
const BOARD = '#1a120b'    // matches Fretboard board fill
const FRET_LINE = '#4a3a2a'
const NUT_COL = '#c0b090'
const STRING_COL = '#9ca3af'
const MUTE_OPEN = '#9ca3af'
const FRET_LABEL = '#9ca3af'

const NUM_STRINGS = 6
const NUM_FRETS = 5 // visible fret rows in the grid

// ── Fret resolution ──────────────────────────────────────────────────────────
// Returns { frets: number|'x' per display row (high-E first), baseFret, rootRow }
// where baseFret is the absolute fret of the top visible grid line (1 = nut shown).
function resolveShape(shape, rootPc, keyRoot) {
  if (!shape) return null

  // Open shape: absolute frets, low-E first.
  if (Array.isArray(shape.frets)) {
    const abs = shape.frets // low-E first
    const fretted = abs.filter(f => typeof f === 'number' && f > 0)
    const minFret = fretted.length ? Math.min(...fretted) : 0
    const maxFret = fretted.length ? Math.max(...fretted) : 0
    // Show the nut (baseFret 1) when the shape reaches up to fret ~4 from the nut.
    const baseFret = maxFret <= NUM_FRETS ? 1 : minFret
    return {
      open: true,
      absLowE: abs,
      baseFret,
      rootPc: typeof shape.onlyRoot === 'number' ? shape.onlyRoot : rootPc,
    }
  }

  // Movable shape: offsets relative to a base (barre) fret on rootStr.
  if (Array.isArray(shape.offsets)) {
    const rootStr = shape.rootStr // 6 = low E … 1 = high E
    const rootStrIdx = 6 - rootStr // → low-E-first array index
    const targetPc = typeof rootPc === 'number' ? rootPc
      : typeof keyRoot === 'number' ? keyRoot : 0
    const openPc = OPEN_PCS[rootStrIdx] ?? 4
    // Smallest fret >= 1 where the root pc lands on rootStr.
    let baseFret = ((targetPc - openPc) % 12 + 12) % 12
    if (baseFret === 0) baseFret = 12 // root at open string → use the octave barre
    return {
      open: false,
      offsets: shape.offsets, // low-E first
      baseFret,
      rootStrIdx,
      rootPc: targetPc,
    }
  }

  return null
}

// Build per-display-row absolute fret + root flag from a resolved shape.
// Returns null if the shape cannot be placed gracefully (root above ~fret 12).
function buildRows(resolved) {
  if (!resolved) return null

  // Absolute fret per low-E-first data index.
  let absLowE
  if (resolved.open) {
    absLowE = resolved.absLowE
  } else {
    absLowE = resolved.offsets.map(o =>
      o === 'x' || o == null ? 'x' : resolved.baseFret + o
    )
  }

  // Highest fretted note — degrade if unplayably high.
  const fretted = absLowE.filter(f => typeof f === 'number' && f > 0)
  const maxFret = fretted.length ? Math.max(...fretted) : 0
  if (maxFret > 15) return null

  // Window: lowest visible fret of the grid.
  // Show the nut if everything fits within NUM_FRETS of it; else start at the
  // lowest fretted note so the grip sits at the top of the window.
  const minFret = fretted.length ? Math.min(...fretted) : 0
  const startFret = maxFret <= NUM_FRETS ? 1 : minFret

  // Root pitch class for colouring.
  const rootPc = resolved.rootPc

  // Convert to display rows (high-E first → reverse of low-E-first).
  const rows = []
  for (let di = 0; di < NUM_STRINGS; di++) {
    const dataIdx = NUM_STRINGS - 1 - di
    const f = absLowE[dataIdx]
    const stringPc = (OPEN_PCS[dataIdx] + (typeof f === 'number' ? f : 0)) % 12
    const isRoot = typeof f === 'number' && f >= 0 && stringPc === rootPc
    rows.push({ fret: f, isRoot, stringPc })
  }

  return { rows, startFret, showNut: startFret === 1 }
}

export default function ChordDiagram({
  shape,
  keyRoot,
  rootPc,
  size = 'thumb',
  label,
}) {
  const resolved = resolveShape(shape, rootPc, keyRoot)
  const built = buildRows(resolved)

  const full = size === 'full'

  // Geometry. thumb grid ~64px wide; full ~2x.
  const scale = full ? 2 : 1
  const cell = 11 * scale          // px per fret row (vertical)
  const sw = 11 * scale            // px per string gap (horizontal)
  const padL = 14 * scale          // left pad (mute/open markers + start-fret label)
  const padR = 6 * scale
  const padT = 11 * scale          // top pad (mute/open marker row)
  const padB = (full ? 16 : 6) * scale // bottom pad (finger numbers / breathing room)

  const gridW = (NUM_STRINGS - 1) * sw
  const gridH = NUM_FRETS * cell
  const svgW = padL + gridW + padR
  const svgH = padT + gridH + padB

  const stringX = si => padL + si * sw        // si: 0 = high E (left) … 5 = low E
  const fretY = fi => padT + fi * cell         // fi: 0 = top line … NUM_FRETS

  if (!built) {
    // Graceful degradation: shape can't be placed.
    return (
      <div
        className="inline-flex flex-col items-center justify-center bg-panel border border-border rounded-lg text-gray-500"
        style={{ width: svgW, minHeight: svgH }}
        role="img"
        aria-label={label ? `${label}: voicing unavailable` : 'voicing unavailable'}
      >
        <span style={{ fontSize: 9 * scale }}>—</span>
        {label && full && <span style={{ fontSize: 8 * scale }} className="mt-1">{label}</span>}
      </div>
    )
  }

  const { rows, startFret, showNut } = built

  const fingers = shape?.fingers // low-E first, optional

  const ariaLabel = label
    ? `${label} guitar chord diagram`
    : 'guitar chord diagram'

  return (
    <div className="inline-flex flex-col items-center" role="img" aria-label={ariaLabel}>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ display: 'block' }}
      >
        {/* Board background */}
        <rect
          x={padL - 1}
          y={padT - 1}
          width={gridW + 2}
          height={gridH + 2}
          fill={BOARD}
          rx={2 * scale}
        />

        {/* Start-fret indicator ("5fr") when the grid begins above the nut */}
        {!showNut && (
          <text
            x={padL - 4 * scale}
            y={fretY(0) + cell * 0.62}
            textAnchor="end"
            fontSize={7 * scale}
            fill={FRET_LABEL}
          >
            {startFret}fr
          </text>
        )}

        {/* Frets (horizontal lines) */}
        {Array.from({ length: NUM_FRETS + 1 }, (_, fi) => fi).map(fi => {
          const topNut = showNut && fi === 0
          return (
            <line
              key={fi}
              x1={stringX(0)}
              y1={fretY(fi)}
              x2={stringX(NUM_STRINGS - 1)}
              y2={fretY(fi)}
              stroke={topNut ? NUT_COL : FRET_LINE}
              strokeWidth={topNut ? 3 * scale : 1 * scale}
            />
          )
        })}

        {/* Strings (vertical lines) */}
        {rows.map((_, si) => (
          <line
            key={si}
            x1={stringX(si)}
            y1={fretY(0)}
            x2={stringX(si)}
            y2={fretY(NUM_FRETS)}
            stroke={STRING_COL}
            strokeWidth={(si >= 4 ? 1.4 : si >= 2 ? 1.1 : 0.8) * scale}
          />
        ))}

        {/* Per-string markers: mute ✕ / open ○ above the nut, dots on the grid */}
        {rows.map((row, si) => {
          const x = stringX(si)
          const dataIdx = NUM_STRINGS - 1 - si
          const finger = fingers ? fingers[dataIdx] : 0

          // Muted string → ✕ above the board.
          if (row.fret === 'x' || row.fret == null) {
            const my = padT - 4 * scale
            const r = 3 * scale
            return (
              <g key={si} stroke={MUTE_OPEN} strokeWidth={1 * scale} strokeLinecap="round">
                <line x1={x - r} y1={my - r} x2={x + r} y2={my + r} />
                <line x1={x - r} y1={my + r} x2={x + r} y2={my - r} />
              </g>
            )
          }

          // Open string (absolute fret 0, only meaningful when nut is shown) → ○.
          if (row.fret === 0) {
            return (
              <circle
                key={si}
                cx={x}
                cy={padT - 4 * scale}
                r={3 * scale}
                fill="none"
                stroke={MUTE_OPEN}
                strokeWidth={1 * scale}
              />
            )
          }

          // Fretted note → dot, positioned in its fret row within the window.
          const rowInWindow = row.fret - startFret // 0-based row from top
          if (rowInWindow < 0 || rowInWindow >= NUM_FRETS) return null
          const cy = fretY(rowInWindow) + cell / 2
          const r = (full ? 4 : 3.5) * scale
          const fill = row.isRoot ? ACCENT : DOT
          const showFinger = full && finger > 0
          return (
            <g key={si}>
              <circle cx={x} cy={cy} r={r} fill={fill} />
              {showFinger && (
                <text
                  x={x}
                  y={cy + 3 * scale}
                  textAnchor="middle"
                  fontSize={7 * scale}
                  fontWeight="700"
                  fill={row.isRoot ? '#fff' : DOT_TEXT_DARK}
                >
                  {finger}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {label && (
        <span
          className="text-gray-300 leading-none mt-1"
          style={{ fontSize: full ? 12 : 9 }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
