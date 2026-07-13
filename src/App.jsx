import { useState, useCallback, useRef, useEffect } from 'react'
import AudioCapture from './components/AudioCapture'
import ProgressionBanner from './components/ProgressionBanner'
import Fretboard from './components/Fretboard'
import BassFretboard from './components/BassFretboard'
import Tuner from './components/Tuner'
import Piano from './components/Piano'
import Settings from './components/Settings'
import DebugView from './components/DebugView'
import DrumView from './components/DrumView'
import { NOTES, detectKey, detectTopKeys, matchChordFromChroma, detectRepeatingProgression, getChordTones, getChordCandidates, getNoteHistoryAnalysis } from './lib/theory'
import ChordDetailModal from './components/ChordDetailModal'
import RelatedProgressions from './components/RelatedProgressions'
import TryThis from './components/TryThis'
import LoopStation from './components/LoopStation'
import JamGuide, { KnowledgeDock } from './components/JamGuide'
import { useLoopEngine } from './services/loopEngine'
import kb from './data/kb/index.js'
import { seedableLoop, buildRoulettePool } from './lib/match'
import settingIcon from './assets/setting-icon.png'

const DEFAULTS = {
  // Key detection
  noteHistorySize:    2000,  // ~60s of notes — stable across a song section
  keyVoteWindow:      30,    // rolling window of key votes
  keyVoteThreshold:   20,    // 67% consensus — locks in after a few bars
  chordNoteBoost:     3,
  // Chord detection
  chromaSmooth:       8,    // 8 frames ≈ 130ms window, checks chord at ~7.5 Hz
  chordVoteThreshold: 2,    // 2 consecutive matches ≈ 260ms — works at any BPM
  chordMinScore:      0.35, // lenient enough for live guitar signal
  // Audio input
  minClarity:         0.80,
  minVolume:          0.01,
  // Selected device (null = system default)
  audioDeviceId:      null,
}

function loadStored(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback }
  catch { return fallback }
}

export default function App() {
  // ── Config ───────────────────────────────────────────────────────────────────
  const [config, setConfig] = useState(() => ({ ...DEFAULTS, ...loadStored('wtf_config', {}) }))
  const configRef = useRef(config)
  useEffect(() => { configRef.current = config; localStorage.setItem('wtf_config', JSON.stringify(config)) }, [config])

  const [showSettings, setShowSettings] = useState(false)

  function updateConfig(key, val) {
    setConfig(prev => ({ ...prev, [key]: val }))
  }

  // ── Listening state ──────────────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false)

  // ── Instrument view + tuner ───────────────────────────────────────────────────
  const [instrument, setInstrument] = useState('piano')  // 'piano' | 'guitar' | 'bass'
  const [showTuner, setShowTuner]   = useState(false)
  const [showDebug, setShowDebug]       = useState(false)
  const [showDrumView, setShowDrumView] = useState(false)
  const [monoColor, setMonoColor]   = useState(() => loadStored('wtf_monoColor', false))

  // ── Jam view (task L-50, one-screen.md §1.1) — pure UI/layout state ──────────
  // Layer 1: CSS lock — at xl the page root becomes h-screen overflow-hidden and
  // everything below the dashboard is unmounted. Layer 2: best-effort browser
  // fullscreen (Promise-caught — a refusal leaves layer 1 fully working). The
  // toggle never starts/stops listening and never touches audio state.
  const [jamView, setJamView] = useState(false)

  function enterJamView() {
    setJamView(true)
    document.documentElement.requestFullscreen?.()?.catch(() => {})
  }
  function exitJamView() {
    setJamView(false)
    if (document.fullscreenElement) document.exitFullscreen?.()?.catch(() => {})
  }

  // Escape and the native fullscreen exit (any means) both restore normal flow —
  // one state, never half-exited. Listeners active only while jamView.
  useEffect(() => {
    if (!jamView) return
    const onKey = (e) => { if (e.key === 'Escape') exitJamView() }
    const onFsChange = () => { if (!document.fullscreenElement) setJamView(false) }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFsChange)
    }
  }, [jamView])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Jam Guide → Fretboard cross-link (D-03) ──────────────────────────────────
  // When a Roadmap station is tapped, JamGuide reports its {rootPc, quality}
  // here and the main Fretboard highlights that chord's guide tones (3rd/7th).
  // null = no station focused (Fretboard renders normally). Purely UI state —
  // NOT read by any audio callback, so it stays out of the ref-sync contract.
  const [jamFocusChord, setJamFocusChord] = useState(null)  // { rootPc, quality } | null

  // ── Mic permission error ──────────────────────────────────────────────────────
  const [micError, setMicError] = useState(null)

  // ── Debug data ────────────────────────────────────────────────────────────────
  const [debugChroma,       setDebugChroma]       = useState(null)
  const [debugCandidates,   setDebugCandidates]   = useState([])
  const [debugNoteAnalysis, setDebugNoteAnalysis] = useState(null)
  const [debugWaveform,     setDebugWaveform]     = useState(null)

  // ── Stable refs for values used inside callbacks ──────────────────────────────
  const showDebugRef    = useRef(showDebug)
  const showDrumViewRef = useRef(showDrumView)
  const lockedKeyRef    = useRef(null)
  const listenStartRef  = useRef(null)
  useEffect(() => { showDebugRef.current = showDebug }, [showDebug])
  useEffect(() => { showDrumViewRef.current = showDrumView }, [showDrumView])
  useEffect(() => { localStorage.setItem('wtf_monoColor', JSON.stringify(monoColor)) }, [monoColor])
  useEffect(() => { if (isListening) listenStartRef.current = Date.now() }, [isListening])

  // ── BPM estimation from onset timestamps ─────────────────────────────────────
  const [bpm, setBpm]           = useState(null)
  const onsetTimestampsRef      = useRef([])
  const bpmSmoothRef            = useRef(null)

  // ── Loop station ─────────────────────────────────────────────────────────────
  const {
    slots,
    masterLen,
    setStream:     loopSetStream,
    handleSlotClick,
    commitTrim,
    cancelRecord,
    retrimSlot,
    deleteSlot,
    setVolume:      loopSetVolume,
    addSlot:        loopAddSlot,
    audioCtxRef:    loopAudioCtxRef,
    masterStartRef: loopMasterStartRef,
    masterLenRef:   loopMasterLenRef,
  } = useLoopEngine(bpm)

  // ── Key: auto-detected + optional lock ───────────────────────────────────────
  const [keyInfo, setKeyInfo]     = useState(null)     // auto-detected
  const [lockedKey, setLockedKey] = useState(null)     // { root, mode } or null
  useEffect(() => { lockedKeyRef.current = lockedKey }, [lockedKey])
  const [lockRoot, setLockRoot]   = useState('A')
  const [lockMode, setLockMode]   = useState('minor')

  const effectiveKey = lockedKey ?? keyInfo

  // ── Chord state ───────────────────────────────────────────────────────────────
  const [chordHistory, setChordHistory]               = useState([])
  const [detectedProgression, setDetectedProgression] = useState(null)
  const [selectedChord, setSelectedChord]             = useState(null)

  // ── Jam Roulette (task L-60, jam-roulette.md) — pure UI/display state ─────────
  // seedInfo: provenance of an unconfirmed rolled loop { styleLabel, name, bars }
  // (null once live detection confirms or replaces it). Invariant (§3.5):
  // seedInfo !== null  ⇔  progressionVoteRef.current?.seeded === true.
  const [seedInfo, setSeedInfo]             = useState(null)
  const [rouletteMenuOpen, setRouletteMenuOpen] = useState(false)

  // ── Top key candidates (shown as quick-lock chips) ────────────────────────────
  const [topKeyCandidates, setTopKeyCandidates] = useState([])

  // ── Internal refs ─────────────────────────────────────────────────────────────
  const noteHistoryRef  = useRef([])
  const keyVotesRef     = useRef([])
  const effectiveKeyRef = useRef(null)
  const chromaRingRef = useRef(
    Array.from({ length: DEFAULTS.chromaSmooth }, () => new Float32Array(12))
  )
  const chromaIdxRef         = useRef(0)
  const chordVotesRef        = useRef([])
  const progressionVoteRef   = useRef(null)
  const progressionMissRef   = useRef(0)
  const pendingKeyRef        = useRef(null)
  // Roulette session memory (UI-state refs, never read by audio code): the last
  // 6 rolled progression ids (no-repeat), the last rolled root pc (§2), and the
  // last resolved style id (for the "Re-roll — {style}" row).
  const rouletteMemoryRef    = useRef([])
  const prevRootPcRef        = useRef(null)
  const lastRolledStyleRef   = useRef(null)
  const rouletteRef          = useRef(null)

  // Keep refs in sync
  useEffect(() => { effectiveKeyRef.current = effectiveKey }, [effectiveKey])

  // Re-init chroma ring when chromaSmooth changes
  useEffect(() => {
    chromaRingRef.current = Array.from(
      { length: config.chromaSmooth },
      () => new Float32Array(12)
    )
    chromaIdxRef.current = 0
  }, [config.chromaSmooth])

  // ── Progression commit layer (task L-31) ─────────────────────────────────────
  // Runs once per chord commit. progressionVoteRef holds
  // { committedKey, candidateKey, candidateCount } — null until first evidence.
  //
  // Thresholds are in chord-commits (one detector run each):
  //  · COMMIT_VOTES = 2  — first commit needs 2 consecutive identical detections
  //    (≈ one bar). Post-L-30 detection is stable on clean loops so this lands
  //    immediately; a noisy 2-rep history flaps through data-faithful sub-cycles
  //    that never repeat twice in a row, so noise can't commit early.
  //  · REPLACE_VOTES = 3 — replacing a committed loop needs 3 consecutive
  //    detections of the SAME new loop: one transient detection (or an
  //    alternating flap) must never displace the loop the musician is still in;
  //    a genuine section change is detected consistently and just lands one
  //    commit later than a first commit would.
  //  · NULL_CLEAR = 6    — the detector only returns null once the loop has
  //    aged out of its 32-commit window (it needs 2 exact in-window
  //    occurrences): traced, that is ~28 commits of foreign material after
  //    the loop last played. Fills, turnarounds and window-boundary resumes
  //    yield non-null sub-cycle detections rather than nulls (traced), so
  //    they can NEVER clear a committed loop — a new established loop
  //    replaces via REPLACE_VOTES instead. A null run therefore means the
  //    jam truly left loop-land ~30 commits ago; 6 more (≈ two bars of
  //    structureless playing) confirms it wasn't a flicker before the
  //    display goes dark. (The old value 4 was sized as if nulls happened
  //    during fills — post-L-30 they don't.)
  const COMMIT_VOTES  = 2
  const REPLACE_VOTES = 3
  const NULL_CLEAR    = 6
  useEffect(() => {
    const detected = detectRepeatingProgression(chordHistory)
    const vote = progressionVoteRef.current
    if (!detected) {
      progressionMissRef.current++
      // L-60 flag 1 (§3.4): a SEEDED card is an instruction, not an observation —
      // ramp-up nulls (every seed's own effect run is miss 1, and no detection can
      // land before commit 6) must NOT wipe it. It stays until confirmed, replaced
      // by a consistently-detected different loop, re-rolled, or New Song.
      if (progressionMissRef.current >= NULL_CLEAR && !vote?.seeded) {
        setDetectedProgression(null)
        progressionVoteRef.current = null
      }
      return
    }
    progressionMissRef.current = 0 // any detected structure keeps the committed loop alive
    const key = detected.join(',')

    if (vote && vote.committedKey === key) {
      // Agreement with the committed loop — refresh it, drop any pending rival.
      setDetectedProgression(detected)
      vote.candidateKey = null
      vote.candidateCount = 0
      // L-60 (§3.4): the seed is now a normal committed loop — the first agreeing
      // live detection confirms it; drop the provenance flag + chip.
      if (vote.seeded) { vote.seeded = false; setSeedInfo(null) }
      return
    }

    const committedKey = vote ? vote.committedKey : null
    if (vote && vote.candidateKey === key) {
      vote.candidateCount++
    } else {
      // L-60 flag 3 (§3.4): preserve `seeded` across candidate rebuilds — a
      // transient ghost sub-cycle must not strip the flag and resurrect flag 1's
      // ramp-up kill through the side door.
      progressionVoteRef.current = { committedKey, candidateKey: key, candidateCount: 1, seeded: vote?.seeded ?? false }
    }
    if (progressionVoteRef.current.candidateCount >= (committedKey ? REPLACE_VOTES : COMMIT_VOTES)) {
      setDetectedProgression(detected)
      progressionVoteRef.current = { committedKey: key, candidateKey: null, candidateCount: 0 }
      // L-60 (§3.4/§3.5): a genuinely different loop replaced the seed — the new
      // vote is detection-owned; end the seed provenance.
      setSeedInfo(null)
    }
  }, [chordHistory])

  // ── New song — full reset ─────────────────────────────────────────────────────
  function newSong() {
    const cfg = configRef.current
    noteHistoryRef.current     = []
    keyVotesRef.current        = []
    chordVotesRef.current      = []
    progressionVoteRef.current = null
    progressionMissRef.current = 0
    pendingKeyRef.current      = null
    chromaIdxRef.current       = 0
    chromaRingRef.current      = Array.from({ length: cfg.chromaSmooth }, () => new Float32Array(12))
    onsetTimestampsRef.current = []
    bpmSmoothRef.current       = null
    listenStartRef.current     = Date.now()
    setKeyInfo(null)
    setLockedKey(null)
    effectiveKeyRef.current    = null
    setChordHistory([])
    setDetectedProgression(null)
    setSeedInfo(null) // L-60 (§3.6): the seed clears with the full reset
    setTopKeyCandidates([])
    setBpm(null)
    setMicError(null)
    setDebugChroma(null)
    setDebugCandidates([])
    setDebugNoteAnalysis(null)
    setDebugWaveform(null)
  }

  // ── Key lock handlers ─────────────────────────────────────────────────────────
  function applyLock() {
    const info = { root: lockRoot, mode: lockMode, confidence: 1 }
    setLockedKey(info)
    effectiveKeyRef.current = info
    chordVotesRef.current = []
  }

  function quickLock({ root, mode, confidence }) {
    const info = { root, mode, confidence }
    setLockedKey(info)
    effectiveKeyRef.current = info
    chordVotesRef.current = []
  }

  function removeLock() {
    setLockedKey(null)
    effectiveKeyRef.current = keyInfo
  }

  // ── Jam Roulette (task L-60, jam-roulette.md §2/§3.1) ────────────────────────
  // Rolls a random key + interesting KB progression and seeds the EXACT state
  // live detection writes (lockedKey + detectedProgression + a committed-shape
  // progressionVoteRef), so the whole dashboard populates as if detected. All
  // randomness is here (plain Math.random, no audio contact); inputs = the KB
  // registry only. `styleId === 'surprise'` picks uniformly over the 10 styles.
  function rollJam(styleId) {
    const pool = buildRoulettePool(kb) // lazy memo — round-trip passers, len 2–8
    const sid = styleId === 'surprise'
      ? Object.keys(kb)[Math.floor(Math.random() * Object.keys(kb).length)]
      : styleId
    const members = pool.byStyle.get(sid) ?? []
    if (!members.length) return

    // No-repeat memory (§2.2): exclude the last 6 rolled ids; if that empties the
    // pool (small styles), fall back to excluding only the immediately previous.
    const mem = rouletteMemoryRef.current
    let candidates = members.filter(m => !mem.includes(m.id))
    if (!candidates.length) {
      const prev = mem[mem.length - 1]
      candidates = members.filter(m => m.id !== prev)
      if (!candidates.length) candidates = members
    }

    // Weighted draw: weight = levelW × lenW (§2.2). Intermediate leans in (×2),
    // the collapsed "4-bar-ish" sweet spot 3–7 leans in (×2).
    const weightOf = (m) => {
      const levelW = m.progression.level === 'intermediate' ? 2 : 1
      const lenW = (m.collapsedLen >= 3 && m.collapsedLen <= 7) ? 2 : 1
      return levelW * lenW
    }
    const totalW = candidates.reduce((s, m) => s + weightOf(m), 0)
    let r = Math.random() * totalW
    let picked = candidates[candidates.length - 1]
    for (const m of candidates) { r -= weightOf(m); if (r <= 0) { picked = m; break } }
    const prog = picked.progression

    // Root: uniform over 12 pcs, SHARP spelling (§2.1 — only sharp names
    // string-match live detection); don't repeat the previous roll's root.
    let rolledPc = Math.floor(Math.random() * 12)
    if (prevRootPcRef.current != null && rolledPc === prevRootPcRef.current) {
      rolledPc = Math.floor(Math.random() * 12) // re-draw once
    }
    const loop = seedableLoop(prog, rolledPc)
    if (!loop) return // pool guarantees this, but stay defensive
    prevRootPcRef.current = rolledPc

    // ── The seed writes (§3.1) — clean slate, then key + loop + committed vote ──
    newSong() // §3.6: roulette = New Song + seed (a stale window poisons handoff)
    const info = { root: NOTES[rolledPc], mode: prog.mode, confidence: 1 }
    setLockedKey(info)
    effectiveKeyRef.current = info // the quickLock precedent — detection uses it NOW
    chordVotesRef.current = []
    setDetectedProgression(loop)
    progressionVoteRef.current = {
      committedKey: loop.join(','), // the committed shape, L-31's own key
      candidateKey: null,
      candidateCount: 0,
      seeded: true, // the one flag L-60 adds (§3.4)
    }
    progressionMissRef.current = 0
    setSeedInfo({ styleLabel: kb[sid]?.meta?.label ?? sid, name: prog.name, bars: prog.bars })

    // Session bookkeeping (§2.2) — survives New Song deliberately.
    lastRolledStyleRef.current = sid
    mem.push(picked.id)
    while (mem.length > 6) mem.shift()
    setRouletteMenuOpen(false)
  }

  // Escape / click-outside closes the roulette menu; focus returns to the button.
  useEffect(() => {
    if (!rouletteMenuOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setRouletteMenuOpen(false)
        rouletteRef.current?.querySelector('button')?.focus()
      }
    }
    const onDown = (e) => { if (!rouletteRef.current?.contains(e.target)) setRouletteMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [rouletteMenuOpen])

  // ── Waveform handler: feeds oscilloscope / drum view ─────────────────────────
  const handleWaveform = useCallback((data) => {
    if (showDebugRef.current || showDrumViewRef.current) {
      setDebugWaveform({ ...data, onsets: [...onsetTimestampsRef.current] })
    }
  }, [])

  // ── Note handler: drives key detection (pitch-based) ──────────────────────────
  const handleNote = useCallback(({ pitchClass }) => {
    const cfg = configRef.current
    const history = noteHistoryRef.current
    history.push(pitchClass)
    if (history.length > cfg.noteHistorySize) history.shift()
    if (history.length < 10) return
    if (history.length % 5 !== 0) return

    const result = detectKey(history)
    setTopKeyCandidates(detectTopKeys(history))
    if (showDebugRef.current) {
      const analysis = getNoteHistoryAnalysis(history)
      analysis.sessionSecs = listenStartRef.current ? Math.floor((Date.now() - listenStartRef.current) / 1000) : 0
      setDebugNoteAnalysis(analysis)
    }
    if (result.confidence < 0.5) return

    const votes = keyVotesRef.current
    votes.push(`${result.root}_${result.mode}`)
    if (votes.length > cfg.keyVoteWindow) votes.shift()

    const counts = {}
    for (const v of votes) counts[v] = (counts[v] || 0) + 1
    const [winner, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]

    if (count >= cfg.keyVoteThreshold) {
      const [root, mode] = winner.split('_')
      const candidateKey = `${root}_${mode}`

      setKeyInfo(prev => {
        const currentKey = prev ? `${prev.root}_${prev.mode}` : null

        if (currentKey === candidateKey) {
          pendingKeyRef.current = null
          return { root, mode, confidence: result.confidence }
        }

        if (pendingKeyRef.current === candidateKey) {
          pendingKeyRef.current = null
          if (!lockedKeyRef.current) chordVotesRef.current = []
          return { root, mode, confidence: result.confidence }
        }

        pendingKeyRef.current = candidateKey
        return prev
      })
    }
  }, [])

  // ── Chroma handler: drives chord detection ────────────────────────────────────
  const handleChroma = useCallback((chroma, bassPC) => {
    const cfg = configRef.current
    const ring = chromaRingRef.current
    ring[chromaIdxRef.current % cfg.chromaSmooth] = chroma
    chromaIdxRef.current++
    if (chromaIdxRef.current % cfg.chromaSmooth !== 0) return

    const key = effectiveKeyRef.current
    if (!key) return

    const avg = new Float32Array(12)
    for (const frame of ring) for (let i = 0; i < 12; i++) avg[i] += frame[i]
    for (let i = 0; i < 12; i++) avg[i] /= cfg.chromaSmooth

    if (showDebugRef.current) {
      setDebugChroma([...avg])
      setDebugCandidates(getChordCandidates(avg, key, bassPC, 5))
    }

    // Stability gate — if chroma is still changing across frames, we're mid-transition.
    // Compute per-bin variance across the ring; bail if any bin is fluctuating heavily.
    let maxVar = 0
    for (let i = 0; i < 12; i++) {
      let v = 0
      for (const frame of ring) { const d = frame[i] - avg[i]; v += d * d }
      if (v / cfg.chromaSmooth > maxVar) maxVar = v / cfg.chromaSmooth
    }
    if (maxVar > 0.05) return

    const chord = matchChordFromChroma(avg, key, bassPC, false, cfg.chordMinScore)
    if (!chord) {
      chordVotesRef.current = []
      return
    }

    const votes = chordVotesRef.current
    votes.push(chord)
    if (votes.length > cfg.chordVoteThreshold) votes.shift()

    if (votes.length >= cfg.chordVoteThreshold && votes.every(v => v === votes[0])) {
      const winner = votes[0]
      setChordHistory(prev => {
        if (prev[prev.length - 1] === winner) return prev
        return [...prev.slice(-48), winner]
      })

      // Inject chord tones into note history to anchor key detection
      const chordPCs = getChordTones(winner)
        .map(n => NOTES.indexOf(n))
        .filter(i => i >= 0)
      const history = noteHistoryRef.current
      for (let j = 0; j < cfg.chordNoteBoost; j++) {
        for (const pc of chordPCs) history.push(pc)
      }
      while (history.length > cfg.noteHistorySize) history.shift()
    }
  }, [])

  // ── Onset handler: drives BPM estimation via tempo histogram ────────────────
  // Pairwise inter-onset intervals are folded into 55-220 BPM and vote in a
  // histogram. Works with drums, guitar, piano, or mixed — whatever fires most
  // consistently wins. Only updates when there's a clear peak (≥20% of votes).
  const handleOnset = useCallback(() => {
    const ts = onsetTimestampsRef.current
    ts.push(performance.now())
    if (ts.length > 64) ts.shift()
    if (ts.length < 4) return

    const recent = ts.slice(-24)
    const bins = new Float32Array(221)   // index = BPM (55–220)

    for (let i = 0; i < recent.length - 1; i++) {
      for (let j = i + 1; j < recent.length && j < i + 8; j++) {
        const ms = recent[j] - recent[i]
        if (ms < 140 || ms > 6000) continue

        // Fold interval into 55-220 BPM range (handles subdivisions & half-time)
        let beatMs = ms
        while (beatMs > 1091) beatMs /= 2
        while (beatMs < 273)  beatMs *= 2
        if (beatMs < 273 || beatMs > 1091) continue

        const bpm = Math.round(60000 / beatMs)
        if (bpm >= 55 && bpm <= 220) bins[bpm] += 1 / (j - i)  // weight closer pairs more
      }
    }

    // Find peak with ±1 BPM smoothing
    let best = 0, bestBpm = 0
    for (let b = 56; b <= 219; b++) {
      const s = bins[b - 1] + bins[b] + bins[b + 1]
      if (s > best) { best = s; bestBpm = b }
    }

    const total = bins.reduce((a, v) => a + v, 0)
    if (total < 1 || best / total < 0.2) return  // no clear consensus yet

    const prev = bpmSmoothRef.current
    bpmSmoothRef.current = prev === null ? bestBpm : 0.25 * bestBpm + 0.75 * prev
    setBpm(Math.round(bpmSmoothRef.current))
  }, [])

  const currentChord = chordHistory[chordHistory.length - 1]

  if (showSettings) {
    return (
      <Settings
        config={config}
        onChange={updateConfig}
        onClose={() => setShowSettings(false)}
        onReset={() => { setConfig(DEFAULTS); setMonoColor(false) }}
        monoColor={monoColor}
        onMonoColorChange={setMonoColor}
      />
    )
  }

  return (
    <div className={`min-h-screen bg-surface text-white p-3${jamView ? ' xl:h-screen xl:overflow-hidden xl:flex xl:flex-col' : ''}`}>

      {/* ── Header ── */}
      <header className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-accent">
            WhatTheFlat <span className="text-gray-600">&#9837;?</span> <span className="text-amber-400">- JamBuddy</span>
          </h1>
          <p className="text-xs text-gray-600">Real-time key detection for live jams</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full border border-border hover:border-gray-400 transition-all"
            title="Settings"
          >
            <img src={settingIcon} alt="Settings" className="w-5 h-5" style={{ filter: 'invert(1) opacity(0.75)' }} />
          </button>
          <button
            onClick={newSong}
            className="group px-5 py-2 rounded-full text-sm font-semibold border border-border text-gray-400 hover:text-gray-200 hover:border-gray-400 transition-all"
          >
            <span className="group-hover:hidden">New Song</span>
            <span className="hidden group-hover:inline">Clear History</span>
          </button>
          <button
            onClick={() => { setMicError(null); setIsListening(l => !l) }}
            className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-accent hover:bg-purple-600 text-white'
            }`}
          >
            {isListening ? 'Stop' : 'Start Listening'}
          </button>
        </div>
      </header>

      {/* ── Controls bar ── */}
      <div className="mb-2 flex flex-wrap gap-2 items-center p-2 bg-panel border border-border rounded-xl">

        {/* Instrument select */}
        <div className="relative">
          <select
            value={instrument}
            onChange={e => setInstrument(e.target.value)}
            className="appearance-none bg-surface border border-border hover:border-gray-500 focus:border-accent focus:outline-none rounded-lg pl-3 pr-7 py-1 text-sm text-gray-200 cursor-pointer transition-colors"
          >
            <option value="piano">Piano</option>
            <option value="guitar">Guitar</option>
            <option value="bass">Bass</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▾</span>
        </div>

        {/* BPM badge */}
        {bpm && (
          <span className="px-3 py-1 bg-accent/10 border border-accent/30 rounded-lg text-sm text-accent font-mono tabular-nums">
            ♩ <span className="inline-block w-[3ch] text-right">{Math.round(bpm)}</span> <span className="text-accent/50 text-xs">BPM</span>
          </span>
        )}

        <div className="w-px h-5 bg-border shrink-0" />

        {lockedKey ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/20 border border-accent rounded-full">
            <span className="text-accent text-sm font-semibold shrink-0">🔒 {lockedKey.root}</span>
            <div className="relative">
              <select
                value={lockedKey.mode}
                onChange={e => {
                  const info = { ...lockedKey, mode: e.target.value }
                  setLockedKey(info)
                  effectiveKeyRef.current = info
                  chordVotesRef.current = []
                }}
                className="appearance-none bg-transparent text-accent text-sm font-semibold border-none outline-none cursor-pointer pr-4"
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="dorian">Dorian</option>
                <option value="mixolydian">Mixolydian</option>
                <option value="phrygian">Phrygian</option>
                <option value="lydian">Lydian</option>
              </select>
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-accent/60 text-xs">▾</span>
            </div>
            <button onClick={removeLock} className="text-xs text-accent/50 hover:text-accent transition-colors">
              unlock
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            {topKeyCandidates.map((k, i) => (
              <button
                key={i}
                onClick={() => quickLock(k)}
                className={`px-3 py-1 rounded-full text-sm font-semibold border transition-all ${
                  i === 0
                    ? 'border-accent text-accent hover:bg-accent/10'
                    : 'border-border text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }`}
              >
                {k.root} {k.mode === 'major' ? 'maj' : 'min'} · {Math.round(k.confidence * 100)}%
              </button>
            ))}
            {topKeyCandidates.length > 0 && <span className="text-gray-600 text-xs">or</span>}
            <div className="relative">
              <select
                value={lockRoot}
                onChange={e => setLockRoot(e.target.value)}
                className="appearance-none bg-surface border border-border hover:border-gray-500 focus:border-accent focus:outline-none rounded-lg pl-3 pr-7 py-1 text-sm text-gray-200 cursor-pointer transition-colors"
              >
                {NOTES.map(n => <option key={n}>{n}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▾</span>
            </div>
            <div className="relative">
              <select
                value={lockMode}
                onChange={e => setLockMode(e.target.value)}
                className="appearance-none bg-surface border border-border hover:border-gray-500 focus:border-accent focus:outline-none rounded-lg pl-3 pr-7 py-1 text-sm text-gray-200 cursor-pointer transition-colors"
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="dorian">Dorian</option>
                <option value="mixolydian">Mixolydian</option>
                <option value="phrygian">Phrygian</option>
                <option value="lydian">Lydian</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">▾</span>
            </div>
            <button
              onClick={applyLock}
              className="px-3 py-1 bg-accent/10 hover:bg-accent/20 border border-accent/40 hover:border-accent text-accent text-sm rounded-lg transition-all"
            >
              Lock key
            </button>
          </div>
        )}

        {/* ── Jam roulette (L-60, jam-roulette.md §1.1/§1.2) ── */}
        <div className="relative ml-auto" ref={rouletteRef}>
          <button
            type="button"
            onClick={() => setRouletteMenuOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={rouletteMenuOpen}
            aria-pressed={seedInfo ? true : undefined}
            title="Jam roulette — roll a random key + progression to jam on"
            className={`min-h-[32px] px-3 py-1 rounded-lg border text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              seedInfo
                ? 'border-accent/40 text-accent bg-accent/10 font-semibold'
                : 'border-border text-gray-200 hover:border-gray-500'
            }`}
          >
            🎲 Jam roulette
          </button>
          {rouletteMenuOpen && (
            <div
              role="menu"
              aria-label="Pick a genre to roll"
              className="absolute right-0 mt-1 w-56 bg-panel border border-border rounded-xl shadow-lg p-1 z-20"
            >
              {seedInfo && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => rollJam(lastRolledStyleRef.current)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-200 hover:bg-accent/10 border-b border-border outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  ⟳ Re-roll — {seedInfo.styleLabel}
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => rollJam('surprise')}
                className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-200 hover:bg-accent/10 border-b border-border outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                ✨ Surprise me
              </button>
              {Object.entries(kb).map(([id, s]) => (
                <button
                  key={id}
                  type="button"
                  role="menuitem"
                  onClick={() => rollJam(id)}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-200 hover:bg-accent/10 outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {s.meta?.label ?? id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Jam view toggle (L-50, one-screen.md §1.1) — layout-only ── */}
        <button
          type="button"
          onClick={jamView ? exitJamView : enterJamView}
          aria-pressed={jamView}
          title={jamView ? 'Exit jam view' : 'Jam view — the one-screen dashboard, fullscreen'}
          className={`ml-auto min-h-[32px] px-3 py-1 rounded-lg text-sm border transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            jamView
              ? 'bg-accent/20 border-accent text-accent font-semibold'
              : 'border-border text-gray-400 hover:border-gray-500 hover:text-gray-200'
          }`}
        >
          {jamView ? '✕ Exit' : '⛶ Jam view'}
        </button>
      </div>

      <AudioCapture
        onNote={handleNote}
        onChroma={handleChroma}
        onOnset={handleOnset}
        onWaveform={handleWaveform}
        isListening={isListening}
        minClarity={config.minClarity}
        minVolume={config.minVolume}
        audioDeviceId={config.audioDeviceId}
        onPermissionError={() => {
          setMicError(true)
          setIsListening(false)
        }}
        onStreamReady={loopSetStream}
      />

      {micError && (
        <div className="mb-2 px-4 py-3 rounded-xl border border-red-800 bg-red-900/20 text-sm text-red-400 flex items-center justify-between">
          <span>Microphone permission denied. Please allow microphone access in your browser or OS settings and try again.</span>
          <button onClick={() => setMicError(null)} className="ml-4 text-red-600 hover:text-red-400 text-lg leading-none">×</button>
        </div>
      )}

      {/* ── Chord detail modal ── */}
      <ChordDetailModal chord={selectedChord} onClose={() => setSelectedChord(null)} onChordClick={setSelectedChord} keyInfo={effectiveKey} chordHistory={chordHistory} />

      {/* ── Progression banner ── */}
      <ProgressionBanner
        chordHistory={chordHistory}
        keyInfo={effectiveKey}
        detectedProgression={detectedProgression}
        seedInfo={seedInfo}
        onChordClick={setSelectedChord}
      />

      {/* ── The jam dashboard grid (task L-50, one-screen.md §1/§6): JamGuide
          owns the two-column layout — LEFT: compact instrument view (chosen
          here, passed as the mainView slot) + licks strip + the related-
          progressions slot (RelatedProgressions, task L-51); RIGHT: the
          suggested-voicings rail. ProgressionSuggestions is unmounted (file
          kept) — its job split into the rail + RelatedProgressions per the
          user directive. Follows the one global instrument selector. ── */}
      <JamGuide
        detectedProgression={detectedProgression}
        keyInfo={effectiveKey}
        chordHistory={chordHistory}
        currentChord={currentChord}
        onFocusChord={setJamFocusChord}
        instrument={instrument}
        mainView={
          <>
            {instrument === 'guitar' && <Fretboard keyInfo={effectiveKey} currentChord={currentChord} pentatonicOnly={false} monoColor={monoColor} jamFocusChord={jamFocusChord} compact />}
            {instrument === 'bass'   && <BassFretboard keyInfo={effectiveKey} currentChord={currentChord} monoColor={monoColor} compact />}
            {instrument === 'piano'  && <Piano keyInfo={effectiveKey} currentChord={currentChord} monoColor={monoColor} compact />}
          </>
        }
        relatedSlot={
          <div className="flex flex-col gap-3">
            <TryThis
              loop={detectedProgression}
              keyInfo={effectiveKey}
              currentChord={currentChord}
              onChordClick={setSelectedChord}
              instrument={instrument}
            />
            <RelatedProgressions
              loop={detectedProgression}
              keyInfo={effectiveKey}
              onChordClick={setSelectedChord}
            />
          </div>
        }
        fill={jamView}
      />

      {/* ── Below the dashboard — the learning / behind-the-scenes area (page
          scroll in normal mode; UNMOUNTED in jam view, one-screen.md §1.1/§3:
          conditional mount, not `hidden`, so collapsed chrome can't leak
          height). ── */}
      {!jamView && (
      <>
      {/* ── Loop station ── */}
      <LoopStation
        slots={slots}
        bpm={bpm}
        masterLen={masterLen}
        audioCtxRef={loopAudioCtxRef}
        masterStartRef={loopMasterStartRef}
        masterLenRef={loopMasterLenRef}
        onSlotClick={handleSlotClick}
        onCommitTrim={commitTrim}
        onCancelRecord={cancelRecord}
        onRetrim={retrimSlot}
        onDelete={deleteSlot}
        onVolumeChange={loopSetVolume}
        onAddSlot={loopAddSlot}
      />

      {/* ── Behind the scenes — collapsible ── */}
      <div className="mb-3 bg-panel border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowDebug(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-all"
        >
          <span>BEHIND THE SCENES</span>
          <span>{showDebug ? '▲' : '▼'}</span>
        </button>
        {showDebug && (
          <div className="border-t border-border p-4">
            <DebugView
              chroma={debugChroma}
              chordCandidates={debugCandidates}
              noteAnalysis={debugNoteAnalysis}
              waveform={debugWaveform}
              keyInfo={effectiveKey}
              currentChord={currentChord}
              instrument={instrument}
              monoColor={monoColor}
            />
          </div>
        )}
      </div>

      {/* ── Rhythm / drum analyser — collapsible ── */}
      <div className="mb-3 bg-panel border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowDrumView(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-all"
        >
          <span>RHYTHM ANALYSER</span>
          <span>{showDrumView ? '▲' : '▼'}</span>
        </button>
        {showDrumView && (
          <div className="border-t border-border p-4">
            <DrumView waveform={debugWaveform} bpm={bpm} />
          </div>
        )}
      </div>

      {/* ── Tuner — collapsible ── */}
      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowTuner(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-all"
        >
          <span>TUNER</span>
          <span>{showTuner ? '▲' : '▼'}</span>
        </button>
        {showTuner && <div className="border-t border-border"><Tuner /></div>}
      </div>

      {/* ── Knowledge Center — bottom browse & study dock (L-40, D-40 §5) ── */}
      <KnowledgeDock
        keyInfo={effectiveKey}
        chordHistory={chordHistory}
        currentChord={currentChord}
        onChordClick={setSelectedChord}
        instrument={instrument}
      />
      </>
      )}
    </div>
  )
}
