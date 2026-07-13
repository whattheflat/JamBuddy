// ExplorePanel — refactored into Knowledge Center parts (task L-22, per
// docs/design/knowledge-center.md §7 step 1).
//
// This file now exports the named building blocks the Knowledge Center shell
// (JamGuide.jsx) composes:
//
//   <LevelChips levels onToggle/>        — the shared foundation/intermediate filter
//   <ChordPickerToolbar …/>              — controlled root × quality picker row
//   <ExploreSection …/>                  — KB progression browser + famous progressions
//   <VoicingsSection …/>                 — picker (follows the live chord) → VoicingBrowser
//
// The default export remains a thin standalone composition of the parts (the
// panel is verified-orphaned — no importer — so it exists only so the file
// stays a complete, mountable component). GuitarGrid/PianoGrid are kept as
// exported no-audio fallbacks per the D-20 IA map (§2).

import { useEffect, useMemo, useState } from 'react'
import ChordBox from './ChordBox'
import CircleOfFifths from './CircleOfFifths'
import MiniPiano from './MiniPiano'
import VoicingBrowser from './VoicingBrowser'
import kb from '../data/kb/index.js'
import { getGuitarVoicings, getPianoTechniques, parseChord } from '../lib/voicings'
import { CHORD_TYPES, NOTES, getChordsInKey, toRomanNumeral } from '../lib/theory'
import { FAMOUS_PROGRESSIONS, progressionInKey } from '../lib/education'

const CHORD_TYPE_OPTIONS = [
  { key: 'maj',      label: 'Major'  },
  { key: 'min',      label: 'Minor'  },
  { key: 'dom7',     label: '7'      },
  { key: 'maj7',     label: 'maj7'   },
  { key: 'min7',     label: 'm7'     },
  { key: 'dim',      label: 'dim'    },
  { key: 'dim7',     label: 'dim7'   },
  { key: 'half_dim', label: 'm7♭5'   },
  { key: 'aug',      label: 'aug'    },
  { key: 'sus4',     label: 'sus4'   },
  { key: 'sus2',     label: 'sus2'   },
  { key: 'maj6',     label: '6'      },
  { key: 'min6',     label: 'm6'     },
  { key: 'add9',     label: 'add9'   },
]

const MAJOR_TYPES = new Set(['maj','maj7','maj6','add9','sus4','sus2','aug','dom7'])

// Progressions/licks without a `level` count as foundation (D-20 §4).
const levelOf = (item) => (item?.level === 'intermediate' ? 'intermediate' : 'foundation')

// ─── Level filter chips (shared by Explore + Licks toolbars) ──────────────────
// Two toggle chips, both on by default. The SHELL owns the `levels` state
// ({foundation, intermediate}) and enforces "both can't be off"; the chip for
// the last active level advertises the no-op via its title.
export function LevelChips({ levels = {}, onToggle }) {
  const defs = [
    { key: 'foundation',   label: 'Foundation'   },
    { key: 'intermediate', label: 'Intermediate' },
  ]
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Level filter">
      {defs.map(d => {
        const active = !!levels[d.key]
        const lastActive = active && !defs.some(o => o.key !== d.key && levels[o.key])
        return (
          <button
            key={d.key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle?.(d.key)}
            title={lastActive
              ? 'At least one level stays on'
              : `${active ? 'Hide' : 'Show'} ${d.label.toLowerCase()} material`}
            className={`min-h-[32px] px-2.5 py-1 rounded-lg border text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              active
                ? 'bg-accent/20 border-accent text-accent font-semibold'
                : 'bg-surface border-border text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            {d.label}
          </button>
        )
      })}
    </div>
  )
}

// Level badge on cards — mirrors LickCard's badge treatment (amber = the
// existing secondary-tone token; foundation stays quiet).
function LevelBadge({ level }) {
  if (level === 'intermediate') {
    return (
      <span className="shrink-0 text-[9px] uppercase tracking-wide font-semibold text-amber border border-amber/40 rounded px-1.5 py-px">
        intermediate
      </span>
    )
  }
  if (level === 'foundation') {
    return (
      <span className="shrink-0 text-[9px] uppercase tracking-wide font-semibold text-gray-400 border border-border rounded px-1.5 py-px">
        foundation
      </span>
    )
  }
  return null
}

// ─── Quick-pick chip row ──────────────────────────────────────────────────────
function ChipRow({ label, chords, active, keyInfo, onSelect }) {
  if (!chords?.length) return null
  return (
    <div className="flex items-start gap-2 flex-wrap">
      <span className="text-[10px] uppercase tracking-wider text-gray-600 w-16 pt-1 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {chords.map(chord => {
          const rn = keyInfo?.root ? toRomanNumeral(chord, keyInfo.root, keyInfo.mode) : ''
          return (
            <button key={chord} onClick={() => onSelect(chord)}
              className={`flex flex-col items-center px-2.5 py-1 rounded-lg border text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active === chord
                  ? 'bg-accent border-accent text-white'
                  : 'bg-surface border-border text-gray-300 hover:border-accent/50 hover:text-accent'
              }`}>
              <span>{chord}</span>
              {rn && <span className="text-[9px] font-normal opacity-60 leading-none mt-0.5">{rn}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Chord picker toolbar (controlled: root × quality) ───────────────────────
export function ChordPickerToolbar({ root, typeKey, onRootChange, onTypeChange }) {
  const chordName = root + (CHORD_TYPES[typeKey]?.suffix ?? '')
  return (
    <div className="flex flex-wrap gap-2 items-center p-3 bg-surface border border-border rounded-xl">
      <div className="flex flex-wrap gap-1">
        {NOTES.map(n => (
          <button key={n} type="button" onClick={() => onRootChange?.(n)}
            aria-pressed={root === n}
            className={`px-2 py-0.5 rounded text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              root === n ? 'bg-accent text-white' : 'bg-border text-gray-400 hover:text-white'
            }`}>
            {n}
          </button>
        ))}
      </div>
      <div className="w-px h-5 bg-border shrink-0" />
      <div className="relative">
        <select value={typeKey} onChange={e => onTypeChange?.(e.target.value)}
          aria-label="Chord quality"
          className="appearance-none bg-panel border border-border rounded-lg pl-2 pr-6 py-1 text-xs text-gray-200 cursor-pointer focus:outline-none focus:border-accent">
          {CHORD_TYPE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▾</span>
      </div>
      <div className="text-2xl font-black text-accent ml-2">{chordName}</div>
    </div>
  )
}

// ─── Guitar voicings grid (no-audio fallback; superseded by VoicingBrowser) ──
export function GuitarGrid({ chordName }) {
  const voicings = getGuitarVoicings(chordName)
  if (!voicings.length) return <p className="text-gray-600 text-sm py-4">No voicings for {chordName}.</p>
  return (
    <div>
      <div className="flex flex-wrap gap-4">
        {voicings.map((v, i) => (
          <div key={i} className="flex flex-col items-center p-3 rounded-xl bg-surface border border-border hover:border-accent/30 transition-colors">
            <ChordBox frets={v.frets} fingers={v.fingers} barre={v.barre} baseFret={v.baseFret} />
            <p className="text-[11px] text-gray-500 text-center mt-1 max-w-[110px] leading-tight">{v.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-700 mt-3">
        Purple = chord tone · finger numbers inside dots (1=index 4=pinky) · fret number on left if not starting at fret 1
      </p>
    </div>
  )
}

// ─── Piano techniques grid (no-audio fallback; superseded by VoicingBrowser) ─
export function PianoGrid({ chordName }) {
  const parsed = parseChord(chordName)
  const techniques = getPianoTechniques(chordName)
  const rootPc = parsed?.rootPc ?? 0
  if (!techniques.length) return <p className="text-gray-600 text-sm py-4">No techniques for {chordName}.</p>
  return (
    <div className="flex flex-col gap-3">
      {techniques.map((t, i) => (
        <div key={i} className="flex flex-col lg:flex-row gap-3 p-3 bg-surface border border-border rounded-xl hover:border-accent/30 transition-colors">
          <div className="shrink-0 overflow-x-auto">
            <MiniPiano rootPc={rootPc} lh={t.lh} rh={t.rh} />
          </div>
          <div className="flex flex-col gap-1 min-w-0 justify-center">
            <p className="font-bold text-white text-sm">{t.name}</p>
            <p className="text-gray-400 text-xs">{t.desc}</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              <span className="text-amber-400 font-semibold">Tip:</span> {t.tip}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Famous progressions using this chord as tonic ───────────────────────────
// NOTE (D-20 §4, recorded Maestro call): FAMOUS_PROGRESSIONS carries no `level`
// field — these cards show no badge and are EXEMPT from the level filter.
function ProgressionCards({ chordName, onChordClick }) {
  const parsed = parseChord(chordName)
  if (!parsed) return null
  const { rootPc, type } = parsed
  const root = NOTES[rootPc]
  const isMajor = MAJOR_TYPES.has(type)

  const matching = FAMOUS_PROGRESSIONS.filter(p => {
    const q0 = p.qualities[0]
    return isMajor ? MAJOR_TYPES.has(q0) : !MAJOR_TYPES.has(q0)
  }).slice(0, 6)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        Famous progressions with <span className="text-accent font-bold">{chordName}</span> as the tonic.
        Click any chord to see its voicings.
      </p>
      {matching.map(prog => {
        const chordsHere = progressionInKey(prog, root)
        return (
          <div key={prog.id} className="p-3 bg-surface border border-border rounded-xl">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="font-bold text-white text-sm">{prog.name}</span>
              <span className="text-[10px] font-mono text-gray-600">{prog.pattern}</span>
              {prog.genre.slice(0, 2).map(g => (
                <span key={g} className="px-1.5 py-0.5 bg-accent/10 border border-accent/20 rounded text-[10px] text-accent">{g}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 items-center mb-2">
              {chordsHere.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <button onClick={() => onChordClick?.(c)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-sm border transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      i === 0
                        ? 'bg-accent border-accent text-white'
                        : 'bg-panel border-border text-gray-200 hover:border-accent/50 hover:text-accent'
                    }`}>
                    {c}
                  </button>
                  {i < chordsHere.length - 1 && <span className="text-gray-700 text-xs">→</span>}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-600 leading-snug">{prog.description}</p>
            {prog.songs.length > 0 && (
              <p className="text-[11px] text-gray-700 mt-1">{prog.songs.slice(0, 3).join(' · ')}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── One KB progression card (the Explore browser hero) ──────────────────────
function KbProgressionCard({ prog, keyRootPc, onChordClick }) {
  const degrees = prog?.degrees ?? []
  const qualities = prog?.qualities ?? []
  const chords = degrees.map((deg, i) => {
    const pc = (((keyRootPc + deg) % 12) + 12) % 12
    return `${NOTES[pc]}${CHORD_TYPES[qualities[i]]?.suffix ?? ''}`
  })
  const songs = Array.isArray(prog?.songs) ? prog.songs : []
  return (
    <div className="p-3 bg-surface border border-border rounded-xl">
      <div className="flex items-center flex-wrap gap-2 mb-2">
        <span className="font-bold text-white text-sm">{prog?.name ?? prog?.id ?? 'Untitled'}</span>
        {Array.isArray(prog?.rn) && prog.rn.length > 0 && (
          <span className="text-[10px] font-mono text-gray-600">{prog.rn.join(' – ')}</span>
        )}
        <LevelBadge level={levelOf(prog)} />
      </div>
      {chords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center mb-2">
          {chords.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <button type="button" onClick={() => onChordClick?.(c)}
                title={`Open ${c} details`}
                className="px-2.5 py-1 rounded-lg font-bold text-sm border bg-panel border-border text-gray-200 transition-all outline-none hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent">
                {c}
              </button>
              {i < chords.length - 1 && <span className="text-gray-700 text-xs">→</span>}
            </span>
          ))}
        </div>
      )}
      {prog?.tip && <p className="text-xs text-gray-400 leading-snug">{prog.tip}</p>}
      {songs.length > 0 && (
        <p className="text-[11px] text-gray-500 mt-1">{songs.slice(0, 3).join(' · ')}</p>
      )}
    </div>
  )
}

// ─── Explore section — KB progression browser + famous progressions ──────────
// Props: keyInfo (chords render in the detected key; C until one is known),
// levels + onToggleLevel (shell-owned shared filter), onChordClick (chord name
// string → ChordDetailModal).
export function ExploreSection({ keyInfo, levels, onToggleLevel, onChordClick }) {
  const styles = useMemo(
    () => Object.entries(kb ?? {}).map(([id, s]) => ({ id, label: s?.meta?.label ?? id })),
    []
  )
  const [styleOverride, setStyleOverride] = useState(null)
  const activeStyle = styleOverride ?? styles[0]?.id

  const keyRootPc = parseChord(keyInfo?.root ?? '')?.rootPc ?? 0
  const keyMode = keyInfo?.mode === 'minor' ? 'minor' : 'major'
  const tonicName = `${NOTES[keyRootPc]}${keyMode === 'minor' ? 'm' : ''}`

  const progressions = kb?.[activeStyle]?.progressions ?? []
  const visible = progressions.filter(p => levels?.[levelOf(p)])

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: style chips + shared level filter */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1 flex-wrap">
          {styles.map(s => {
            const active = s.id === activeStyle
            return (
              <button key={s.id} type="button" aria-pressed={active}
                onClick={() => setStyleOverride(s.id)}
                className={`px-2.5 py-1 min-h-[32px] rounded-lg text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? 'bg-accent/20 border border-accent text-accent font-semibold'
                    : 'border border-transparent text-gray-400 hover:text-gray-200 hover:border-border'
                }`}>
                {s.label}
              </button>
            )
          })}
        </div>
        <div className="w-px h-5 bg-border shrink-0" />
        <LevelChips levels={levels} onToggle={onToggleLevel} />
      </div>

      {/* Circle of fifths — live key map with inline diatonics (task D-61).
          keyInfo here IS App's effectiveKey (App → KnowledgeDock → this section);
          the circle is read-only — tapping wedges never touches key state. */}
      <CircleOfFifths keyInfo={keyInfo} onChordClick={onChordClick} />

      <p className="text-[11px] text-gray-500">
        Chords shown in {NOTES[keyRootPc]} {keyMode}{keyInfo?.root ? '' : ' (no key detected yet)'} · tap any chord for voicings
      </p>

      {/* KB progression cards */}
      {visible.length > 0 ? (
        <div className="flex flex-col gap-3">
          {visible.map((p, i) => (
            <KbProgressionCard key={p?.id ?? i} prog={p} keyRootPc={keyRootPc} onChordClick={onChordClick} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-2">
          {progressions.length === 0
            ? 'No progressions authored for this style yet.'
            : 'Nothing at the selected level for this style — flip the level filter back on.'}
        </p>
      )}

      {/* Famous progressions (exempt from the level filter — untagged corpus) */}
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          Famous progressions <span className="normal-case tracking-normal font-normal">· not affected by the level filter</span>
        </h4>
        <ProgressionCards chordName={tonicName} onChordClick={onChordClick} />
      </div>
    </div>
  )
}

// ─── Voicings section — picker (follows the live chord) → VoicingBrowser ─────
// Props: keyInfo + chordHistory feed the quick-pick chips; currentChord re-aims
// the picker whenever a new chord commits (manual picks hold until then).
// `instrument` (L-40, D-40 §3) scopes the browser to App's global selector —
// omitted (the orphaned standalone panel below) it falls back to 'both' via
// VoicingBrowser's own `show` default.
export function VoicingsSection({ keyInfo, chordHistory, currentChord, instrument }) {
  const [root, setRoot]       = useState('C')
  const [typeKey, setTypeKey] = useState('maj')
  const [active, setActive]   = useState('')

  useEffect(() => {
    if (!currentChord) return
    const p = parseChord(currentChord)
    if (p) { setRoot(NOTES[p.rootPc]); setTypeKey(p.type); setActive(currentChord) }
  }, [currentChord])

  function selectChord(chord) {
    setActive(chord)
    const p = parseChord(chord)
    if (p) { setRoot(NOTES[p.rootPc]); setTypeKey(p.type) }
  }

  const recentChords = [...new Set([...(chordHistory ?? [])].reverse())].slice(0, 12)
  const keyChords    = keyInfo?.root ? getChordsInKey(keyInfo.root, keyInfo.mode ?? 'major') : []
  const rootPc       = parseChord(root)?.rootPc ?? 0

  return (
    <div className="flex flex-col gap-4">
      {(recentChords.length > 0 || keyChords.length > 0) && (
        <div className="flex flex-col gap-2.5 p-3 bg-surface border border-border rounded-xl">
          <ChipRow label="History" chords={recentChords} active={active} keyInfo={keyInfo} onSelect={selectChord} />
          {keyChords.length > 0 && recentChords.length > 0 && <div className="h-px bg-border" />}
          {keyChords.length > 0 && (
            <ChipRow
              label={keyInfo.root + ' ' + (keyInfo.mode ?? '')}
              chords={keyChords} active={active} keyInfo={keyInfo} onSelect={selectChord}
            />
          )}
        </div>
      )}

      <ChordPickerToolbar
        root={root}
        typeKey={typeKey}
        onRootChange={n => { setRoot(n); setActive('') }}
        onTypeChange={k => { setTypeKey(k); setActive('') }}
      />

      <VoicingBrowser rootPc={rootPc} quality={typeKey} show={instrument} />
    </div>
  )
}

// ─── Standalone panel (thin composition; orphaned — kept mountable) ──────────
export default function ExplorePanel({ keyInfo, chordHistory, currentChord, onChordClick }) {
  const [open, setOpen] = useState(false)
  const [levels, setLevels] = useState({ foundation: true, intermediate: true })
  const toggleLevel = (key) => setLevels(prev => {
    const next = { ...prev, [key]: !prev[key] }
    return (next.foundation || next.intermediate) ? next : prev // both can't be off
  })

  return (
    <div className="mb-3 bg-panel border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-all">
        <span>EXPLORE ANY CHORD</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-border p-4 flex flex-col gap-6">
          <ExploreSection keyInfo={keyInfo} levels={levels} onToggleLevel={toggleLevel} onChordClick={onChordClick} />
          <VoicingsSection keyInfo={keyInfo} chordHistory={chordHistory} currentChord={currentChord} />
        </div>
      )}
    </div>
  )
}
