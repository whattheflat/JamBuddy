import { NOTES, CHORD_TYPES, guideTones, voiceLeadingPairs, soloScale } from '../lib/theory'

// ─── RoadmapTrack (D-01) ──────────────────────────────────────────────────────
//
// The heart of the "Roadmap" Jam Guide concept (docs/design/jam-guide-concept-c.md):
// the live loop rendered as a horizontal improv highway. Each KB progression
// station carries a chord name + Roman numeral + solo-scale label, a guide-tone
// lane (3rd/7th dots), and voice-leading rails drawn *between* adjacent stations
// (the 7→3 falls-a-half-step thread). A playhead + beat grid sit underneath; the
// station at `position` is "now", the next gets a subtle lookahead glow.
//
// Pure / presentational: no audio, no data fetching. Everything derives from
// props + theory.js. Default-exported. Luthier (D-02) wires it into JamGuide.jsx.
//
// Prop contract (honoured exactly — other agents build against it):
//   progression  KB progression object { id, name, rn, degrees, qualities, bars, mode, ... }
//   keyRoot      tonic pitch class 0–11
//   keyMode      'major' | 'minor'
//   position     index of the current station (playhead); -1 if none
//   bpm          optional, for the beat grid; tolerate undefined

// Pitch class → note name. Sharps via NOTES (the app's canonical spelling, and
// what Fretboard.jsx uses); kept to one source so the roadmap matches the neck.
const pcName = pc => NOTES[((pc % 12) + 12) % 12]

// Build the full display chord name from a pitch class + a CHORD_TYPES quality
// key (e.g. 7 + 'dom7' → "G7", 2 + 'min7' → "Dm7"). Falls back to a bare major
// triad spelling if the quality is unknown, so the panel never renders blank.
const chordName = (rootPc, quality) =>
  pcName(rootPc) + (CHORD_TYPES[quality]?.suffix ?? '')

// A readable mode word for the SCALE lane: theory.js returns snake_case names
// ('phrygian_dominant'); the design wants "G mixolydian".
const prettyScale = (rootPc, quality, keyMode) => {
  const { name } = soloScale(quality, keyMode)
  return `${pcName(rootPc)} ${name.replace(/_/g, ' ')}`
}

// ─── Layout constants (px in the SVG-free flex layout) ────────────────────────
const STATION_MIN_W = 168   // each station's min width; loops longer than the
                            // viewport scroll horizontally (12-bar blues etc.)
const RAIL_W        = 34    // width of the gap a voice-leading rail bridges
const RAIL_H        = 40    // rail SVG height

// Render the small arrow rail between two stations. `pair` is one entry from
// voiceLeadingPairs: { from, to, semitones }. We emphasise the half-step motion
// — a 0-semitone move is a held common tone ("holds"), ±1 a half-step, ±2 a
// whole step. Drawn in accent purple to match the guide-tone dots it connects.
function Rail({ pair }) {
  if (!pair) return null
  const { from, to, semitones } = pair
  const held = semitones === 0
  const dir  = semitones < 0 ? 'down' : semitones > 0 ? 'up' : 'hold'
  const label = held
    ? `${pcName(from)} holds`
    : `${pcName(from)}→${pcName(to)}`   // C→B
  const motion = held
    ? 'common tone'
    : `${Math.abs(semitones) === 1 ? '½' : Math.abs(semitones)} step ${dir === 'down' ? 'down' : 'up'}`

  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center select-none"
      style={{ width: RAIL_W }}
      aria-hidden="true"
    >
      <svg width={RAIL_W} height={RAIL_H} viewBox={`0 0 ${RAIL_W} ${RAIL_H}`}>
        {/* the rail line */}
        <line
          x1={2} y1={RAIL_H / 2} x2={RAIL_W - 8} y2={RAIL_H / 2}
          stroke="#a855f7" strokeWidth={held ? 1.5 : 2}
          strokeDasharray={held ? '3 3' : undefined}
        />
        {/* arrowhead (omitted for a held common tone) */}
        {!held && (
          <path
            d={`M ${RAIL_W - 8} ${RAIL_H / 2 - 4} L ${RAIL_W - 2} ${RAIL_H / 2} L ${RAIL_W - 8} ${RAIL_H / 2 + 4} Z`}
            fill="#a855f7"
          />
        )}
      </svg>
      <span className="mt-0.5 text-[10px] font-semibold leading-none text-accent">{label}</span>
      <span className="text-[9px] leading-tight text-gray-400">{motion}</span>
    </div>
  )
}

// A single guide-tone dot with its honest label. `kind` is '3rd' / '7th' / '5th'.
function GuideDot({ pc, kind, filled }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
        style={
          filled
            ? { backgroundColor: '#a855f7', color: '#fff' }                       // 3rd: solid accent
            : { border: '2px solid #a855f7', color: '#d8b4fe' }                   // 7th: hollow accent
        }
      >
        {pcName(pc)}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-wide text-gray-400">{kind}</span>
    </div>
  )
}

// A single station on the highway.
function Station({
  index, rootPc, quality, rn, scaleLabel, isNow, isNext, width,
}) {
  const g = guideTones(rootPc, quality)
  // hasSeventh:false → label the fallback honestly ("5th"), never call a 5th a 7th.
  const seventhKind = g.hasSeventh ? '7th' : '5th'

  // Tier the dimming exactly like ProgressionBanner: "now" is full accent, the
  // lookahead "next" is a softer glow, everything else recedes — but never below
  // a legibility floor (AA contrast on bg-panel).
  const stateClass = isNow
    ? 'border-accent bg-accent/10 ring-2 ring-accent'
    : isNext
      ? 'border-accent/50 bg-accent/5'
      : 'border-border bg-surface'
  const opacity = isNow ? 1 : isNext ? 0.92 : 0.7

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-current={isNow ? 'true' : undefined}
      aria-label={
        `Station ${index + 1}: ${chordName(rootPc, quality)}, ${rn}, ` +
        `solo scale ${scaleLabel}, third ${pcName(g.third)}, ` +
        `${seventhKind} ${pcName(g.seventh)}${isNow ? ', now playing' : ''}${isNext ? ', up next' : ''}`
      }
      className={
        `flex shrink-0 flex-col gap-2 rounded-xl border p-3 outline-none transition ` +
        `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ` +
        `focus-visible:ring-offset-surface ${stateClass}`
      }
      style={{ minWidth: width, opacity }}
    >
      {/* Header: chord name + Roman numeral, with the lookahead flag */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold leading-none text-gray-100">
            {chordName(rootPc, quality)}
          </span>
          <span className="text-xs font-medium text-gray-400">{rn}</span>
        </div>
        {isNow && (
          <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            now
          </span>
        )}
        {isNext && (
          <span className="rounded border border-accent/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent">
            next
          </span>
        )}
      </div>

      {/* SCALE lane: the scale to blow over (muted, per the design) */}
      <div className="text-xs text-gray-400">
        <span className="text-[9px] uppercase tracking-widest text-gray-500">solo&nbsp;</span>
        {scaleLabel}
      </div>

      {/* TARGET lane: the 3rd & 7th guide-tone dots */}
      <div className="mt-1 flex items-start gap-4 border-t border-border pt-2">
        <span className="mt-1 text-[9px] uppercase tracking-widest text-gray-500">aim</span>
        <GuideDot pc={g.third} kind="3rd" filled />
        <GuideDot pc={g.seventh} kind={seventhKind} filled={false} />
      </div>
    </div>
  )
}

// The playhead + beat grid under the whole track. Total beats = Σ bars × 4.
// The current beat is the start of the active station (coarse, chord-accurate —
// matches ProgressionBanner; fine beat interpolation is a later D-02 polish).
function BeatGrid({ bars, position, bpm }) {
  const beatsPerStation = bars.map(b => (b || 1) * 4)
  const totalBeats = beatsPerStation.reduce((s, n) => s + n, 0)
  // first beat index of each station
  const stationStart = []
  let acc = 0
  for (const n of beatsPerStation) { stationStart.push(acc); acc += n }
  const nowBeat = position >= 0 && position < stationStart.length ? stationStart[position] : -1
  const pct = nowBeat >= 0 && totalBeats > 0 ? (nowBeat + 0.5) / totalBeats : 0

  return (
    <div className="mt-3">
      {/* playhead track */}
      <div
        className="relative h-1.5 w-full rounded-full bg-border"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalBeats}
        aria-valuenow={Math.max(0, nowBeat)}
        aria-valuetext={
          nowBeat >= 0 ? `Beat ${nowBeat + 1} of ${totalBeats}` : 'Loop not playing'
        }
      >
        <div
          className="absolute top-0 h-1.5 rounded-full bg-accent/60"
          style={{ width: `${Math.max(0, pct * 100)}%` }}
        />
        {nowBeat >= 0 && (
          <div
            className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-surface bg-accent"
            style={{ left: `${pct * 100}%` }}
          />
        )}
      </div>

      {/* beat cells */}
      <div className="mt-1 flex w-full gap-px" aria-hidden="true">
        {Array.from({ length: totalBeats }, (_, i) => {
          const isNow = i === nowBeat
          // downbeat (beat 1 of a bar) gets a brighter tick
          const isDownbeat = i % 4 === 0
          return (
            <div
              key={i}
              className="h-2 flex-1 rounded-sm"
              style={{
                backgroundColor: isNow ? '#a855f7' : isDownbeat ? '#2a2a2a' : '#1a1a1a',
                opacity: isNow ? 1 : isDownbeat ? 1 : 0.7,
              }}
            />
          )
        })}
      </div>

      {bpm ? (
        <p className="mt-1 text-right text-[10px] text-gray-500">~{Math.round(bpm)} BPM</p>
      ) : null}
    </div>
  )
}

export default function RoadmapTrack({
  progression,
  keyRoot = 0,
  keyMode = 'major',
  position = -1,
  bpm,
}) {
  // Tolerate a missing / malformed progression — the panel is never empty-crashed.
  if (!progression || !Array.isArray(progression.degrees) || progression.degrees.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-panel p-4 text-sm text-gray-500">
        No loop to map yet — play a progression.
      </div>
    )
  }

  const { degrees, qualities = [], rn = [], bars = [], name, id } = progression
  const n = degrees.length

  // Resolve each station to an absolute chord in the current key.
  const stations = degrees.map((deg, i) => {
    const rootPc  = (((keyRoot + deg) % 12) + 12) % 12
    const quality = qualities[i] ?? 'maj'
    return {
      rootPc,
      quality,
      rn:         rn[i] ?? '',
      scaleLabel: prettyScale(rootPc, quality, keyMode),
      bars:       bars[i] ?? 1,
    }
  })

  // Voice-leading rails between adjacent stations, plus a wrap-around rail from
  // the last station back to the first (the loop is a wheel — a nice touch the
  // design calls for: "B holds → next loop"). Index i = rail leaving station i.
  const rails = stations.map((s, i) => {
    const next = stations[(i + 1) % n]
    return voiceLeadingPairs(
      { root: s.rootPc, quality: s.quality },
      { root: next.rootPc, quality: next.quality },
    )[0] ?? null   // the headline rail is the 7→3 (voiceLeadingPairs lists 7th first)
  })

  const nextPos = position >= 0 ? (position + 1) % n : -1

  return (
    <section
      className="rounded-2xl border border-border bg-panel p-4"
      aria-label={`Roadmap for ${name ?? id ?? 'loop'}`}
    >
      {/* Header strip: loop name + station chord summary */}
      <header className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-300">
          {name ?? 'Loop'}
        </h3>
        <span className="text-xs text-gray-500">
          {stations.map(s => chordName(s.rootPc, s.quality)).join(' → ')}
        </span>
      </header>

      {/* The highway: stations interleaved with voice-leading rails. Scrolls
          horizontally when the loop is longer than the viewport. */}
      <div className="overflow-x-auto pb-1">
        <div role="list" aria-label="Loop stations" className="flex min-w-min items-stretch">
          {stations.map((s, i) => (
            <div key={i} className="flex items-center">
              <Station
                index={i}
                rootPc={s.rootPc}
                quality={s.quality}
                rn={s.rn}
                scaleLabel={s.scaleLabel}
                isNow={i === position}
                isNext={i === nextPos}
                width={STATION_MIN_W}
              />
              {/* rail to the next station (inter-station rails only; the
                  wrap-around rail is drawn separately after the last station) */}
              {i < n - 1 && <Rail pair={rails[i]} />}
            </div>
          ))}
          {/* wrap-around rail back to station 1, rendered after the last station */}
          {n > 1 && (
            <div className="flex items-center" aria-hidden="true">
              <Rail pair={rails[n - 1]} />
              <span className="ml-0.5 text-[9px] uppercase tracking-wider text-gray-500">
                loop
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Playhead + beat grid */}
      <BeatGrid bars={stations.map(s => s.bars)} position={position} bpm={bpm} />
    </section>
  )
}
