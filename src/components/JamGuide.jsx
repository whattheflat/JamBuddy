import { useState, useMemo, useEffect } from 'react'
import kb from '../data/kb/index.js'
import { buildLoopIndex, matchLoopToProgression, findLoopPosition, chordRootPC } from '../lib/match'
import { NOTES, CHORD_TYPES } from '../lib/theory'
import GlanceRail, { AimDots, SoloLabel } from './GlanceRail'
import BassPatternCard from './BassPatternCard'
import VoicingBrowser from './VoicingBrowser'
import LickCard, { TechniqueLegend } from './LickCard'
import { ExploreSection, VoicingsSection, LevelChips } from './ExplorePanel'
import { pianoVoicingChain } from '../lib/piano'
import { parseChord } from '../lib/voicings'

// ─── JamGuide.jsx — the jam-grid OWNER + the Knowledge Center DOCK ───────────
//
// Task L-50 (per docs/design/one-screen.md §6) promoted the default export from
// "band" to the two-column jam dashboard grid:
//
//   default export `JamGuide`  — renders the xl: two-column flex region.
//     LEFT (flex-1): the `mainView` slot (App keeps choosing Fretboard /
//     BassFretboard / Piano — JamGuide never imports them), the LicksStrip,
//     and the `relatedSlot` (RelatedProgressions, mounted by App — null until
//     L-51). RIGHT (500px): the suggested-voicings rail — GlanceRail /
//     BassGuideRows / the heard-live fallback — inside the design's ONE
//     justified internal scroller (height-bounded, NOT sticky, §1). Below xl
//     the columns stack in jam-following order via display:contents + order
//     classes: mainView → rail → licks → related (§7; rail unbounds).
//     The `fill` prop (jam view, §1.1) swaps the rail's viewport-calc bound
//     for h-full and makes the left column a flex stack whose related slot
//     absorbs the remainder. The loop itself renders ONCE, in
//     ProgressionBanner (D-40 §2).
//   named export `KnowledgeDock` — the bottom collapsible browse/study area:
//     Explore / Voicings / Licks & Techniques + the shared level filter (the
//     old dock minus its jam section, which IS the band now).
//
// ONE instrument selector: App's global GUITAR/PIANO/BASS state (App.jsx:58)
// flows into both as the `instrument` prop — the old internal instrument tabs
// and the style-override tabs are gone (D-40 §3; dock sections keep their own
// style chips for browsing).

// Knowledge Center sections (D-20 §1, minus 'jam' — L-40/D-40 §5).
const SECTIONS = [
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
// Keep the two in sync by hand. Exported for the smoke drift guard
// (scripts/smoke.mjs §7 sweeps both copies against a pinned truth table —
// C-40 follow-up landed with L-40) and for BassPatternCard, which realizes
// SCHEMA.md bass-pattern degrees through the same contract (L-42; the import
// cycle JamGuide → BassPatternCard → JamGuide is benign — a hoisted function
// used only at render time).
export function resolveDegree(deg, quality) {
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

// ─── JamGuide — the jam dashboard grid (default export) ───────────────────────
//
// Props:
//   detectedProgression : string[] | null  — the live detected loop (chord names)
//   keyInfo             : { root, mode, confidence } | null  — effective key
//   chordHistory        : string[]          — committed chord history (playhead)
//   currentChord        : string | undefined — most recent committed chord
//   onFocusChord        : fn({rootPc,quality}|null) — Fretboard guide-tone link (D-03)
//   instrument          : 'guitar' | 'piano' | 'bass' — App's global selector
//   mainView            : JSX slot — the compact instrument view (App-chosen; L-50)
//   relatedSlot         : JSX slot — RelatedProgressions (App-mounted; null until L-51)
//   fill                : boolean — jam view (one-screen.md §1.1): the grid fills
//                         App's h-screen column; rail bound becomes h-full

// The band shows ALL levels — a glance surface filters nothing (D-40 §5); the
// level filter lives in the KnowledgeDock only.
const ALL_LEVELS = { foundation: true, intermediate: true }

export default function JamGuide({ detectedProgression, keyInfo, chordHistory = [], currentChord, onFocusChord, instrument = 'guitar', mainView = null, relatedSlot = null, fill = false }) {
  // Style labels straight from the KB registry, via each style's meta.
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

  // Style: always follow the matched style (the style-override tabs died with
  // the instrument tabs, D-40 §1 — browsing other styles lives in the dock's
  // own chips); nothing matched → styles[0] anchors the heard-live LicksStrip.
  const activeStyle = match.matched ? match.style : styles[0]?.id

  // Micro-header summary: matched progression name, or a listening hint.
  const matchedName = match.matched ? match.progression?.name : null
  const headerLabel = matchedName
    ? matchedName
    : (detectedProgression?.length ? 'mapping the changes…' : 'listening…')

  // ── Key root: keyInfo.root is a note NAME (e.g. "C"). ChordDiagram wants a
  // pitch class 0–11. Convert once; default to C (0) until a key is known so
  // the stations still resolve to *some* spelling. ──
  const keyRoot = useMemo(() => {
    const pc = chordRootPC(keyInfo?.root)
    return pc >= 0 ? pc : 0
  }, [keyInfo?.root])

  // ── Playhead reconciliation ────────────────────────────────────────────────
  // `position` from findLoopPosition is an index into the *detected* loop, which
  // can start on any rotation of the KB progression. The rail renders the
  // progression in *canonical KB order* (degrees[0] first). They differ by
  // `match.rotation` — the loop index that aligns with KB degrees[0]. To map a
  // detected-loop index back to its canonical station:
  //     canonicalPos = ((position − rotation) mod n + n) mod n
  // Worked example — KB blues-turnaround [I VI ii V] looped as [ii V I VI]:
  //   rotation = 2 (loop index 2 = the "I" = KB degrees[0]).
  //   Playhead on the V (detected index 1) → ((1 − 2) % 4 + 4) % 4 = 3 = the V's
  //   canonical station. NOW lands on the right station. ✓
  //   (ProgressionBanner highlights the same playhead on its own loop chips —
  //   the ONE loop display, D-40 §2.)
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
  // progression.degrees[i] (the same station order the rail renders). Each
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
  //   bass   → neither payload (both stay null): authored bass patterns flow
  //            through the separate `bassPlays` memo below into BassGuideRows
  //            (L-42) — the station entries carry identity only, exactly as in
  //            the pre-pack honest state (L-40 step 3, D-40 §3).
  const stationVoicings = useMemo(() => {
    if (!match.matched) return []
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
        // Fix (a) remap (jam-roulette.md §3.3.2): the RAW authored-play index this
        // (possibly collapsed) station reads from. Raw matches have no sourceIndex
        // → identity (i); collapsed matches carry the projection's map.
        sourceIndex: prog?.sourceIndex?.[i] ?? i,
      }
    })
    if (instrument === 'guitar') {
      const plays = kb[match.style]?.instruments?.guitar?.plays?.[prog?.id]
      const play = Array.isArray(plays) ? plays[0] : null
      const chords = play?.chords ?? []
      for (let i = 0; i < stations.length; i++) {
        stations[i].shape = chords[stations[i].sourceIndex ?? i]?.shape ?? null
      }
    } else if (instrument === 'piano') {
      // Authored piano pack first (L-24): the matched style's first piano play
      // for this progression, per-chord recipes resolved via recipeVoicing.
      const pianoPlays = kb[match.style]?.instruments?.piano?.plays?.[prog?.id]
      const play = Array.isArray(pianoPlays) && pianoPlays.length ? pianoPlays[0] : null
      const authored = play
        ? stations.map((st, i) => recipeVoicing(play.chords?.[st.sourceIndex ?? i]?.recipe, st.rootPc, st.quality))
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

  // ── Authored bass plays (L-42) ──────────────────────────────────────────────
  // When the matched style ships a bass pack with plays for this progression,
  // BassGuideRows renders each play's per-station pattern card in the gallery
  // slot (all plays side by side, the D-30 gallery idiom); null keeps the
  // computed root·fifth·approach fallback — styles without a bass cell and the
  // heard-live path are unchanged.
  const bassPlays = useMemo(() => {
    if (!match.matched || instrument !== 'bass') return null
    const plays = kb[match.style]?.instruments?.bass?.plays?.[match.progression?.id]
    return Array.isArray(plays) && plays.length > 0 ? plays : null
  }, [match.matched, match.style, match.progression, instrument])

  // ── Focused station (D-41 — the L-33 pin, simplified per D-40 §4: with every
  // row always expanded there is nothing to hold open, so the gesture collapses
  // to a focus TOGGLE on the row header). Same JamGuide-owned state, same reset
  // effect, same onFocusChord emission as pinnedStation before it. ──
  const [focusedStation, setFocusedStation] = useState(null)
  // Reset the focus whenever the loop or style changes underneath us.
  useEffect(() => { setFocusedStation(null) }, [match.id, match.style, instrument])

  // ── Cross-link to the main Fretboard (D-03) ─────────────────────────────────
  // When a station is FOCUSED, report its {rootPc, quality} upward so the
  // Fretboard can light that chord's guide tones; clear (null) on unfocus. The
  // reset effect above sets focusedStation → null on loop/style/instrument
  // change, which flows through here and clears the highlight too. Guarded so
  // the component still works standalone (onFocusChord optional).
  // The playhead (auto-follow highlight) NEVER emits focus-chord — repainting
  // the player's fretboard uninvited every chord change would fight their own
  // key view (D-31 §2.6). Only the focus gesture reaches this effect.
  useEffect(() => {
    if (!onFocusChord) return
    const st = focusedStation != null ? stationVoicings[focusedStation] : null
    onFocusChord(st ? { rootPc: st.rootPc, quality: st.quality } : null)
  }, [focusedStation, stationVoicings, onFocusChord])

  // Clear the Fretboard highlight when JamGuide unmounts.
  useEffect(() => () => { onFocusChord?.(null) }, [onFocusChord])

  // Licks-strip context = the PLAYHEAD station (canonicalPos −1 → station 0).
  // The focus toggle aims the fretboard, not the strip — the strip keeps
  // re-sorting with the jam (D-31 §2.4).
  const contextStation = stationVoicings[canonicalPos >= 0 ? canonicalPos : 0] ?? null

  // ── The rail (right column at xl / second block stacked): the suggested-
  // voicings surface — GlanceRail, BassGuideRows, the heard-live gallery, or
  // the honest idle line (one-screen.md §3, §4). ──
  const railContent = match.matched ? (
    instrument === 'bass' ? (
      /* Bass rows (D-40 §3): authored pattern cards when the matched style
         ships a bass pack (L-42), computed roots/fifths/approaches as the
         honest fallback otherwise. The licks strip hides either way
         (guitar tab licks are noise to a bassist mid-jam). */
      <BassGuideRows
        stations={stationVoicings}
        activeIndex={canonicalPos}
        keyMode={keyInfo?.mode}
        plays={bassPlays}
      />
    ) : (
      /* The voicing rail — ALL stations expanded as vertical rows; the
         playhead only highlights (D-41, D-40 §4). */
      <GlanceRail
        stations={stationVoicings}
        activeIndex={canonicalPos}
        focusedIndex={focusedStation}
        onFocus={setFocusedStation}
        instrument={instrument}
        keyRoot={keyRoot}
        keyMode={keyInfo?.mode}
      />
    )
  ) : liveChord ? (
    /* No loop matched, but chords are committing (D-31 §2.3): a single
       "heard live" gallery, re-aimed on every chord commit. Auto-follow
       only — nothing plays by itself. Bass: D-40 §3's prose forbids guitar/
       piano galleries under BASS, so the live chord gets the same computed
       root/fifth line (no next chord → no approach) instead. */
    instrument === 'bass' ? (
      <BassGuideRows
        stations={[{ rootPc: liveChord.rootPc, quality: liveChord.type, label: currentChord, rn: '' }]}
        activeIndex={0}
        keyMode={keyInfo?.mode}
        live
      />
    ) : (
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
        <VoicingBrowser rootPc={liveChord.rootPc} quality={liveChord.type} show={instrument} dense />
      </section>
    )
  ) : (
    /* Nothing heard yet — one slim line (~40px): the idle rail must not
       waste dashboard space. */
    <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-gray-500">
      {detectedProgression?.length
        ? `Heard ${detectedProgression.join(' → ')} — no ${activeStyle} pattern matched yet; voicings follow the next chord that commits.`
        : 'Play a few bars — voicings and licks for your loop land here.'}
    </p>
  )

  // ── The licks strip (left column). Matched loops sort by the playhead
  // station; heard-live falls back to the live chord's quality key (e.g. a
  // "dom7" lick fits a live G7). Bass hides it (guitar tab licks are noise
  // to a bassist mid-jam); LicksStrip also hides itself when empty. ──
  const licksStrip = instrument !== 'bass' && match.matched ? (
    <LicksStrip
      styleId={activeStyle}
      levels={ALL_LEVELS}
      instrument={instrument}
      context={contextStation}
    />
  ) : instrument !== 'bass' && liveChord ? (
    <LicksStrip
      styleId={activeStyle}
      levels={ALL_LEVELS}
      instrument={instrument}
      context={{ rn: '', quality: liveChord.type, label: currentChord }}
    />
  ) : null

  // ── The grid (one-screen.md §1, §6): left flex-1 / right 500px at xl;
  // stacked below xl in jam-following order (mainView → rail → licks →
  // related) via display:contents on the left wrapper + order classes — one
  // mount per surface, no duplicates (§7). The rail wrapper is the design's
  // ONE justified internal scroller: height-bounded in normal mode, h-full
  // in jam view (`fill`), NOT sticky (§1). ──
  return (
    <section
      className={
        'mb-3 flex flex-col gap-3 xl:flex-row' +
        (fill ? ' xl:mb-0 xl:flex-1 xl:min-h-0' : ' xl:items-start')
      }
      aria-label="Jam Guide — follows the loop"
    >
      {/* LEFT — instrument view · licks · related progressions */}
      <div className={'contents xl:flex xl:flex-col xl:gap-3 xl:flex-1 xl:min-w-0' + (fill ? ' xl:min-h-0' : '')}>
        {mainView != null && (
          <div className={'order-1 xl:order-none min-w-0' + (fill ? ' xl:shrink-0' : '')}>
            {mainView}
          </div>
        )}
        {licksStrip != null && (
          <div className={'order-3 xl:order-none min-w-0' + (fill ? ' xl:shrink-0' : '')}>
            {licksStrip}
          </div>
        )}
        {relatedSlot != null && (
          <div className={'order-4 xl:order-none min-w-0' + (fill ? ' xl:flex-1 xl:min-h-0 xl:overflow-y-auto' : '')}>
            {relatedSlot}
          </div>
        )}
      </div>

      {/* RIGHT — the suggested-voicings rail (the one contained scroller) */}
      <div
        className={
          'order-2 xl:order-none min-w-0 xl:w-[500px] xl:shrink-0 xl:overflow-y-auto ' +
          (fill ? 'xl:h-full' : 'xl:max-h-[calc(100vh_-_1.5rem)]')
        }
      >
        {/* Micro-header — a line, not a button (D-40 §1: zero chrome) */}
        <h3 className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          Suggested voicings — {headerLabel}
          {match.matched && keyInfo?.root ? ` · in ${keyInfo.root} ${keyInfo.mode}` : ''}
        </h3>
        {railContent}
      </div>
    </section>
  )
}

// ─── BassGuideRows — the bass rail (L-40 step 3 + L-42, D-40 §3) ──────────────
//
// Two states, same row structure, header, and highlight (the D-40 §3 contract):
//
//  · AUTHORED (`plays` non-empty — the matched style ships a bass pack with
//    plays for this progression, L-42): each station's gallery slot renders
//    one BassPatternCard per play, side by side (the D-30 gallery idiom — all
//    of them visible, each with its own ▶). Approach pitches derive from the
//    NEXT station's root; the last station wraps to the first. The "authored
//    patterns coming" notice disappears; a per-play feel legend and the rail's
//    mic-feedback microcopy (there are ▶s now) render once instead.
//  · COMPUTED (`plays` null — styles without a bass cell, and heard-live):
//    the honest useful minimum, PURE ARITHMETIC on data the band already has
//    (no theory.js change): the ROOT, the FIFTH (root + 7), and the chromatic
//    APPROACH into the NEXT station's root ("approach: G♯ → A"), plus the ONE
//    rail-level notice.
//
// Both states keep the GlanceRail header anatomy (D-41, D-40 §3/§4 — chord +
// rn + solo-scale label + aim dots via GlanceRail's exported atoms): guide
// tones ARE the bassist's target notes; none of that education is instrument-
// specific.
//
//   stations    — [{ rootPc, quality, label, rn }] canonical KB order
//   activeIndex — playhead station (canonicalPos); -1 = none marked "now"
//   keyMode     — key mode name (soloScale's minor-key dominant nudge)
//   live        — heard-live single chord: no next chord, so no approach line
//   plays       — authored bass plays for the matched progression, or null
function BassGuideRows({ stations = [], activeIndex = -1, keyMode, live = false, plays = null }) {
  const n = stations.length
  if (n === 0) return null
  const hasPack = Array.isArray(plays) && plays.length > 0
  return (
    <section
      className="rounded-2xl border border-border bg-panel p-3"
      aria-label={
        hasPack
          ? 'Bass guide — authored patterns for this loop'
          : 'Bass guide — roots, fifths and approach notes'
      }
    >
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        {hasPack ? 'Bass · patterns for this loop' : 'Bass · roots, fifths & approaches'}
        {live ? ' · heard live' : ''}
      </h4>
      <div className="flex flex-col gap-2" role="list">
        {stations.map((st, i) => {
          const isNow = i === activeIndex
          const next = !live && n > 1 ? stations[(i + 1) % n] : null
          const fifthPc = (((st.rootPc + 7) % 12) + 12) % 12
          const approachPc = next ? (((next.rootPc + 11) % 12) + 12) % 12 : null
          return (
            <div
              key={i}
              role="listitem"
              aria-current={isNow ? 'true' : undefined}
              className={
                'rounded-lg border px-3 py-2 ' +
                (isNow ? 'border-accent bg-accent/10 ring-2 ring-accent' : 'border-border bg-surface')
              }
              style={{ opacity: isNow ? 1 : 0.85 }}
            >
              {/* Header line — visual parity with the GlanceRail rows. */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex min-h-[20px] items-center gap-2">
                  <span className="text-sm font-bold leading-none text-gray-100">{st.label}</span>
                  {st.rn && (
                    <span className="text-[9px] font-medium uppercase tracking-wide text-gray-400">
                      {st.rn}
                    </span>
                  )}
                </span>
                {isNow && (
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-accent">
                    now
                  </span>
                )}
                <SoloLabel rootPc={st.rootPc} quality={st.quality} keyMode={keyMode} />
                <AimDots rootPc={st.rootPc} quality={st.quality} />
              </div>
              {hasPack ? (
                /* The gallery slot (L-42): one realized pattern card per play,
                   side by side. The wrap mirrors the GlanceRail cell reflow —
                   rows wrap, never scroll horizontally (D-40 §4). */
                <div className="mt-1.5 flex flex-wrap items-stretch gap-2">
                  {plays.map((play, p) => (
                    <BassPatternCard
                      key={p}
                      rootPc={st.rootPc}
                      quality={st.quality}
                      nextRootPc={stations[(i + 1) % n].rootPc}
                      pattern={play?.chords?.[st.sourceIndex ?? i]?.pattern}
                      playLabel={play?.label}
                      feel={play?.feel}
                      note={play?.chords?.[st.sourceIndex ?? i]?.note}
                      chordLabel={st.label}
                    />
                  ))}
                </div>
              ) : (
                /* The computed line — the fallback gallery slot. */
                <p className="mt-1.5 text-xs text-gray-300">
                  root <span className="font-semibold text-gray-100">{NOTES[st.rootPc]}</span>
                  <span className="text-gray-600"> · </span>
                  fifth <span className="font-semibold text-gray-100">{NOTES[fifthPc]}</span>
                  {next && (
                    <>
                      <span className="text-gray-600"> · </span>
                      approach{' '}
                      <span className="font-semibold text-gray-100">
                        {NOTES[approachPc]} → {NOTES[next.rootPc]}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>
          )
        })}
      </div>
      {hasPack ? (
        <>
          {/* Per-play groove legend — feel is required schema data; position
              hint appended when authored. Rendered once, not per row. */}
          {plays.map((play, p) => (
            <p key={p} className="mt-2 text-[11px] text-gray-500">
              <span className="font-medium text-gray-400">{play?.label}</span>
              {play?.feel ? <> — {play.feel}</> : null}
              {play?.position ? <> · {play.position}</> : null}
            </p>
          ))}
          {/* Amber + mic microcopy — once for the whole rail (D-31 §2.5). */}
          <p className="mt-2 text-[11px] text-gray-500">
            Amber note = the approach into the next chord. ▶ previews play through
            your speakers — while the mic is live, detection may hear them. Nothing
            plays automatically.
          </p>
        </>
      ) : (
        /* ONE notice for the whole rail, not per row (D-40 §3). */
        <p className="mt-2 text-[11px] text-gray-500">
          Authored bass patterns are on the way (blues first) — meanwhile: roots,
          fifths, and the approach into the next chord.
        </p>
      )}
    </section>
  )
}

// ─── KnowledgeDock — the bottom browse & study collapsible (named export) ─────
//
// The old dock minus its jam section (that IS the band now, D-40 §5): Explore /
// Voicings / Licks & Techniques behind the pill nav, plus the shared
// foundation/intermediate level filter. Header is static — the live match label
// moved to the band's micro-header.
//
// Props:
//   keyInfo      : { root, mode, confidence } | null — effective key
//   chordHistory : string[] — feeds the Voicings quick-pick chips
//   currentChord : string | undefined — re-aims the Voicings picker
//   onChordClick : fn(chordName) — opens ChordDetailModal
//   instrument   : 'guitar' | 'piano' | 'bass' — App's global selector
export function KnowledgeDock({ keyInfo, chordHistory = [], currentChord, onChordClick, instrument }) {
  const [open, setOpen] = useState(false)

  // Active section + the shared level filter (Explore + Licks toolbars, D-20 §4).
  // Both levels on by default; both can never be off (last-chip tap is a no-op).
  const [section, setSection] = useState('explore')
  const [levels, setLevels] = useState({ foundation: true, intermediate: true })
  const toggleLevel = (key) => setLevels(prev => {
    const next = { ...prev, [key]: !prev[key] }
    return (next.foundation || next.intermediate) ? next : prev
  })

  // Style labels straight from the KB registry (LicksSection's chips).
  const styles = useMemo(
    () => Object.entries(kb).map(([id, style]) => ({ id, label: style?.meta?.label ?? id })),
    []
  )

  return (
    <div className="mb-3 bg-panel border border-border rounded-xl overflow-hidden">

      {/* ── Collapsed header bar (always visible; static label, D-40 §5) ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/5 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">🎸</span>
          <span className="text-sm font-semibold text-accent shrink-0">Knowledge Center</span>
          <span className="text-gray-600 shrink-0">—</span>
          <span className="text-sm text-gray-300 truncate">browse &amp; study</span>
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
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSection(s.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1 min-h-[32px] rounded-lg text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active
                      ? 'bg-accent/20 border border-accent text-accent font-semibold'
                      : 'border border-border text-gray-300 hover:border-gray-500 hover:text-gray-100'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* ── Explore — KB progression browser + famous progressions ── */}
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

          {/* ── Voicings — picker (follows live chord) → VoicingBrowser ── */}
          {section === 'voicings' && (
            <div className="flex-1 min-h-0 p-4 overflow-auto">
              <VoicingsSection
                keyInfo={keyInfo}
                chordHistory={chordHistory}
                currentChord={currentChord}
                instrument={instrument}
              />
            </div>
          )}

          {/* ── Licks & Techniques — per-style LickCard grid ── */}
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

