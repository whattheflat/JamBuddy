// CircleOfFifths — the Knowledge Center's live key map (task D-61).
//
// A read-only SVG circle of fifths for a jamming musician, not a textbook
// poster:
//
//   · Outer ring: the 12 major keys, C at 12 o'clock, fifths clockwise.
//     Each wedge carries its key-signature glyph (♮ / n♯ / n♭).
//   · Inner ring: the relative minors, aligned with their majors.
//   · LIVE: the detected/locked key (keyInfo = App's effectiveKey, flowing
//     through KnowledgeDock → ExploreSection) lights its wedge in accent; its
//     fifths neighbours (subdominant, dominant) and its relative get a soft
//     accent tier — the "safe keys to wander to" story with zero interaction.
//     Modal keys pick their ring by the mode's third (dorian/phrygian → the
//     minor ring), derived from theory.js SCALES — never re-derived here.
//   · The highlighted key's diatonic chords (theory.js getChordsInKey) are
//     listed beside the circle inline — no hover, no click required.
//   · OPTIONAL tap: any wedge previews that key's diatonics in the side panel
//     (dashed outline marks the previewed wedge; the live highlight never
//     moves). Tapping NEVER changes app key state — this surface is read-only.
//   · No key detected → neutral circle with honest microcopy.
//
// Purely presentational: props in ({ keyInfo, onChordClick }), nothing out.
// Keyboard: every wedge is a focusable button (Enter/Space previews); focus
// draws an explicit accent-soft stroke (SVG-safe — no reliance on box-shadow).
//
// Design tokens (tailwind.config.js) — literal here because SVG paint
// attributes can't read Tailwind classes (MiniPiano/Fretboard precedent):
// accent #a855f7, surface #0f0f0f, panel #1a1a1a, border #2a2a2a. No new
// colours: #c084fc is MiniPiano's established soft accent; greys are the
// Tailwind gray-300/400 already used across the app's SVGs.

import { useMemo, useState } from 'react'
import { NOTES, SCALES, getChordsInKey, toRomanNumeral } from '../lib/theory'
import { parseChord } from '../lib/voicings'

// ─── Token literals (SVG paint attrs; see header) ─────────────────────────────
const ACCENT      = '#a855f7'   // bg-accent — the live key wedge
const ACCENT_SOFT = '#c084fc'   // MiniPiano's soft accent — neighbour-tier text
const SURFACE     = '#0f0f0f'   // bg-surface — wedge gaps + text on accent (AA 4.84:1)
const PANEL       = '#1a1a1a'   // bg-panel — idle wedge fill
const BORDER      = '#2a2a2a'   // border-border — centre hub stroke
const TEXT_MAIN   = '#d1d5db'   // gray-300 — idle key names (11.4:1 on panel)
const TEXT_DIM    = '#9ca3af'   // gray-400 — signature glyphs, microcopy (6.4:1)

// ─── The circle, index 0 = 12 o'clock, fifths clockwise ───────────────────────
// Display spelling is the conventional poster mix (flats on the flat side);
// all LOGIC runs on pitch classes so detection's sharp spellings match fine.
const MAJOR_LABELS = ['C','G','D','A','E','B','F♯','D♭','A♭','E♭','B♭','F']
const MINOR_LABELS = ['Am','Em','Bm','F♯m','C♯m','G♯m','E♭m','B♭m','Fm','Cm','Gm','Dm']
const SIG_GLYPHS   = ['♮','1♯','2♯','3♯','4♯','5♯','6♯','5♭','4♭','3♭','2♭','1♭']

const majorPcAt = (i) => (i * 7) % 12            // wedge index → major tonic pc
const minorPcAt = (i) => (i * 7 + 9) % 12        // wedge index → relative minor pc
const majorIdxOf = (pc) => (pc * 7) % 12         // 7·7 ≡ 1 (mod 12): self-inverse
const minorIdxOf = (pc) => majorIdxOf((pc + 3) % 12)

const sigWords = (i) =>
  i === 0 ? 'no sharps or flats' : i <= 6 ? `${i} sharp${i > 1 ? 's' : ''}` : `${12 - i} flat${12 - i > 1 ? 's' : ''}`

// The MODE's parent major: the unique major scale whose pc-set equals the
// mode's pc-set — ITS signature is the mode's true signature (A dorian =
// G major's notes = 1♯, not A major's 3♯, and not the tonic wedge's glyph).
// Uniqueness proof: the diatonic pc-set has no transpositional symmetry, so
// its 12 transpositions are 12 DISTINCT 7-note sets — a given 7-note set can
// therefore equal AT MOST one of them. Every key-dropdown mode (major, minor,
// dorian, phrygian, lydian, mixolydian) is by definition a rotation of the
// diatonic set, so for all 6 modes × 12 roots exactly one parent major exists
// (existence: rotating the mode back to its parent). Non-heptatonic scales
// (pentatonics, blues) match none — we return null and the hub omits the
// signature line rather than guessing.
function parentMajorPc(tonicPc, scale) {
  const pcs = new Set(scale.map((s) => (tonicPc + s) % 12))
  if (pcs.size !== 7) return null
  const hits = []
  for (let p = 0; p < 12; p++) {
    if (SCALES.major.every((s) => pcs.has((p + s) % 12))) hits.push(p)
  }
  return hits.length === 1 ? hits[0] : null
}

// ─── Geometry (viewBox 0 0 300 300, centre 150) ───────────────────────────────
const CX = 150, CY = 150
const R_OUT = 142, R_MID = 96, R_IN = 58, R_HUB = 54

function pt(r, deg) {
  const t = (deg * Math.PI) / 180 // 0° = 12 o'clock, clockwise
  return `${(CX + r * Math.sin(t)).toFixed(2)},${(CY - r * Math.cos(t)).toFixed(2)}`
}

function wedgePath(i, r0, r1) {
  const a0 = i * 30 - 15, a1 = i * 30 + 15
  return `M ${pt(r1, a0)} A ${r1},${r1} 0 0 1 ${pt(r1, a1)} L ${pt(r0, a1)} A ${r0},${r0} 0 0 0 ${pt(r0, a0)} Z`
}

function labelXY(i, r) {
  const t = (i * 30 * Math.PI) / 180
  return { x: CX + r * Math.sin(t), y: CY - r * Math.cos(t) }
}

// ─── Diatonic chord chips (inline — the core, zero-click payload) ─────────────
function ChordChips({ root, mode, onChordClick }) {
  const chords = getChordsInKey(root, mode)
  if (!chords.length) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {chords.map((c) => {
        const rn = toRomanNumeral(c, root, mode)
        const inner = (
          <>
            <span>{c}</span>
            {rn && rn !== '?' && (
              <span className="text-[9px] font-normal opacity-60 leading-none mt-0.5">{rn}</span>
            )}
          </>
        )
        return onChordClick ? (
          <button
            key={c} type="button" onClick={() => onChordClick(c)}
            title={`Open ${c} voicings`}
            className="flex flex-col items-center px-2.5 py-1 rounded-lg border text-xs font-bold bg-panel border-border text-gray-300 transition-all outline-none hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent"
          >
            {inner}
          </button>
        ) : (
          <span key={c} className="flex flex-col items-center px-2.5 py-1 rounded-lg border text-xs font-bold bg-panel border-border text-gray-300">
            {inner}
          </span>
        )
      })}
    </div>
  )
}

// ─── The component ────────────────────────────────────────────────────────────
export default function CircleOfFifths({ keyInfo, onChordClick }) {
  const [preview, setPreview] = useState(null) // { ring, idx } | null — local only
  const [hot, setHot]         = useState(null) // 'ring-idx' hovered/focused wedge

  // Live key → ring + wedge index. Ring by the MODE'S THIRD (SCALES, theory.js):
  // minor/dorian/phrygian sit on the minor ring at their tonic — A minor (or
  // A dorian) lights the inner "Am" wedge, NOT outer C.
  const live = useMemo(() => {
    if (!keyInfo?.root) return null
    const pc = parseChord(keyInfo.root)?.rootPc
    if (pc == null) return null
    const mode = keyInfo.mode ?? 'major'
    const scale = SCALES[mode] ?? SCALES.major
    // Minor third AND no major third — a bare scale[2] === 3 check would
    // misfile the hexatonic blues scale [0,3,5,6,7,10] (carries both colours)
    // if it ever reached the key dropdown.
    const minorish = scale.includes(3) && !scale.includes(4)
    const parentPc = parentMajorPc(pc, scale)
    return {
      pc, mode,
      ring: minorish ? 'minor' : 'major',
      idx: minorish ? minorIdxOf(pc) : majorIdxOf(pc),
      // circle position of the mode's PARENT MAJOR → the true signature glyph
      sigIdx: parentPc == null ? null : majorIdxOf(parentPc),
    }
  }, [keyInfo])

  // Tier per wedge: 2 = the live key (accent), 1 = its safe neighbours
  // (subdominant · dominant on the same ring, relative on the other), 0 = idle.
  function tierOf(ring, idx) {
    if (!live) return 0
    if (live.ring === ring) {
      if (idx === live.idx) return 2
      if (idx === (live.idx + 1) % 12 || idx === (live.idx + 11) % 12) return 1
      return 0
    }
    return idx === live.idx ? 1 : 0
  }

  const isLiveWedge = (ring, idx) => live && live.ring === ring && live.idx === idx

  function tapWedge(ring, idx) {
    if (isLiveWedge(ring, idx)) { setPreview(null); return } // tapping home = back to live
    setPreview((p) => (p && p.ring === ring && p.idx === idx ? null : { ring, idx }))
  }

  // Build both rings' wedges; paint order = idle → neighbours → live → preview
  // → hot, so highlight strokes always win the shared edges.
  const wedges = []
  for (const ring of ['major', 'minor']) {
    const outer = ring === 'major'
    for (let idx = 0; idx < 12; idx++) {
      const tier = tierOf(ring, idx)
      const previewed = preview && preview.ring === ring && preview.idx === idx
      const id = `${ring}-${idx}`
      const name = outer ? MAJOR_LABELS[idx] : MINOR_LABELS[idx]
      const aria = outer
        ? `${name} major, ${sigWords(idx)}${tier === 2 ? ' — the live key' : ''}. Preview its chords.`
        : `${MINOR_LABELS[idx].replace(/m$/, '')} minor, relative of ${MAJOR_LABELS[idx]} major${tier === 2 ? ' — the live key' : ''}. Preview its chords.`
      wedges.push({
        ring, idx, id, tier, previewed, outer, aria,
        z: hot === id ? 5 : previewed ? 4 : tier + 1,
      })
    }
  }
  wedges.sort((a, b) => a.z - b.z)

  // Side panel: the previewed key wins the panel; the LIVE view stays complete
  // without any tap (live highlight + its chords render by default).
  // Preview title is spelled SHARP-side from NOTES, matching its chips:
  // getChordsInKey emits the app-wide sharp spelling (theory.js noteName), and
  // those names flow into onChordClick → ChordDetailModal, so re-spelling the
  // chips flat would add a divergent naming layer in front of the modal. One
  // spelling authority (NOTES) for title + chips + modal; the WEDGE keeps its
  // poster label (E♭) for at-a-glance reading.
  let shown = null
  if (preview) {
    const root = NOTES[preview.ring === 'major' ? majorPcAt(preview.idx) : minorPcAt(preview.idx)]
    const mode = preview.ring === 'major' ? 'major' : 'minor'
    shown = { root, mode, title: `${root} ${mode}`, isPreview: true }
  } else if (live) {
    shown = { root: keyInfo.root, mode: live.mode, title: `${keyInfo.root} ${live.mode}`, isPreview: false }
  }

  // Neighbour names for the live key (the tier-1 wedges, spelled out).
  const neighbours = live && {
    sub: (live.ring === 'major' ? MAJOR_LABELS : MINOR_LABELS)[(live.idx + 11) % 12],
    dom: (live.ring === 'major' ? MAJOR_LABELS : MINOR_LABELS)[(live.idx + 1) % 12],
    rel: (live.ring === 'major' ? MINOR_LABELS : MAJOR_LABELS)[live.idx],
    relWord: live.ring === 'major' ? 'relative minor' : 'relative major',
  }

  return (
    <section
      aria-label="Circle of fifths"
      className="p-3 bg-surface border border-border rounded-xl flex flex-wrap gap-x-5 gap-y-3 items-start"
    >
      {/* ── The circle ── */}
      <svg
        viewBox="0 0 300 300"
        role="group"
        aria-label={live
          ? `Circle of fifths, live key ${keyInfo.root} ${live.mode}`
          : 'Circle of fifths, no key detected yet'}
        className="w-[248px] max-w-full h-auto shrink-0 mx-auto select-none"
      >
        {/* wedges (paint-ordered) */}
        {wedges.map((w) => {
          const [r0, r1] = w.outer ? [R_MID, R_OUT] : [R_IN, R_MID]
          const stroke = hot === w.id ? ACCENT_SOFT : w.previewed ? ACCENT : SURFACE
          return (
            <path
              key={w.id}
              d={wedgePath(w.idx, r0, r1)}
              fill={w.tier === 0 ? PANEL : ACCENT}
              fillOpacity={w.tier === 1 ? 0.22 : 1}
              stroke={stroke}
              strokeWidth={hot === w.id || w.previewed ? 2 : 1.25}
              strokeDasharray={w.previewed && hot !== w.id ? '4 3' : undefined}
              role="button"
              tabIndex={0}
              aria-label={w.aria}
              aria-pressed={!!w.previewed}
              className="cursor-pointer outline-none"
              onClick={() => tapWedge(w.ring, w.idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapWedge(w.ring, w.idx) }
              }}
              onPointerEnter={() => setHot(w.id)}
              onPointerLeave={() => setHot((h) => (h === w.id ? null : h))}
              onFocus={() => setHot(w.id)}
              onBlur={() => setHot((h) => (h === w.id ? null : h))}
            />
          )
        })}

        {/* labels (own layer, never swallow clicks) */}
        {Array.from({ length: 12 }, (_, i) => {
          const tMaj = tierOf('major', i), tMin = tierOf('minor', i)
          const name  = labelXY(i, 123)
          const glyph = labelXY(i, 106)
          const minor = labelXY(i, 77)
          return (
            <g key={i} pointerEvents="none">
              <text x={name.x} y={name.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fontWeight="700"
                fill={tMaj === 2 ? SURFACE : tMaj === 1 ? ACCENT_SOFT : TEXT_MAIN}>
                {MAJOR_LABELS[i]}
              </text>
              <text x={glyph.x} y={glyph.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="8.5"
                fill={tMaj === 2 ? SURFACE : tMaj === 1 ? ACCENT_SOFT : TEXT_DIM}>
                {SIG_GLYPHS[i]}
              </text>
              <text x={minor.x} y={minor.y} textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontWeight={tMin === 2 ? '700' : '600'}
                fill={tMin === 2 ? SURFACE : tMin === 1 ? ACCENT_SOFT : TEXT_DIM}>
                {MINOR_LABELS[i]}
              </text>
            </g>
          )
        })}

        {/* centre hub — always the LIVE state (the glance anchor) */}
        <circle cx={CX} cy={CY} r={R_HUB} fill={SURFACE} stroke={BORDER} strokeWidth="1" />
        {live ? (
          <g pointerEvents="none">
            <text x={CX} y={CY - 10} textAnchor="middle" fontSize="14" fontWeight="800" fill={ACCENT}>
              {keyInfo.root} {live.mode}
            </text>
            {/* The MODE's signature (parent major), not the wedge's — A dorian
                reads "1♯ · G major's notes", matching the F♯ in its chips. */}
            {live.sigIdx != null && (
              <text x={CX} y={CY + 6} textAnchor="middle" fontSize="8.5" fill={TEXT_DIM}>
                {SIG_GLYPHS[live.sigIdx]} · {live.mode === 'major'
                  ? sigWords(live.sigIdx)
                  : `${MAJOR_LABELS[live.sigIdx]} major's notes`}
              </text>
            )}
            <text x={CX} y={CY + 21} textAnchor="middle" fontSize="8" fontWeight="700"
              letterSpacing="1.5" fill={ACCENT_SOFT}>
              LIVE
            </text>
          </g>
        ) : (
          <g pointerEvents="none">
            <text x={CX} y={CY - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill={TEXT_MAIN}>
              No key yet
            </text>
            <text x={CX} y={CY + 7} textAnchor="middle" fontSize="8.5" fill={TEXT_DIM}>
              play a few chords —
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" fontSize="8.5" fill={TEXT_DIM}>
              the circle lights up
            </text>
          </g>
        )}
      </svg>

      {/* ── Beside the circle: the highlighted key's diatonics, inline ── */}
      <div className="flex-1 min-w-[220px] flex flex-col gap-2.5">
        <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          Circle of fifths
        </h4>

        {shown ? (
          <>
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-white text-sm">{shown.title}</span>
              {shown.isPreview ? (
                <>
                  <span className="text-[9px] uppercase tracking-wide font-semibold text-amber border border-amber/40 rounded px-1.5 py-px">
                    preview
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreview(null)}
                    className="text-[11px] text-accent underline underline-offset-2 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    back to live
                  </button>
                </>
              ) : (
                <span className="text-[9px] uppercase tracking-wide font-semibold text-accent border border-accent/40 rounded px-1.5 py-px">
                  live
                </span>
              )}
            </div>

            <ChordChips root={shown.root} mode={shown.mode} onChordClick={onChordClick} />

            {!shown.isPreview && neighbours && (
              <p className="text-[11px] text-gray-400">
                Safe keys to wander to:{' '}
                <span className="text-accent font-semibold">{neighbours.sub}</span> (subdominant) ·{' '}
                <span className="text-accent font-semibold">{neighbours.dom}</span> (dominant) ·{' '}
                <span className="text-accent font-semibold">{neighbours.rel}</span> ({neighbours.relWord})
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">
            When a key is detected (or locked), its wedge lights up here with the chords that
            live in it. Tap any wedge to peek at another key meanwhile.
          </p>
        )}

        <p className="text-xs text-gray-400 leading-snug">
          Keys next to each other on the circle share six of their seven notes, so sliding one
          step — clockwise to the dominant, counter-clockwise to the subdominant — barely moves
          the ground under the band. The inner ring is each key&apos;s relative minor: the same
          notes with a darker home base. The further apart two keys sit, the bolder the jump sounds.
        </p>
      </div>
    </section>
  )
}
