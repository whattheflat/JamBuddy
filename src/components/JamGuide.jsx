import { useState, useMemo, useEffect } from 'react'
import kb from '../data/kb/index.js'
import { buildLoopIndex, matchLoopToProgression, findLoopPosition, chordRootPC } from '../lib/match'
import { NOTES, CHORD_TYPES } from '../lib/theory'
import RoadmapTrack from './RoadmapTrack'
import GlanceRail from './GlanceRail'
import VoicingBrowser from './VoicingBrowser'
import LickCard, { TechniqueLegend } from './LickCard'
import { ExploreSection, VoicingsSection, LevelChips } from './ExplorePanel'
import { pianoVoicingChain } from '../lib/piano'
import { parseChord } from '../lib/voicings'

// ─── JamGuide — the Knowledge Center bottom dock ──────────────────────────────
//
// The large bottom panel of JamBuddy. Originally the Roadmap Jam Guide dock
// (tasks L-02/D-02/L-11); task L-22 grew it into the KNOWLEDGE CENTER shell per
// docs/design/knowledge-center.md — one dock, four sections behind a pill nav:
//
//   Jam Guide (live)     — the original Roadmap body, moved verbatim (default)
//   Explore              — KB progression browser + famous progressions
//   Voicings             — chord picker (follows the live chord) → VoicingBrowser
//   Licks & Techniques   — per-style LickCard grid + technique legend
//
// Explore/Voicings parts come from ExplorePanel.jsx (refactored to named
// exports); the shell owns the shared foundation/intermediate level filter
// consumed by Explore + Licks. Collapsed-bar behaviour is unchanged apart from
// the "Knowledge Center" name.
//
// Props:
//   detectedProgression : string[] | null  — the live detected loop (chord names)
//   keyInfo             : { root, mode, confidence } | null  — effective key
//   chordHistory        : string[]          — committed chord history (for position)
//   bpm                 : number | null     — live tempo from the onset pipeline
//   currentChord        : string | undefined — most recent committed chord
//   onFocusChord        : fn({rootPc,quality}|null) — Fretboard guide-tone link (D-03)
//   onChordClick        : fn(chordName) — opens ChordDetailModal (additive, L-22)

// Display order for instrument tabs; availability is derived from the KB, not
// hardcoded — EXCEPT piano, which is always available: its voicings are COMPUTED
// from the progression's degrees+qualities via src/lib/piano.js (L-10/L-11), so
// no authored KB piano pack is required.
const INSTRUMENTS = [
  { id: 'guitar', label: 'Guitar', icon: '🎸' },
  { id: 'piano',  label: 'Piano',  icon: '🎹' },
  { id: 'bass',   label: 'Bass',   icon: '🎵' },
]
const COMPUTED_INSTRUMENTS = new Set(['piano'])

// Knowledge Center sections (D-20 §1). 'jam' is the default landing section.
const SECTIONS = [
  { id: 'jam',      label: 'Jam Guide' },
  { id: 'explore',  label: 'Explore' },
  { id: 'voicings', label: 'Voicings' },
  { id: 'licks',    label: 'Licks & Techniques' },
]

// ─── Authored piano recipes → MiniPiano voicings (L-24) ───────────────────────
//
// A style may ship an authored piano pack (SCHEMA.md "Piano play"): per-chord
// degree recipes like { LH: ['3','5','7','9'] }. When the matched style has one
// for the matched progression, the piano tab prefers the FIRST play's recipes
// over the computed `pianoVoicingChain` — the recipes already encode the play's
// voice-leading choices per station, so they are NOT re-threaded. Styles without
// a piano pack (and any station whose recipe fails to resolve) fall back to the
// computed chain, per-station — malformed data must never crash the panel.

// Resolve a degree string ('3', 'b9', '13'…) to a pitch-class offset from the
// chord root, through the quality's intervals where the degree is quality-
// dependent ('3' → ♭3 for min7, '7' → the chord's actual 7th…). This mirrors
// `resolveDegree` in scripts/validate-kb.mjs — the KB contract's reference
// implementation — replicated here because src/ must not import from scripts/.
// Keep the two in sync by hand.
function resolveDegree(deg, quality) {
  const iv = CHORD_TYPES[quality]?.intervals
  if (!iv) return null
  const fixed = { 1: 0, b9: 1, 9: 2, '#9': 3, 11: 5, '#11': 6, b5: 6, b13: 8, 13: 9, 6: 9, b3: 3, b7: 10 }
  if (deg === '3') return iv.find(i => i === 3 || i === 4) ?? iv.find(i => i === 2 || i === 5) ?? null
  if (deg === '5') return iv.find(i => i === 6 || i === 7 || i === 8) ?? null
  if (deg === '7') return iv.find(i => i === 9 || i === 10 || i === 11) ?? null
  return fixed[deg] ?? null
}

// Convert one authored recipe into the MiniPiano `voicing` shape
// ({notes, pcs, bass, label, rootPc}). Placement follows the documented recipe
// convention (jazz/piano.js header): the order inside each hand IS the voicing
// order, low → high — so each note lands strictly above the previous one, in the
// nearest octave; the RH stacks on above the LH's top note (lh below rh). The
// octave anchor puts the bass in the first octave of MiniPiano's absolute-note
// space ([0,36], 0 = C3) — the first octave where the whole voicing fits — so
// the stack sits centrally in the rendered window. Returns null on ANY problem
// (missing/malformed recipe, unresolvable degree, span past the window) so the
// caller can fall back to the computed voicing for that station.
function recipeVoicing(recipe, rootPc, quality) {
  try {
    if (!recipe || typeof recipe !== 'object') return null
    // Semitone offsets above the chord root, stacked strictly ascending.
    const rel = []
    const handLabels = []
    let prev = null
    for (const hand of ['LH', 'RH']) {
      const degs = recipe[hand]
      if (degs === undefined) continue
      if (!Array.isArray(degs) || degs.length === 0) return null
      for (const d of degs) {
        const off = resolveDegree(String(d), quality)
        if (off === null || off === undefined) return null
        if (prev === null) {
          prev = off // the bass voice sits at its plain offset above the root
        } else {
          let step = (((off - prev) % 12) + 12) % 12
          if (step === 0) step = 12 // same pitch class → the next octave up
          prev += step
        }
        rel.push(prev)
      }
      handLabels.push(`${hand} ${degs.join('-')}`)
    }
    if (rel.length === 0) return null
    // Anchor: bass pitch class in the first octave; everything stacks above it.
    const bass = (((rootPc + rel[0]) % 12) + 12) % 12
    const notes = rel.map(r => bass + (r - rel[0]))
    if (notes[notes.length - 1] > 36) return null // doesn't fit the keyboard window
    return {
      notes,
      pcs: [...new Set(notes.map(n => ((n % 12) + 12) % 12))],
      bass,
      style: 'authored',
      label: handLabels.join(' · '), // honest per-chord degrees, e.g. "LH 3-5-7-9"
      rootPc,
    }
  } catch {
    return null
  }
}

// ─── Licks helpers (shared by LicksSection + the glance LicksStrip) ───────────
//
// `licksFor` was a closure-local inside LicksSection; lifted to module scope
// during the L-33 restructure (D-31 §5) so the strip shares it instead of
// duplicating the defensive read. Licks are guitar-only in the KB (C-20 schema).
function licksFor(id) {
  const l = kb?.[id]?.instruments?.guitar?.licks
  return Array.isArray(l) ? l : []
}

// Level-filter rule (D-20 §4): licks without a `level` count as foundation.
const lickLevel = (l) => (l?.level === 'intermediate' ? 'intermediate' : 'foundation')

// Token-boundary chordContext match (D-31 §2.4). `chordContext` is FREE TEXT
// ("over the I7", "♭VII9 → I9, landing on the One", "i7/i9 Dorian vamp") — a
// naive substring would make rn "I" match "♭VII" / "Imaj7" / "I7". So: tokenise
// the text on chord-symbol characters and require EXACT token equality against
// the station's rn or quality key. Case-sensitive — Roman-numeral case is
// semantic ("i" minor ≠ "I" major).
const CONTEXT_TOKEN_RE = /[A-Za-z0-9#♭]+/g
function lickFitsContext(lick, context) {
  if (!context) return false
  const ctx = typeof lick?.chordContext === 'string' ? lick.chordContext : ''
  const tokens = ctx.match(CONTEXT_TOKEN_RE) ?? []
  const wanted = [context.rn, context.quality].filter(Boolean)
  return wanted.length > 0 && tokens.some(t => wanted.includes(t))
}

export default function JamGuide({ detectedProgression, keyInfo, chordHistory = [], bpm, currentChord, onFocusChord, onChordClick }) {
  const [open, setOpen] = useState(false)

  // ── Knowledge Center shell state ────────────────────────────────────────────
  // Active section + the shared level filter (Explore + Licks toolbars, D-20 §4).
  // Both levels on by default; both can never be off (last-chip tap is a no-op).
  const [section, setSection] = useState('jam')
  const [levels, setLevels] = useState({ foundation: true, intermediate: true })
  const toggleLevel = (key) => setLevels(prev => {
    const next = { ...prev, [key]: !prev[key] }
    return (next.foundation || next.intermediate) ? next : prev
  })

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

  // ── Heard-live fallback chord (L-33, D-31 §2.3) ─────────────────────────────
  // No loop matched but chords are committing → the jam section shows a single
  // expanded gallery for the live chord, re-aimed on every commit. parseChord is
  // the same src/lib/voicings.js parser VoicingsSection uses; unparseable names
  // yield null and keep the dashed empty state.
  const liveChord = useMemo(
    () => (!match.matched && currentChord ? parseChord(currentChord) : null),
    [match.matched, currentChord]
  )

  // ── Per-station voicings ────────────────────────────────────────────────────
  // Stations are canonical KB order — index i aligns 1:1 with
  // progression.degrees[i] (the same station order RoadmapTrack renders). Each
  // entry carries the station's chord identity ({rootPc, quality, label, rn} —
  // the tap-to-fretboard contract) plus an instrument-specific payload:
  //   guitar → `shape`: from the recommended KB guitar play (the first play);
  //            its `chords` array is canonical order too. No shape → graceful gap.
  //   piano  → `voicing`: an AUTHORED pack's recipes when the matched style ships
  //            piano plays for this progression (L-24 — first play, converted via
  //            recipeVoicing; the recipes carry their own voice-leading, so no
  //            re-threading); otherwise COMPUTED via pianoVoicingChain over the
  //            whole loop in canonical order, so each station's register threads
  //            from the previous one (minimal movement between stations). A
  //            station whose recipe fails to resolve falls back to the computed
  //            chain individually. The station's rootPc is attached so MiniPiano
  //            marks the root key ("R") reliably.
  const stationVoicings = useMemo(() => {
    if (!match.matched || (instrument !== 'guitar' && instrument !== 'piano')) return []
    const prog = match.progression
    const degrees = prog?.degrees ?? []
    const qualities = prog?.qualities ?? []
    const stations = degrees.map((deg, i) => {
      const rootPc = (((keyRoot + deg) % 12) + 12) % 12
      const noteName = NOTES[rootPc]
      const suffix = CHORD_TYPES[qualities[i]]?.suffix ?? ''
      return {
        shape: null,
        voicing: null,
        rootPc,
        quality: qualities[i] ?? 'maj',
        label: `${noteName}${suffix}`,
        rn: prog?.rn?.[i] ?? '',
      }
    })
    if (instrument === 'guitar') {
      const plays = kb[match.style]?.instruments?.guitar?.plays?.[prog?.id]
      const play = Array.isArray(plays) ? plays[0] : null
      const chords = play?.chords ?? []
      for (let i = 0; i < stations.length; i++) {
        stations[i].shape = chords[i]?.shape ?? null
      }
    } else {
      // Authored piano pack first (L-24): the matched style's first piano play
      // for this progression, per-chord recipes resolved via recipeVoicing.
      const pianoPlays = kb[match.style]?.instruments?.piano?.plays?.[prog?.id]
      const play = Array.isArray(pianoPlays) && pianoPlays.length ? pianoPlays[0] : null
      const authored = play
        ? stations.map((st, i) => recipeVoicing(play.chords?.[i]?.recipe, st.rootPc, st.quality))
        : null
      // Computed fallback — only built when needed (no pack, or a recipe that
      // failed to resolve). Identical to the pre-L-24 computed path.
      const chain = (!authored || authored.some(v => !v))
        ? pianoVoicingChain(stations.map(({ rootPc, quality }) => ({ rootPc, quality })))
        : null
      for (let i = 0; i < stations.length; i++) {
        stations[i].voicing = authored?.[i]
          ?? (chain?.[i] ? { ...chain[i], rootPc: stations[i].rootPc } : null)
      }
    }
    return stations
  }, [match.matched, match.progression, match.style, instrument, keyRoot])

  // ── Pinned station (L-33 — replaces tap-to-enlarge `selectedStation`, same
  // semantics): pinning halts the rail's auto-follow and holds that station's
  // gallery open. null = follow the jam. ──
  const [pinnedStation, setPinnedStation] = useState(null)
  // Reset the pin whenever the loop or style changes underneath us.
  useEffect(() => { setPinnedStation(null) }, [match.id, match.style, instrument])

  // ── Cross-link to the main Fretboard (D-03) ─────────────────────────────────
  // When a station is PINNED, report its {rootPc, quality} upward so the
  // Fretboard can light that chord's guide tones; clear (null) on unpin. The
  // reset effect above sets pinnedStation → null on loop/style/instrument
  // change, which flows through here and clears the highlight too. Guarded so
  // the component still works standalone (onFocusChord optional).
  // Auto-follow (the unpinned accordion) NEVER emits focus-chord — repainting
  // the player's fretboard uninvited every chord change would fight their own
  // key view (D-31 §2.6). Only the pin gesture reaches this effect.
  useEffect(() => {
    if (!onFocusChord) return
    const st = pinnedStation != null ? stationVoicings[pinnedStation] : null
    onFocusChord(st ? { rootPc: st.rootPc, quality: st.quality } : null)
  }, [pinnedStation, stationVoicings, onFocusChord])

  // Clear the Fretboard highlight when JamGuide unmounts.
  useEffect(() => () => { onFocusChord?.(null) }, [onFocusChord])

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
          <span className="text-sm font-semibold text-accent shrink-0">Knowledge Center</span>
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

          {/* ── Section nav (Knowledge Center pills, D-20 §1) ── */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto">
            {SECTIONS.map(s => {
              const active = section === s.id
              const live = s.id === 'jam' && match.matched
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  aria-label={live ? `${s.label} — live loop matched` : s.label}
                  onClick={() => setSection(s.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1 min-h-[32px] rounded-lg text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active
                      ? 'bg-accent/20 border border-accent text-accent font-semibold'
                      : 'border border-border text-gray-300 hover:border-gray-500 hover:text-gray-100'
                  }`}
                >
                  <span>{s.label}</span>
                  {live && (
                    <span
                      aria-hidden="true"
                      title="matches your loop"
                      className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Section 1: Jam Guide (live) — the Roadmap body, moved verbatim ── */}
          {section === 'jam' && (
          <>
          {/* ── Tab rows ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 border-b border-border">

            {/* Instrument tabs */}
            <div className="flex items-center gap-1">
              {INSTRUMENTS.map(inst => {
                // Computed instruments (piano) need no KB pack — always selectable.
                const enabled = COMPUTED_INSTRUMENTS.has(inst.id) || availableInstruments.has(inst.id)
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

          {/* ── Roadmap slot (D-02 assembly; L-33 glance fallbacks) ── */}
          <div data-roadmap-slot className="flex-1 min-h-0 p-4 overflow-auto">
            {match.matched ? (
              <RoadmapAssembly
                progression={match.progression}
                keyRoot={keyRoot}
                keyMode={keyMode}
                position={canonicalPos}
                bpm={bpm}
                stationVoicings={stationVoicings}
                pinnedStation={pinnedStation}
                onPin={setPinnedStation}
                instrument={instrument}
                styleId={activeStyle}
                levels={levels}
              />
            ) : liveChord ? (
              /* No loop matched, but chords are committing (D-31 §2.3): the rail
                 degrades to a single "heard live" gallery, re-aimed on every
                 chord commit. Auto-follow only — nothing plays by itself. */
              <div className="flex flex-col gap-4">
                <section
                  className="rounded-2xl border border-border bg-panel p-3"
                  aria-label={`Heard live — every ${instrument} voicing of ${currentChord}`}
                >
                  <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    Heard live · {currentChord} — every voicing
                  </h4>
                  <p className="mb-2 text-[11px] text-gray-500">
                    {detectedProgression?.length
                      ? `Heard ${detectedProgression.join(' → ')} — no ${activeStyle} pattern matched yet; following the chord as it commits.`
                      : 'No repeating loop yet — following the chord as it commits.'}
                  </p>
                  <VoicingBrowser rootPc={liveChord.rootPc} quality={liveChord.type} show={instrument} />
                </section>
                {/* No station rn without a loop — context sort falls back to the
                    live chord's quality key (e.g. a "dom7" lick fits a live G7). */}
                <LicksStrip
                  styleId={activeStyle}
                  levels={levels}
                  instrument={instrument}
                  context={{ rn: '', quality: liveChord.type, label: currentChord }}
                />
              </div>
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
          </>
          )}

          {/* ── Section 2: Explore — KB progression browser + famous progressions ── */}
          {section === 'explore' && (
            <div className="flex-1 min-h-0 p-4 overflow-auto">
              <ExploreSection
                keyInfo={keyInfo}
                levels={levels}
                onToggleLevel={toggleLevel}
                onChordClick={onChordClick}
              />
            </div>
          )}

          {/* ── Section 3: Voicings — picker (follows live chord) → VoicingBrowser ── */}
          {section === 'voicings' && (
            <div className="flex-1 min-h-0 p-4 overflow-auto">
              <VoicingsSection
                keyInfo={keyInfo}
                chordHistory={chordHistory}
                currentChord={currentChord}
              />
            </div>
          )}

          {/* ── Section 4: Licks & Techniques — per-style LickCard grid ── */}
          {section === 'licks' && (
            <div className="flex-1 min-h-0 p-4 overflow-auto">
              <LicksSection styles={styles} levels={levels} onToggleLevel={toggleLevel} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── LicksSection — per-style structured-lick grid (D-20 §1 section 4) ────────
//
// Reads the STRUCTURED top-level `kb[style].instruments.guitar.licks ?? []`
// (C-20 schema; P-21 authors blues/jazz/funk concurrently — the section must
// work whether or not that data has landed, hence the defensive reads and the
// honest per-style empty states). One TechniqueLegend per grid, never per card.
function LicksSection({ styles, levels, onToggleLevel }) {
  const stylesWithLicks = useMemo(
    () => styles.filter(s => licksFor(s.id).length > 0),
    [styles] // kb is a static module import
  )

  const [styleOverride, setStyleOverride] = useState(null)
  const activeStyle = styleOverride ?? stylesWithLicks[0]?.id ?? styles[0]?.id
  const activeLabel = styles.find(s => s.id === activeStyle)?.label ?? activeStyle

  const all = licksFor(activeStyle)
  // Licks without a `level` count as foundation (D-20 §4).
  const visible = all.filter(l => levels[lickLevel(l)])

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: style chips + shared level filter */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1 flex-wrap">
          {styles.map(s => {
            const active = s.id === activeStyle
            const has = stylesWithLicks.some(w => w.id === s.id)
            return (
              <button key={s.id} type="button" aria-pressed={active}
                onClick={() => setStyleOverride(s.id)}
                title={has ? s.label : `${s.label} — no licks authored yet`}
                className={`px-2.5 py-1 min-h-[32px] rounded-lg text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? 'bg-accent/20 border border-accent text-accent font-semibold'
                    : has
                      ? 'border border-transparent text-gray-400 hover:text-gray-200 hover:border-border'
                      : 'border border-transparent text-gray-600 hover:text-gray-400 hover:border-border'
                }`}>
                {s.label}
              </button>
            )
          })}
        </div>
        <div className="w-px h-5 bg-border shrink-0" />
        <LevelChips levels={levels} onToggle={onToggleLevel} />
      </div>

      <p className="text-[11px] text-gray-500">
        Guitar licks · tab reads high e on top · amber marks = techniques (legend below)
      </p>

      {visible.length > 0 ? (
        <>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {visible.map((l, i) => (
              <LickCard key={l?.id ?? i} lick={l} size="full" />
            ))}
          </div>
          {/* Glyph key — once per grid (D-20 §3), not per card */}
          <div className="border-t border-border pt-3">
            <TechniqueLegend />
          </div>
        </>
      ) : (
        <div className="min-h-[120px] flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-center px-4">
          {all.length === 0 ? (
            <>
              <p className="text-sm text-gray-400">No licks authored for {activeLabel} yet.</p>
              <p className="text-xs text-gray-500">
                {stylesWithLicks.length > 0
                  ? `${stylesWithLicks.map(s => s.label).join(', ')} ${stylesWithLicks.length === 1 ? 'has' : 'have'} them — pick one above.`
                  : 'Lick packs are landing style by style — check back soon.'}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">
              Nothing at the selected level for {activeLabel} — flip the level filter back on.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── LicksStrip — glanceable licks below the rail (L-33, D-31 §2.4) ───────────
//
// Thumb LickCards for the active style, level-filtered, sorted current-station-
// context-first via the token-boundary matcher above. The "fits X — now" accent
// ring + microcopy are STRIP-OWNED chrome rendered AROUND the card — LickCard
// itself is untouched and shows chordContext only at size="full". Licks are
// guitar-only in the KB, so under the piano tab the strip still shows them and
// the heading says so. Style has no licks (or the level filter empties it) →
// the strip hides entirely: an empty state would steal glance space to say
// nothing. Tap a thumb → the card enlarges inline (comfort, not information).
//
//   styleId    — KB style whose licks to show (the active style)
//   levels     — the shared foundation/intermediate filter
//   instrument — current instrument tab (piano → honest "guitar licks" heading)
//   context    — { rn, quality, label } of the playhead station (or the live
//                chord in the no-loop fallback); null → no context sort
function LicksStrip({ styleId, levels, instrument, context }) {
  // Inline enlarge (one card at a time); reset when the style changes.
  const [expandedId, setExpandedId] = useState(null)
  useEffect(() => { setExpandedId(null) }, [styleId])

  const visible = licksFor(styleId).filter(l => levels[lickLevel(l)])
  const fitted = visible.filter(l => lickFitsContext(l, context))
  const rest = visible.filter(l => !lickFitsContext(l, context))
  const sorted = [...fitted, ...rest]

  if (sorted.length === 0) return null

  const styleLabel = kb?.[styleId]?.meta?.label ?? styleId
  const fitLabel = typeof context?.label === 'string' ? context.label : null

  return (
    <section
      className="rounded-2xl border border-border bg-panel p-3"
      aria-label={`${styleLabel} guitar licks`}
    >
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        {styleLabel} licks · guitar
        {instrument === 'piano' ? ' (no piano licks in the KB yet)' : ''}
        {fitted.length > 0 && fitLabel ? ` · fits ${fitLabel} first` : ''}
      </h4>
      <div className="flex items-start gap-2 overflow-x-auto pb-1" role="list">
        {sorted.map((l, idx) => {
          const id = l?.id ?? `lick-${idx}`
          const isFit = idx < fitted.length // sorted = fitted first, then rest
          const isOpen = expandedId === id
          return (
            <div key={id} role="listitem" className={`shrink-0 ${isOpen ? 'w-[340px]' : 'w-[220px]'}`}>
              <button
                type="button"
                aria-pressed={isOpen}
                aria-label={`${l?.name ?? 'lick'}${isFit && fitLabel ? ` — fits ${fitLabel} now` : ''}; tap to ${isOpen ? 'shrink' : 'enlarge'}`}
                onClick={() => setExpandedId(isOpen ? null : id)}
                className={
                  'block w-full rounded-lg text-left outline-none transition ' +
                  'focus-visible:ring-2 focus-visible:ring-accent ' +
                  (isFit ? 'ring-1 ring-accent' : '')
                }
              >
                <LickCard lick={l} size={isOpen ? 'full' : 'thumb'} />
              </button>
              {isFit && fitLabel && (
                <p className="mt-1 text-center text-[10px] font-medium text-accent">
                  fits {fitLabel} — now
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─── RoadmapAssembly — the live panel body ────────────────────────────────────
//
// Composes RoadmapTrack (the improv highway) with the GlanceRail — the
// station-aligned voicing rail (extracted verbatim in L-33 commit 1; the
// playhead accordion lands in commit 2). The parent keeps ownership of the
// pinned-station state so the onFocusChord contract stays in JamGuide.
function RoadmapAssembly({
  progression, keyRoot, keyMode, position, bpm,
  stationVoicings, pinnedStation, onPin, instrument, styleId, levels,
}) {
  // Licks-strip context = the PLAYHEAD station (position -1 → station 0, the
  // same rule as the rail's expansion). The pin freezes the accordion, not the
  // strip — the strip keeps re-sorting with the jam (D-31 §2.4).
  const contextStation = stationVoicings[position >= 0 ? position : 0] ?? null

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

      {/* The playhead accordion (one column per station, canonical order). */}
      <GlanceRail
        stations={stationVoicings}
        activeIndex={position}
        pinnedIndex={pinnedStation}
        onPin={onPin}
        instrument={instrument}
        keyRoot={keyRoot}
      />

      {/* Licks for the active style, current-station-context first. At 1280×900
          this sits just below the fold — one scroll-flick down (D-31 §3). */}
      <LicksStrip
        styleId={styleId}
        levels={levels}
        instrument={instrument}
        context={contextStation}
      />
    </div>
  )
}
