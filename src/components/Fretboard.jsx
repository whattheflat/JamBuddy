import { getPentatonicScale, getFullScale, getChordTones, guideTones, NOTES } from '../lib/theory'

// Standard tuning: pitch classes of open strings, high-E first (top of diagram)
const STRINGS = [
  { label: 'e', root: 4 },   // high E
  { label: 'B', root: 11 },
  { label: 'G', root: 7 },
  { label: 'D', root: 2 },
  { label: 'A', root: 9 },
  { label: 'E', root: 4 },   // low E
]

const NUM_FRETS = 13          // frets 0 (open) through 12
const FRET_MARKERS = [3, 5, 7, 9]
const DOUBLE_MARKER = 12

// Layout constants
const NUT_X = 40             // x of the nut line
const OPEN_X = 18            // x of open-string dot centres
const FRET_W = 52            // pixels per fret
const STRING_H = 28          // pixels between strings
const PAD_T = 28             // top padding (fret numbers)
const PAD_B = 18             // bottom padding (fret marker dots)
const BOARD_W = NUT_X + (NUM_FRETS - 1) * FRET_W + 10
const BOARD_H = PAD_T + 5 * STRING_H + PAD_B
const DOT_R = 10

// x centre of a fretted note (fret >= 1)
const fretX = f => NUT_X + (f - 0.5) * FRET_W
// y centre of string si (0 = high e, 5 = low E)
const stringY = si => PAD_T + si * STRING_H

function noteColor(isChordTone, isPenta, isScale, mono = false) {
  if (isChordTone) return { fill: '#a855f7', text: '#fff' }
  if (isPenta)     return mono ? { fill: '#c084fc', text: '#1e1b4b' } : { fill: '#f59e0b', text: '#000' }
  if (isScale)     return mono ? { fill: '#e9d5ff', text: '#581c87' } : { fill: '#374151', text: '#d1d5db' }
  return null
}

// `compact` (task L-50, one-screen.md §2): trimmed card chrome (p-3, legend
// merged onto the heading line) + a natural-width cap on the SVG (max-width =
// its viewBox width, so it never renders above scale 1.0). No fret reduction,
// no transform scaling — the notes stay at their designed size.
export default function Fretboard({ keyInfo, currentChord, pentatonicOnly = false, monoColor = false, jamFocusChord = null, compact = false }) {
  const { root, mode } = keyInfo ?? {}

  if (!root) return null

  const pentaSet = new Set(getPentatonicScale(root, mode).map(n => NOTES.indexOf(n)))
  const scaleSet = pentatonicOnly
    ? pentaSet
    : new Set(getFullScale(root, mode).map(n => NOTES.indexOf(n)))
  const chordSet = currentChord
    ? new Set(getChordTones(currentChord).map(n => NOTES.indexOf(n)))
    : new Set()

  // ── Jam Guide focus: guide tones of the tapped Roadmap station ──────────────
  // `guideTones` returns { third, seventh, hasSeventh }. We emphasise the 3rd
  // (the quality-defining tone) and the secondary anchor — the 7th when present,
  // else the 5th for a triad (hasSeventh:false). These pitch classes get a halo
  // ring + a small tag so they read as a distinct "target" tier on top of the
  // normal chord/penta/scale colouring.
  let focusThird = -1, focusSeventh = -1, focusRootPc = 0
  if (jamFocusChord && typeof jamFocusChord.rootPc === 'number') {
    const gt = guideTones(jamFocusChord.rootPc, jamFocusChord.quality)
    focusThird = gt.third
    focusSeventh = gt.seventh
    focusRootPc = gt.root
  }
  const hasFocus = focusThird >= 0
  // Defense-in-depth: label the secondary anchor from its ACTUAL interval above
  // the chord root, so a wrong `hasSeventh` boolean could never mislabel a 5th
  // or 6th as a "7". 10/11 → "7", 9 → "6", 8 → "♭6"(#5), 7 → "5", 6 → "♭5".
  const focusSeventhLabel = (() => {
    const iv = ((focusSeventh - focusRootPc) % 12 + 12) % 12
    if (iv === 10 || iv === 11) return '7'
    if (iv === 9) return '6'
    if (iv === 8) return '♭6'
    if (iv === 6) return '♭5'
    return '5'
  })()
  const focusLabel = pc =>
    pc === focusThird ? '3' : pc === focusSeventh ? focusSeventhLabel : null

  const heading = (
    <p className={`text-sm text-gray-500 uppercase tracking-widest ${compact ? '' : 'mb-4'}`}>
      Fretboard — {root} {mode}
      {currentChord && <span className="text-amber-400 ml-2">/ {currentChord}</span>}
      {hasFocus && <span className="text-accent ml-2">◎ guide tones</span>}
    </p>
  )

  const legend = (
    // Critic mechanical fix (L-50 gate): non-compact keeps HEAD's exact class
    // string so the non-compact render stays byte-identical to the committed one.
    <div className={compact ? 'flex flex-wrap items-center text-xs text-gray-500 gap-3' : 'mt-3 flex flex-wrap gap-5 text-xs text-gray-500'}>
      <span><span className="text-accent">●</span> Chord tone</span>
      <span style={{ color: monoColor ? '#c084fc' : '#f59e0b' }}>●</span><span> Pentatonic</span>
      <span style={{ color: monoColor ? '#e9d5ff' : '#6b7280' }}>●</span><span> Scale</span>
      {hasFocus && (
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-accent"
          />
          Guide tones (3 / {focusSeventhLabel})
        </span>
      )}
    </div>
  )

  return (
    <div className={`bg-panel border border-border rounded-2xl ${compact ? 'p-3' : 'p-6'}`}>
      {compact ? (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          {heading}
          {legend}
        </div>
      ) : (
        heading
      )}

      <div>
        <svg
          viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
          width="100%"
          height="auto"
          style={{ display: 'block', ...(compact ? { maxWidth: BOARD_W } : null) }}
        >
          {/* Fretboard background */}
          <rect x={NUT_X} y={PAD_T - 6} width={BOARD_W - NUT_X - 4} height={5 * STRING_H + 12}
            fill="#1a120b" rx={2} />

          {/* Fret position marker dots (between strings 2–3 and 3–4) */}
          {FRET_MARKERS.map(f => (
            <circle key={f}
              cx={fretX(f)} cy={PAD_T + 2.5 * STRING_H}
              r={5} fill="#3a2a1a" />
          ))}
          {/* Double dot at 12 */}
          <circle cx={fretX(DOUBLE_MARKER)} cy={PAD_T + 1.5 * STRING_H} r={5} fill="#3a2a1a" />
          <circle cx={fretX(DOUBLE_MARKER)} cy={PAD_T + 3.5 * STRING_H} r={5} fill="#3a2a1a" />

          {/* Fret lines (1–12) */}
          {Array.from({ length: NUM_FRETS - 1 }, (_, i) => i + 1).map(f => (
            <line key={f}
              x1={NUT_X + f * FRET_W} y1={PAD_T - 6}
              x2={NUT_X + f * FRET_W} y2={PAD_T + 5 * STRING_H + 6}
              stroke={f === DOUBLE_MARKER ? '#888' : '#4a3a2a'}
              strokeWidth={f === DOUBLE_MARKER ? 2 : 1} />
          ))}

          {/* Nut */}
          <line x1={NUT_X} y1={PAD_T - 6} x2={NUT_X} y2={PAD_T + 5 * STRING_H + 6}
            stroke="#c0b090" strokeWidth={4} />

          {/* Strings */}
          {STRINGS.map((_, si) => (
            <line key={si}
              x1={OPEN_X - DOT_R - 2} y1={stringY(si)}
              x2={BOARD_W - 8} y2={stringY(si)}
              stroke="#9ca3af"
              strokeWidth={si < 2 ? 1 : si < 4 ? 1.5 : 2} />
          ))}

          {/* Fret numbers */}
          {[3, 5, 7, 9, 12].map(f => (
            <text key={f}
              x={fretX(f)} y={PAD_T - 10}
              textAnchor="middle" fontSize={10} fill="#6b7280"
            >{f}</text>
          ))}

          {/* String labels */}
          {STRINGS.map((s, si) => (
            <text key={si}
              x={6} y={stringY(si) + 4}
              textAnchor="middle" fontSize={10} fill="#6b7280"
            >{s.label}</text>
          ))}

          {/* Note dots */}
          {STRINGS.flatMap((str, si) =>
            Array.from({ length: NUM_FRETS }, (_, fi) => {
              const pc = (str.root + fi) % 12
              const color = noteColor(chordSet.has(pc), pentaSet.has(pc), scaleSet.has(pc), monoColor)
              const tag = hasFocus ? focusLabel(pc) : null
              // A guide tone outside the current scale still gets emphasised:
              // draw a faint base dot so the halo has something to sit on.
              if (!color && !tag) return null

              const cx = fi === 0 ? OPEN_X : fretX(fi)
              const cy = stringY(si)
              const baseFill = color ? color.fill : '#2a2a2a'
              const baseText = color ? color.text : '#a855f7'

              return (
                <g key={`${si}-${fi}`}>
                  {/* Guide-tone halo: a purple ring around the dot, clearly
                      distinct from the solid chord-tone fill (a "target" marker). */}
                  {tag && (
                    <circle
                      cx={cx} cy={cy} r={DOT_R + 3}
                      fill="none" stroke="#a855f7" strokeWidth={2.5}
                    />
                  )}
                  <circle cx={cx} cy={cy} r={DOT_R} fill={baseFill} />
                  <text
                    x={cx} y={cy + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="600"
                    fill={baseText}
                  >
                    {NOTES[pc]}
                  </text>
                  {/* Degree badge (3 / 7 / 5) on the halo's upper-right. */}
                  {tag && (
                    <>
                      <circle cx={cx + DOT_R} cy={cy - DOT_R} r={6} fill="#a855f7" />
                      <text
                        x={cx + DOT_R} y={cy - DOT_R + 3}
                        textAnchor="middle"
                        fontSize={8}
                        fontWeight="700"
                        fill="#fff"
                      >
                        {tag}
                      </text>
                    </>
                  )}
                </g>
              )
            })
          )}
        </svg>
      </div>

      {!compact && legend}
    </div>
  )
}
