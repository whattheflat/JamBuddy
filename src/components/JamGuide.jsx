import { useState, useMemo, useRef, useEffect } from 'react'
import kb from '../data/kb/index.js'
import { buildLoopIndex, matchLoopToProgression, findLoopPosition, chordRootPC } from '../lib/match'
import { NOTES, CHORD_TYPES } from '../lib/theory'
import RoadmapTrack from './RoadmapTrack'
import ChordDiagram from './ChordDiagram'

// ─── JamGuide — the Roadmap bottom dock ───────────────────────────────────────
//
// The large bottom panel of JamBuddy. This is the SHELL (task L-02): the
// collapsed header bar, instrument + style tabs (derived from the KB registry),
// live loop → KB progression resolution, and a clearly-marked placeholder slot
// where the Roadmap visualization (RoadmapTrack + ChordDiagram, task D-02) will
// be wired in afterwards.
//
// This component does NOT import RoadmapTrack or ChordDiagram — sibling tasks
// build those in parallel; D-02 fills the [data-roadmap-slot] left here.
//
// Props (the contract D-02 relies on):
//   detectedProgression : string[] | null  — the live detected loop (chord names)
//   keyInfo             : { root, mode, confidence } | null  — effective key
//   chordHistory        : string[]          — committed chord history (for position)
//   bpm                 : number | null     — live tempo from the onset pipeline
//   currentChord        : string | undefined — most recent committed chord

// Display order for instrument tabs; availability is derived from the KB, not hardcoded.
const INSTRUMENTS = [
  { id: 'guitar', label: 'Guitar', icon: '🎸' },
  { id: 'piano',  label: 'Piano',  icon: '🎹' },
  { id: 'bass',   label: 'Bass',   icon: '🎵' },
]

export default function JamGuide({ detectedProgression, keyInfo, chordHistory = [], bpm, currentChord }) {
  const [open, setOpen] = useState(false)

  // Which instruments have at least one KB pack across the registry.
  const availableInstruments = useMemo(() => {
    const set = new Set()
    for (const style of Object.values(kb)) {
      for (const inst of Object.keys(style?.instruments ?? {})) set.add(inst)
    }
    return set
  }, [])

  // Style tabs straight from the KB registry, labelled via each style's meta.
  const styles = useMemo(
    () => Object.entries(kb).map(([id, style]) => ({ id, label: style?.meta?.label ?? id })),
    []
  )

  // Build the rotation-invariant loop index once.
  const kbIndex = useMemo(() => buildLoopIndex(kb), [])

  // Resolve the live loop → KB progression + rotation, and the current station.
  // Keyed on the loop input so this only recomputes when the loop changes.
  const loopKey = detectedProgression ? detectedProgression.join(',') : ''
  const match = useMemo(
    () => matchLoopToProgression(detectedProgression, kbIndex),
    [loopKey, kbIndex] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const position = useMemo(
    () => findLoopPosition(chordHistory, detectedProgression),
    [chordHistory, loopKey] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Instrument tab: default to guitar (the only packs that exist today).
  const [instrument, setInstrument] = useState('guitar')

  // Style tab: follow the matched style, but let the user override.
  const [styleOverride, setStyleOverride] = useState(null)
  const activeStyle = styleOverride ?? (match.matched ? match.style : styles[0]?.id)

  // Header summary: matched progression name, or a listening hint.
  const matchedName = match.matched ? match.progression?.name : null
  const headerLabel = matchedName
    ? matchedName
    : (detectedProgression?.length ? 'mapping the changes…' : 'listening…')

  // ── Key root: keyInfo.root is a note NAME (e.g. "C"). RoadmapTrack and
  // ChordDiagram both want a pitch class 0–11. Convert once; default to C (0)
  // until a key is known so the roadmap still resolves to *some* spelling. ──
  const keyRoot = useMemo(() => {
    const pc = chordRootPC(keyInfo?.root)
    return pc >= 0 ? pc : 0
  }, [keyInfo?.root])
  const keyMode = keyInfo?.mode === 'minor' ? 'minor' : 'major'

  // ── Playhead reconciliation ────────────────────────────────────────────────
  // `position` from findLoopPosition is an index into the *detected* loop, which
  // can start on any rotation of the KB progression. RoadmapTrack renders the
  // progression in *canonical KB order* (degrees[0] first). They differ by
  // `match.rotation` — the loop index that aligns with KB degrees[0]. To map a
  // detected-loop index back to its canonical station:
  //     canonicalPos = ((position − rotation) mod n + n) mod n
  // Worked example — KB blues-turnaround [I VI ii V] looped as [ii V I VI]:
  //   rotation = 2 (loop index 2 = the "I" = KB degrees[0]).
  //   Playhead on the V (detected index 1) → ((1 − 2) % 4 + 4) % 4 = 3 = the V's
  //   canonical station. NOW lands on the right station. ✓
  const canonicalPos = useMemo(() => {
    if (!match.matched) return -1
    const n = match.progression?.degrees?.length ?? 0
    if (!n || typeof position !== 'number' || position < 0) return -1
    return (((position - match.rotation) % n) + n) % n
  }, [match.matched, match.progression, match.rotation, position])

  // ── Per-station voicing shapes from the KB ──────────────────────────────────
  // For the matched style + progression id, pull the recommended guitar play
  // (the first play). Its `chords` array is in canonical KB order — chords[i]
  // aligns 1:1 with progression.degrees[i] (the same station order RoadmapTrack
  // renders). Each entry: { shape, note }. A station with no shape → graceful gap.
  const stationVoicings = useMemo(() => {
    if (!match.matched || instrument !== 'guitar') return []
    const prog = match.progression
    const styleId = match.style
    const plays = kb[styleId]?.instruments?.guitar?.plays?.[prog?.id]
    const play = Array.isArray(plays) ? plays[0] : null
    const chords = play?.chords ?? []
    const degrees = prog?.degrees ?? []
    const qualities = prog?.qualities ?? []
    return degrees.map((deg, i) => {
      const rootPc = (((keyRoot + deg) % 12) + 12) % 12
      const noteName = NOTES[rootPc]
      const suffix = CHORD_TYPES[qualities[i]]?.suffix ?? ''
      return {
        shape: chords[i]?.shape ?? null,
        rootPc,
        label: `${noteName}${suffix}`,
        rn: prog?.rn?.[i] ?? '',
      }
    })
  }, [match.matched, match.progression, match.style, instrument, keyRoot])

  // ── Tap-to-enlarge: which station's voicing is expanded (full diagram). ──
  const [selectedStation, setSelectedStation] = useState(null)
  // Reset the selection whenever the loop or style changes underneath us.
  useEffect(() => { setSelectedStation(null) }, [match.id, match.style, instrument])

  return (
    <div className="mb-3 bg-panel border border-border rounded-xl overflow-hidden">

      {/* ── Collapsed header bar (always visible) ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/5 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">🎸</span>
          <span className="text-sm font-semibold text-accent shrink-0">Jam Guide</span>
          <span className="text-gray-600 shrink-0">—</span>
          <span className="text-sm text-gray-300 truncate">{headerLabel}</span>
          {match.matched && keyInfo?.root && (
            <span className="text-xs text-gray-500 shrink-0">
              in {keyInfo.root} {keyInfo.mode}
            </span>
          )}
        </span>
        <span className="text-gray-500 shrink-0 ml-3">{open ? '▲' : '▼'}</span>
      </button>

      {/* ── Expanded body (~70vh) ── */}
      {open && (
        <div className="border-t border-border flex flex-col" style={{ height: '70vh' }}>

          {/* ── Tab rows ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 border-b border-border">

            {/* Instrument tabs */}
            <div className="flex items-center gap-1">
              {INSTRUMENTS.map(inst => {
                const enabled = availableInstruments.has(inst.id)
                const active = enabled && inst.id === instrument
                return (
                  <button
                    key={inst.id}
                    onClick={() => enabled && setInstrument(inst.id)}
                    disabled={!enabled}
                    title={enabled ? inst.label : `${inst.label} packs coming soon`}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      active
                        ? 'bg-accent/20 border border-accent text-accent'
                        : enabled
                          ? 'border border-border text-gray-300 hover:border-gray-500 hover:text-gray-100'
                          : 'border border-border/50 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    <span>{inst.icon}</span>
                    <span>{inst.label}</span>
                    {!enabled && <span className="text-[10px] text-gray-700 ml-0.5">soon</span>}
                  </button>
                )
              })}
            </div>

            <div className="w-px h-5 bg-border shrink-0" />

            {/* Style tabs (from the KB registry) */}
            <div className="flex items-center gap-1 flex-wrap">
              {styles.map(style => {
                const active = style.id === activeStyle
                const isMatched = match.matched && style.id === match.style
                return (
                  <button
                    key={style.id}
                    onClick={() => setStyleOverride(style.id)}
                    className={`px-2.5 py-1 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-accent/20 border border-accent text-accent font-semibold'
                        : 'border border-transparent text-gray-400 hover:text-gray-200 hover:border-border'
                    }`}
                  >
                    {style.label}
                    {isMatched && <span className="ml-1 text-accent/70" title="matches your loop">●</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Roadmap slot (D-02 assembly) ── */}
          <div data-roadmap-slot className="flex-1 min-h-0 p-4 overflow-auto">
            {match.matched ? (
              <RoadmapAssembly
                progression={match.progression}
                keyRoot={keyRoot}
                keyMode={keyMode}
                position={canonicalPos}
                bpm={bpm}
                stationVoicings={stationVoicings}
                selectedStation={selectedStation}
                onSelectStation={setSelectedStation}
              />
            ) : (
              <div
                className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-center"
              >
                <p className="text-sm text-gray-400">Play a few bars — I'll map the changes</p>
                <p className="text-xs text-gray-600">
                  {detectedProgression?.length
                    ? `Heard ${detectedProgression.join(' → ')}, but it doesn't match a ${activeStyle} pattern yet.`
                    : 'Roadmap renders here once a repeating loop is detected.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── RoadmapAssembly — the live panel body ────────────────────────────────────
//
// Composes RoadmapTrack (the improv highway) with a secondary voicing strip of
// ChordDiagram thumbnails (one per station, canonical KB order). Tapping a
// thumbnail enlarges it to a full diagram inline. The active station auto-scrolls
// into view. Narrow viewports (< ~640px) reflow: the strip wraps and the whole
// panel scrolls vertically rather than forcing a wide horizontal layout.
function RoadmapAssembly({
  progression, keyRoot, keyMode, position, bpm,
  stationVoicings, selectedStation, onSelectStation,
}) {
  const stripRef = useRef(null)
  const activeRef = useRef(null)

  // Auto-scroll the active station's thumbnail into view as the playhead moves.
  // Prop-driven (off `position`) — no rAF loop tied to the audio thread.
  useEffect(() => {
    if (position < 0 || !activeRef.current) return
    activeRef.current.scrollIntoView({
      behavior: 'smooth', inline: 'center', block: 'nearest',
    })
  }, [position])

  const selected = selectedStation != null ? stationVoicings[selectedStation] : null

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* The improv highway — active-station styling + playhead live inside it. */}
      <RoadmapTrack
        progression={progression}
        keyRoot={keyRoot}
        keyMode={keyMode}
        position={position}
        bpm={bpm}
      />

      {/* Secondary voicing strip: one thumbnail per station, canonical order. */}
      {stationVoicings.length > 0 && (
        <section
          className="rounded-2xl border border-border bg-panel p-3"
          aria-label="Voicing thumbnails"
        >
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Voicings · tap to enlarge
          </h4>
          <div
            ref={stripRef}
            className="flex flex-wrap gap-2 overflow-x-auto sm:flex-nowrap"
            role="list"
          >
            {stationVoicings.map((st, i) => {
              const isNow = i === position
              const isSelected = i === selectedStation
              return (
                <button
                  key={i}
                  ref={isNow ? activeRef : undefined}
                  type="button"
                  role="listitem"
                  aria-pressed={isSelected}
                  aria-current={isNow ? 'true' : undefined}
                  onClick={() => onSelectStation(isSelected ? null : i)}
                  title={`${st.label} — ${st.rn || `station ${i + 1}`}`}
                  className={
                    `flex shrink-0 flex-col items-center gap-1 rounded-lg border p-2 outline-none transition ` +
                    `focus-visible:ring-2 focus-visible:ring-accent ` +
                    (isNow
                      ? 'border-accent bg-accent/10 ring-1 ring-accent'
                      : isSelected
                        ? 'border-accent/60 bg-accent/5'
                        : 'border-border bg-surface hover:border-gray-500')
                  }
                  style={{ opacity: isNow ? 1 : 0.85 }}
                >
                  <ChordDiagram
                    shape={st.shape}
                    keyRoot={keyRoot}
                    rootPc={st.rootPc}
                    size="thumb"
                    label={st.label}
                  />
                  {st.rn && (
                    <span className="text-[9px] font-medium uppercase tracking-wide text-gray-500">
                      {st.rn}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Enlarged view of the tapped station (deferred fretboard cross-link
              lives here instead — see D-02 return note). */}
          {selected && (
            <div className="mt-3 flex flex-col items-center gap-2 border-t border-border pt-3">
              <ChordDiagram
                shape={selected.shape}
                keyRoot={keyRoot}
                rootPc={selected.rootPc}
                size="full"
                label={`${selected.label}${selected.rn ? ` · ${selected.rn}` : ''}`}
              />
              <button
                type="button"
                onClick={() => onSelectStation(null)}
                className="text-[11px] text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline focus-visible:ring-2 focus-visible:ring-accent rounded outline-none"
              >
                close
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
