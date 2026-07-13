// Funk guitar pack. Shapes verified by note-spelling against: justinguitar.com
// (E9 "the funk chord"), fundamental-changes.com (funk chords, JB E9-D9 accents),
// yourguitaracademy.com (Sex Machine pattern), musicradar.com (Nile Rodgers grips),
// ethanhein.com (Chameleon Dorian analysis), Wikipedia (Jimmy Nolen chicken scratch).

// 5th-string-root colour chords — the Nolen vocabulary.
const NINE = { rootStr: 5, offsets: ['x', 0, -1, 0, 0, 0], fingers: [0, 2, 1, 3, 3, 3] }       // R-3-♭7-9-5: THE funk chord
const THIRTEEN = { rootStr: 5, offsets: ['x', 0, -1, 0, 0, 2], fingers: [0, 2, 1, 3, 3, 4] }   // 9 grip, pinky takes 5→13
const NINESUS = { rootStr: 5, offsets: ['x', 0, 0, 0, 0, 0], fingers: [0, 1, 1, 1, 1, 1] }     // full barre: R-4-♭7-9-5
const HENDRIX = { rootStr: 5, offsets: ['x', 0, -1, 0, 1, 'x'], fingers: [0, 2, 1, 3, 4, 0] }  // 7♯9 — ♭3 grit over a dominant
const M9 = { rootStr: 5, offsets: ['x', 0, -2, 0, 0, 'x'], fingers: [0, 2, 1, 3, 4, 0] }       // R-♭3-♭7-9
const MAJ7_5 = { rootStr: 5, offsets: ['x', 0, 2, 1, 2, 'x'], fingers: [0, 1, 3, 2, 4, 0] }    // R-5-7-3

// 6th-string-root grips.
const M7_6 = { rootStr: 6, offsets: [0, 'x', 0, 0, 0, 'x'], fingers: [1, 0, 2, 3, 4, 0] }      // R-♭7-♭3-5 (the Le Freak Am7)
const M11_BARRE = { rootStr: 6, offsets: [0, 0, 0, 0, 0, 0], fingers: [1, 1, 1, 1, 1, 1] }     // one-finger m11 (D'Angelo)
const THIRTEEN_6 = { rootStr: 6, offsets: [0, 'x', 0, 1, 2, 'x'], fingers: [1, 0, 2, 3, 4, 0] } // R-♭7-3-13

// Top-4 fragments — above the bass, out of the keys' mid-range.
const M7_TOP4 = { rootStr: 1, offsets: ['x', 'x', 0, 0, 0, 0], fingers: [0, 0, 1, 1, 1, 1] }   // ♭7-♭3-5-R barre
const MAJ7_TOP4 = { rootStr: 1, offsets: ['x', 'x', 1, 1, 0, 0], fingers: [0, 0, 2, 3, 1, 1] } // 7-3-5-R

export default {
  styleIntro:
    'The funk guitarist is a percussionist who happens to know chords: the strumming arm plays constant sixteenths like a hi-hat, and the fret hand decides which of them speak. Play the gaps the bass leaves, keep voicings small and high, and serve The One.',

  comping: [
    {
      label: '16th-note scratch foundation',
      rhythm: '1e&a 2e&a 3e&a 4e&a — DUDU, never stops',
      description: 'Mute everything with the fret hand and strum constant sixteenths — pure percussion first. Voiced hits are added by pressing the chord only on chosen slots, releasing pressure immediately after (the choke).',
    },
    {
      label: 'Chicken scratch ("chika")',
      rhythm: 'muted down-up 16th pairs',
      description: 'Jimmy Nolen\'s signature: strings pressed just enough for a pitchless scratch, strummed near the bridge. The texture between the hits IS the part.',
    },
    {
      label: 'JB one-bar cell',
      rhythm: 'C x x x x x x x x x C x x x x x — hits on 1 and the &-of-3',
      description: 'Chord stab on the One (always the One), a second on the and-of-3, ghosts everywhere else. The school pattern behind a hundred James Brown grooves.',
    },
    {
      label: 'Sex Machine pattern',
      rhythm: '9 . . . 9 . . . 13 . . . . . . 9',
      description: 'I9 on beats 1 and 2, I13 on beat 3, an upstroke 9 at the bar\'s tail — the documented Eb9/Eb13 figure. The top note rocking 5↔13 is the hook.',
    },
    {
      label: 'Nile Rodgers selective 16ths',
      rhythm: 'arm = metronome; the pick chooses string groups',
      description: 'Down-up sixteenths never stop, whether or not strings are struck. Accents come from catching the bottom of the grip vs the top-3 fragment, plus fret-hand chucks. Built on what he doesn\'t play.',
    },
  ],

  plays: {
    'funk-one-chord': [
      {
        label: 'The Nolen cycle (9 → 13 → 9sus4)',
        level: 'intermediate',
        chords: [
          { shape: NINE, extensions: ['9'], note: 'I9 — the funk chord' },
          { shape: THIRTEEN, extensions: ['9', '13'], note: 'pinky stretches 5→13' },
          { shape: NINESUS, extensions: ['b7', '9'], note: 'one-finger barre — the lift' },
          { shape: NINE, extensions: ['9'], note: 'and home' },
        ],
        tips: 'Three grips, one fret position, zero chord changes — the whole arrangement is the top two strings breathing. Choke every hit; the scratch between them never stops.',
      },
      {
        label: 'Grit set (7♯9 stabs)',
        level: 'intermediate',
        chords: [
          { shape: HENDRIX, extensions: ['#9'], note: 'I7♯9 — major and minor third at once' },
          { shape: THIRTEEN, extensions: ['9', '13'], note: '' },
          { shape: NINESUS, extensions: ['b7', '9'], note: '' },
          { shape: NINE, extensions: ['9'], note: '' },
        ],
        tips: 'The ♯9 is the blues clash built into one grip — use it for the stabs you want to hurt, the clean 9 for the ones that groove. Sparser than the Nolen cycle: half the hits, twice the silence.',
      },
    ],

    'funk-dorian-vamp': [
      {
        label: 'Chameleon pair (m9 + 9)',
        level: 'intermediate',
        chords: [
          { shape: M9, extensions: ['9'], note: 'i9' },
          { shape: NINE, extensions: ['9'], note: 'IV9 — same fret region, one string set' },
        ],
        tips: 'Both grips share the A-string root region — the change is two fingers, not a position. Sixteenth scratch throughout; voice the chords only on the accents the bass leaves open.',
      },
      {
        label: 'D\'Angelo barre (m11 wash)',
        level: 'intermediate',
        chords: [
          { shape: M11_BARRE, extensions: ['11'], note: 'i11 — one finger, all six strings' },
          { shape: THIRTEEN_6, extensions: ['13'], note: 'IV13' },
        ],
        tips: 'The one-finger m11 is the deepest chord in funk for the least effort — lay it across and let the fret hand bounce for the rhythm. Keep it short; six strings of m11 sustained is soup.',
      },
    ],

    'funk-25-loop': [
      {
        label: 'Le Freak grips',
        level: 'intermediate',
        chords: [
          { shape: M7_6, note: 'ii7 — 6th-string root' },
          { shape: NINE, extensions: ['9'], note: 'V9 — 5th-string root, same position' },
        ],
        tips: 'The Chic move: full grip held, pick selecting string groups in constant 16ths. Freak out on the mutes, not the volume.',
      },
      {
        label: 'Smooth set (m9 + 13)',
        level: 'intermediate',
        chords: [
          { shape: M9, extensions: ['9'], note: 'ii9' },
          { shape: THIRTEEN, extensions: ['9', '13'], note: 'V13' },
        ],
        tips: 'The Stevie Wonder colour: 9ths on both sides of the loop. Push the V13 an eighth early every second bar and the loop starts to roll forward.',
      },
    ],

    'funk-bvii-move': [
      {
        label: 'One grip, whole-step slide',
        level: 'intermediate',
        chords: [
          { shape: NINE, extensions: ['9'], note: 'I9' },
          { shape: NINE, extensions: ['9'], note: '♭VII9 — two frets down, same grip' },
        ],
        tips: 'The E9→D9 figure: the move is the slide itself — keep light finger pressure during the shift so the landing speaks. Snap back up to the I ON the One.',
      },
      {
        label: 'Grit on the I, clean below',
        level: 'intermediate',
        chords: [
          { shape: HENDRIX, extensions: ['#9'], note: 'I7♯9' },
          { shape: NINE, extensions: ['9'], note: '♭VII9' },
        ],
        tips: 'Contrast as arrangement: the ♯9 bites on home, the plain 9 relaxes a whole step down. Save this pairing for the bridge or the last vamp out.',
      },
    ],

    'funk-smooth-loop': [
      {
        label: 'A-string roots (September set)',
        level: 'intermediate',
        chords: [
          { shape: MAJ7_5, note: 'IVmaj7' },
          { shape: M9, extensions: ['9'], note: 'iii9' },
          { shape: M9, extensions: ['9'], note: 'ii9 — whole grip down two frets' },
          { shape: M9, extensions: ['9'], note: 'back up' },
        ],
        tips: 'The loop is one m9 grip walking between iii and ii under a stationary maj7 anchor. Clean tone, light palm mute, hits shorter than you think.',
      },
      {
        label: 'Top-4 shimmer (with keys/horns)',
        level: 'intermediate',
        chords: [
          { shape: MAJ7_TOP4, note: 'IVmaj7 — top four strings only' },
          { shape: M7_TOP4, note: 'iii7 — one-finger barre' },
          { shape: M7_TOP4, note: 'ii7' },
          { shape: M7_TOP4, note: '' },
        ],
        tips: 'When keys and horns are present this register is yours and nothing below it. The barre fragments slide as one shape — think of it as playing the top of the arrangement, not chords.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'i7–IV7 vamps', scale: 'dorian', why: 'The whole vamp is one Dorian scale — Chameleon\'s entire harmony fits inside it. The natural 6 is the funk note.' },
      { over: 'I9 one-chord vamps', scale: 'mixolydian', why: 'Mixolydian plus the minor-pentatonic/blues blend — the 7♯9 chord literally spells that major/minor mix.' },
      { over: 'ii7–V9 loops', scale: 'dorian', why: 'Dorian on the ii covers both chords; it\'s the same dyad as the minor vamp heard from the ii.' },
      { over: 'maj7 loops', scale: 'major', why: 'Diatonic major/pentatonic — the EWF horn-line sweetness. Target 9ths and 6ths, not roots.' },
    ],
    targetNotes:
      'Funk solos are mostly chord fragments: the 3+♭7 tritone pair and the ♭7+9 pair of the 9 grip, slid in from a half-step below. Over static harmony, develop RHYTHM — state a short motif, displace it inside the 16th grid, add and remove ghosts. The harmony will not save you; the pocket will.',
    licks: [
      {
        over: 'funk-dorian-vamp',
        description: 'Cissy Strut main line (The Meters, 1969): a descending Cm7 arpeggio answered by double-stop stabs — upper-structure fragments of the i11.',
        tab: 'e|------------------|---------------6-6--5-5--\nB|------------------|---------------6-6--6-6--\nG|--5--3--0---------|---------------7-7--5-5--\nD|-----------1b-----|-------------------------\nA|--------------3---|--1--3--1--3-------------\n    C  Bb  G  Eb  C    Bb C  Bb C  (stab pairs)',
        source: 'The Meters, "Cissy Strut" (1969); spytunes.com & pianote.com analyses (Cm7 arpeggio construction)',
      },
    ],
  },

  // Structured licks (SCHEMA.md "Licks", task P-21). Written in the style's home
  // positions (E for the dominant vamps, D dorian for the minor vamps) but
  // key-agnostic in spirit — chordContext names the station.
  // Every pitch hand-verified: s6=E s5=A s4=D s3=G s2=B s1=e (+fret, mod 12).
  licks: [
    {
      // In E: root, ghost, ♭3 hammered to the 3, 5, ♭7, octave root — the
      // dominant arpeggio with the blues grit built in, played staccato.
      id: 'funk-nine-riff',
      name: 'Single-note dominant riff',
      level: 'foundation',
      chordContext: 'over the I9 one-chord vamp',
      techniques: ['ghost-note', 'hammer-on'],
      source: 'in the style of the James Brown-band single-note riffs ("Sex Machine" lineage); Fundamental Changes funk guitar lessons',
      tab: [
        { string: 6, fret: 0 },                              // E — root, on the One
        { string: 6, fret: 0, technique: 'ghost-note' },     // scratch — the 16th grid never stops
        { string: 6, fret: 3 },                              // G — ♭3 grit
        { string: 6, fret: 4, technique: 'hammer-on' },      // G♯ — the 3: the funk curl
        { string: 5, fret: 2 },                              // B — 5
        { string: 5, fret: 5 },                              // D — ♭7
        { string: 5, fret: 7 },                              // E — octave root; shift up to grab it
      ],
    },
    {
      // In E (♭VII = D): chromatic climb D–D♯–E back to the One, answered by the
      // 3+♭7 tritone stab straight out of the E9 grip (G♯+D).
      id: 'funk-chromatic-snapback',
      name: 'Chromatic snap-back to the One',
      level: 'intermediate',
      chordContext: '♭VII9 → I9, landing on the One',
      techniques: ['chromatic-approach', 'double-stop'],
      source: 'the E9→D9 vamp move ("Papa\'s Got a Brand New Bag" lineage); Fundamental Changes JB-style accent lessons',
      tab: [
        { string: 5, fret: 5 },                                  // D — the ♭VII's root
        { string: 5, fret: 6, technique: 'chromatic-approach' }, // D♯ — passing
        { string: 5, fret: 7 },                                  // E — the One
        { string: 4, fret: 6 },                                  // G♯ — the 3, from the 9-grip
        { string: 3, fret: 7, technique: 'double-stop' },        // D — the ♭7: tritone stab together
      ],
    },
    {
      // In D dorian: the ♭3+♭7 dyad (F+C) slid in from one fret below, answered
      // by the root+11 dyad (D+G) — the m11 wash as two-note stabs — and a ghost.
      id: 'funk-dorian-stabs',
      name: 'Dorian double-stop stabs',
      level: 'foundation',
      chordContext: 'over the i7/i9 Dorian vamp',
      techniques: ['double-stop', 'slide', 'ghost-note'],
      source: 'in the style of the Meters\' dyad stabs ("Cissy Strut" lineage) and the Jimmy Nolen scratch vocabulary',
      tab: [
        { string: 2, fret: 5 },                              // E — one fret below F
        { string: 3, fret: 4, technique: 'double-stop' },    // B — one fret below C (approach dyad)
        { string: 3, fret: 5, technique: 'slide' },          // C — the ♭7
        { string: 2, fret: 6, technique: 'double-stop' },    // F — the ♭3: the m7 pair lands
        { string: 3, fret: 7 },                              // D — root
        { string: 2, fret: 8, technique: 'double-stop' },    // G — the 11 on top: the m11 colour
        { string: 3, fret: 7, technique: 'ghost-note' },     // scratch — keep the grid breathing
      ],
    },
    {
      // In D dorian: 1 ♭3 4 5 →6 5 ♭7 1 — a single-note vamp line that leans on
      // the natural 6 (B over D), the note that makes Dorian sound like funk.
      id: 'funk-dorian-six-line',
      name: 'Dorian line leaning on the 6',
      level: 'intermediate',
      chordContext: 'over the i7–IV7 Dorian vamp',
      techniques: ['slide', 'vibrato'],
      source: 'the Dorian vamp language of "Chameleon" (Herbie Hancock) — see Ethan Hein\'s Chameleon analysis; a line in that style, not a transcription',
      tab: [
        { string: 5, fret: 5 },                          // D — 1
        { string: 5, fret: 8 },                          // F — ♭3
        { string: 4, fret: 5 },                          // G — 4
        { string: 4, fret: 7 },                          // A — 5
        { string: 4, fret: 9, technique: 'slide' },      // B — the natural 6, slid into
        { string: 4, fret: 7 },                          // A — 5
        { string: 3, fret: 5 },                          // C — ♭7
        { string: 3, fret: 7, technique: 'vibrato' },    // D — octave home
      ],
    },
  ],
}
