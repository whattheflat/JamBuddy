// ─── Chord audio preview engine (L-20) ────────────────────────────────────────
//
// A pure, React-free Web Audio module that AUDITIONS voicings — the sound behind
// the ▶ buttons in the Voicing Browser (D-21) and anywhere else the Knowledge
// Center wants a chord heard, not just seen.
//
// It owns ONE module-level, lazily-created AudioContext, spun up on the first
// play call (which, in the UI, is always a user gesture — required by browser
// autoplay policy). It NEVER touches the detection pipeline: no import from
// AudioCapture.jsx, audioService.js, or App.jsx, no analyser, no microphone.
// Playback goes straight to the speakers on its own context.
//
// ── ⚠ MIC-FEEDBACK CAVEAT (read before wiring a UI) ───────────────────────────
// This module plays chords out of the speakers. While the mic is live, the
// DETECTION pipeline (pitch + chroma analysers in AudioCapture) will HEAR this
// playback like any other sound in the room — a previewed voicing can vote into
// chord/key detection and pollute the session. UI callers should pause or
// ignore detection for the duration of a preview (roughly the `durMs` window
// after the last strummed note). Wiring that suppression is a FUTURE task —
// this module deliberately stays decoupled and just makes sound.
//
// ── Note space ────────────────────────────────────────────────────────────────
// All play functions take notes in the piano.js convention: absolute semitone
// positions where 0 = the C of the low displayed octave = C3 = MIDI 48
// (130.81 Hz). `pianoVoicing().notes` (0–36) drops straight in. Guitar shapes
// reach BELOW that anchor (open low E = E2 = MIDI 40 = note −8); negative
// values are legal input to `playVoicing` — only the renderers care about the
// 0–36 window, the synth maps any integer to its true frequency.
//
// ── Tone ──────────────────────────────────────────────────────────────────────
// Per note: two slightly-detuned triangle oscillators (a little chorus warmth)
// plus a quiet sine an octave up (shimmer), through a lowpass and a gain
// envelope (~20 ms soft attack, exponential release inside `durMs`). Simple,
// pleasant, no samples. A master compressor guards against clipping when many
// notes ring together.

// ─── Module state (the ONE lazy AudioContext) ─────────────────────────────────

let ctx = null // dedicated AudioContext — created on first play call only
let master = null // master gain → compressor → destination
const active = new Set() // live note handles: { g, oscs } — for stopAll()

const ATTACK_S = 0.02 // soft attack
const TAIL_S = 0.06 // oscillator stop margin after the envelope floor
const ENV_FLOOR = 0.0001 // exponential ramps can't reach 0
const MAX_NOTES = 12 // defensive cap on simultaneous scheduled notes

function ensureContext() {
  if (!ctx) {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext
    if (!AC) throw new Error('chordAudio: Web Audio API not available in this environment')
    ctx = new AC()

    master = ctx.createGain()
    master.gain.value = 0.9
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.knee.value = 24
    comp.ratio.value = 4
    master.connect(comp)
    comp.connect(ctx.destination)
  }
  // A suspended context (autoplay policy) resumes on the user-gesture play call.
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// ─── Pitch math ───────────────────────────────────────────────────────────────

const mod12 = (n) => ((n % 12) + 12) % 12

/**
 * noteToFreq(note) → frequency in Hz.
 *
 * `note` is an absolute position in the piano.js space (0 = C3 = MIDI 48).
 * Pure helper — exported so tests can verify the mapping without an
 * AudioContext. noteToFreq(0) ≈ 130.81 (C3), noteToFreq(21) = 440 (A4).
 */
export function noteToFreq(note) {
  return 440 * Math.pow(2, (note + 48 - 69) / 12)
}

// ─── Synthesis ────────────────────────────────────────────────────────────────

// Schedule one note: detuned triangle pair + octave sine → lowpass → envelope.
function scheduleNote(note, when, durMs, peakGain) {
  const freq = noteToFreq(note)
  const durS = Math.max(0.1, durMs / 1000)

  const g = ctx.createGain()
  g.gain.setValueAtTime(ENV_FLOOR, when)
  g.gain.linearRampToValueAtTime(peakGain, when + ATTACK_S)
  g.gain.exponentialRampToValueAtTime(ENV_FLOOR, when + durS)

  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = Math.min(freq * 7, 5500) // keep it warm, not raw
  lp.Q.value = 0.4

  const partials = [
    { type: 'triangle', ratio: 1, detune: 0, level: 1.0 },
    { type: 'triangle', ratio: 1, detune: 6, level: 0.35 }, // +6 cents chorus
    { type: 'sine', ratio: 2, detune: 0, level: 0.18 }, // octave shimmer
  ]

  const oscs = partials.map((p) => {
    const osc = ctx.createOscillator()
    osc.type = p.type
    osc.frequency.value = freq * p.ratio
    osc.detune.value = p.detune
    const og = ctx.createGain()
    og.gain.value = p.level
    osc.connect(og)
    og.connect(lp)
    osc.start(when)
    osc.stop(when + durS + TAIL_S)
    return osc
  })

  lp.connect(g)
  g.connect(master)

  const handle = { g, oscs }
  active.add(handle)
  oscs[0].onended = () => active.delete(handle) // GC the handle when done
  return handle
}

// Release one handle now (quick fade, then hard-stop the oscillators).
function releaseHandle(handle, now) {
  try {
    handle.g.gain.cancelScheduledValues(now)
    handle.g.gain.setValueAtTime(Math.max(handle.g.gain.value, ENV_FLOOR), now)
    handle.g.gain.linearRampToValueAtTime(ENV_FLOOR, now + 0.04)
    for (const osc of handle.oscs) osc.stop(now + TAIL_S)
  } catch {
    // node already stopped — nothing to release
  }
  active.delete(handle)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * playVoicing(notes, opts?) → { stop() }
 *
 * Plays a voicing — the primary entry point. `notes` are absolute positions in
 * the piano.js space (0 = C3 = MIDI 48; `pianoVoicing().notes` drops straight
 * in; `guitarShapeToNotes(...)` output too, including its below-C3 negatives).
 *
 * @param {number[]} notes  absolute semitone positions (0 = C3)
 * @param {{strumMs?: number, durMs?: number, gain?: number}} [opts]
 *        strumMs — stagger between note onsets, low→high (default 30; 0 = block chord)
 *        durMs   — each note's envelope length (default 1800)
 *        gain    — overall loudness 0–1 (default 0.5), split across the notes
 * @returns {{ stop: () => void }} releases just THIS chord (stopAll() gets everything)
 *
 * First call creates the AudioContext — call from a user gesture (click).
 */
export function playVoicing(notes, opts = {}) {
  const { strumMs = 30, durMs = 1800, gain = 0.5 } = opts
  const clean = [...new Set((Array.isArray(notes) ? notes : []).filter(Number.isFinite))]
    .sort((a, b) => a - b)
    .slice(0, MAX_NOTES)
  if (clean.length === 0) return { stop() {} }

  ensureContext()
  const now = ctx.currentTime
  // Split the chord's loudness across its voices (sqrt: correlated-ish summing).
  const perNote = Math.min(0.6, gain / Math.sqrt(clean.length))

  const handles = clean.map((note, i) =>
    scheduleNote(note, now + (i * strumMs) / 1000, durMs, perNote)
  )
  return {
    stop() {
      if (!ctx) return
      const t = ctx.currentTime
      for (const h of handles) releaseHandle(h, t)
    },
  }
}

// Standard-tuning open-string MIDI numbers, strings [s6 … s1] = E2 A2 D3 G3 B3 E4.
// (voicings.js' OPEN holds the same strings as pitch classes; here we need real
// octaves to make sound, so the octaved values live here — same tuning, same order.)
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]

/**
 * guitarShapeToNotes(shape, opts?) → number[]
 *
 * Maps a guitar voicing to the shared absolute-note space (0 = C3 = MIDI 48) so
 * guitar shapes are playable via playVoicing. Low guitar strings sit BELOW C3,
 * so the result can contain negatives (open low E = −8) — legal for playback.
 * Returns sorted, deduped notes; [] for anything unrecognisable.
 *
 * Accepted shapes (everything voicings.js and the lick schema produce):
 *  1. `[{string, fret}, …]`          — note list (lick `tab` form); string 6 = low E,
 *                                      string 1 = high e; entries with a non-finite
 *                                      fret or string outside 1–6 are skipped.
 *  2. `{frets: [s6…s1]}`             — absolute frets, 'x'/null = muted. This is both
 *                                      voicings.js' open form and every resolved
 *                                      `getGuitarVoicings()` entry.
 *  3. `{rootStr, offsets: [s6…s1]}`  — voicings.js movable/barre form; offsets are
 *                                      fret distances from the root fret. Needs the
 *                                      key: pass `opts.rootPc` (0–11) to place it
 *                                      (falls back to shape.rootPc, then C).
 *
 * @param {Array|Object} shape
 * @param {{rootPc?: number}} [opts]  root pitch class for movable shapes
 * @returns {number[]} absolute notes (may be negative), sorted low→high
 */
export function guitarShapeToNotes(shape, opts = {}) {
  if (!shape) return []

  // Form 1: [{string, fret}, …]
  if (Array.isArray(shape)) {
    const notes = []
    for (const entry of shape) {
      const s = entry?.string
      const f = entry?.fret
      if (!Number.isFinite(s) || s < 1 || s > 6 || !Number.isFinite(f) || f < 0) continue
      notes.push(OPEN_STRING_MIDI[6 - s] + f - 48)
    }
    return [...new Set(notes)].sort((a, b) => a - b)
  }

  // Resolve the per-string absolute frets [s6…s1].
  let frets = null
  if (Array.isArray(shape.frets)) {
    // Form 2: open shape / resolved getGuitarVoicings entry.
    frets = shape.frets
  } else if (Array.isArray(shape.offsets) && Number.isFinite(shape.rootStr)) {
    // Form 3: movable shape — offsets relative to the root fret on rootStr.
    // rootStr: 6 = low E … 1 = high e → low-E-first index is 6 − rootStr
    // (the same convention ChordDiagram.jsx renders with).
    const idx = 6 - shape.rootStr
    if (idx < 0 || idx > 5) return []
    const rootPc = mod12(opts.rootPc ?? shape.rootPc ?? 0)
    const openPc = mod12(OPEN_STRING_MIDI[idx])
    const rootFret = mod12(rootPc - openPc)
    frets = shape.offsets.map((off) => (Number.isFinite(off) ? rootFret + off : 'x'))
    // Negative-offset shapes (e.g. the G shape) can dip below fret 0 near the
    // nut — slide the WHOLE shape up an octave rather than dropping strings.
    const finite = frets.filter(Number.isFinite)
    if (finite.length && Math.min(...finite) < 0) {
      frets = frets.map((f) => (Number.isFinite(f) ? f + 12 : f))
    }
  }
  if (!frets) return []

  const notes = []
  for (let i = 0; i < Math.min(6, frets.length); i++) {
    const f = frets[i]
    if (!Number.isFinite(f) || f < 0) continue // 'x' / muted / impossible
    notes.push(OPEN_STRING_MIDI[i] + f - 48)
  }
  return [...new Set(notes)].sort((a, b) => a - b)
}

/**
 * playChord(pcs, octave?, opts?) → { stop() }
 *
 * Simple fallback when all you have is a bare pitch-class set (e.g. a detected
 * chord's tones, no voicing). Stacks the pcs ASCENDING from the first pc, which
 * is treated as the bass: each subsequent pc lands in the nearest position
 * above the previous note — so [7, 11, 5] plays G4-B4-F5, a real shell, not a
 * scrambled cluster. `octave` places the bass (4 = the octave starting at
 * C4 = middle C; default 4; piano.js note = (octave − 3) * 12 + pc).
 *
 * @param {number[]} pcs     pitch classes 0–11, first entry = bass
 * @param {number} [octave]  bass octave (scientific pitch, default 4)
 * @param {{strumMs?: number, durMs?: number, gain?: number}} [opts] as playVoicing
 * @returns {{ stop: () => void }}
 */
export function playChord(pcs, octave = 4, opts = {}) {
  const clean = (Array.isArray(pcs) ? pcs : []).filter(Number.isFinite).map(mod12)
  if (clean.length === 0) return { stop() {} }

  const base = (octave - 3) * 12
  const notes = [base + clean[0]]
  for (let i = 1; i < clean.length; i++) {
    const prev = notes[i - 1]
    let n = base + clean[i]
    while (n <= prev) n += 12 // nearest position strictly above the last voice
    notes.push(n)
  }
  return playVoicing(notes, opts)
}

/**
 * stopAll()
 *
 * Immediately releases everything currently sounding or scheduled (quick 40 ms
 * fade to avoid clicks, then hard-stops the oscillators). Safe to call before
 * the first play (no-op) and repeatedly. Typical UI pattern: stopAll() before
 * each playVoicing so previews never layer.
 */
export function stopAll() {
  if (!ctx) return
  const now = ctx.currentTime
  for (const handle of [...active]) releaseHandle(handle, now)
  active.clear()
}
