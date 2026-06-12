// Country/folk guitar pack. Shapes verified by note-spelling against:
// acousticguitar.com (boom-chuck, bass runs, Travis picking), fretjam.com
// (alternate bass map), hvbluegrass.org (the Lester Flatt G-run), premierguitar.com
// (double-stops), wernickmethod.org & drbanjo.com (jam etiquette), andyguitar.co.uk
// (train beat), untidymusic.com (anchor-finger folk chords).

// Open shapes — the genre's home. Render only when the chord root matches.
const OPEN_G_FOLK = { onlyRoot: 7, frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] }   // big ringing folk G
const OPEN_C = { onlyRoot: 0, frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] }
const OPEN_CADD9 = { onlyRoot: 0, frets: ['x', 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] }
const OPEN_D = { onlyRoot: 2, frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }
const OPEN_D7 = { onlyRoot: 2, frets: ['x', 'x', 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] }
const OPEN_A7 = { onlyRoot: 9, frets: ['x', 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] }
const OPEN_G7 = { onlyRoot: 7, frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] }
const OPEN_E = { onlyRoot: 4, frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] }
const OPEN_EM7 = { onlyRoot: 4, frets: [0, 2, 2, 0, 3, 3], fingers: [0, 1, 2, 0, 3, 4] }
const OPEN_AM = { onlyRoot: 9, frets: ['x', 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] }
const OPEN_F = { onlyRoot: 5, frets: ['x', 'x', 3, 2, 1, 1], fingers: [0, 0, 3, 2, 1, 1] }

// Movable barres — for when the capo can't save you.
const BARRE_MAJ_6 = { rootStr: 6, offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] }
const BARRE_MAJ_5 = { rootStr: 5, offsets: ['x', 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] }
const BARRE_MIN_6 = { rootStr: 6, offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] }
const BARRE_DOM7_6 = { rootStr: 6, offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] }
const BARRE_DOM7_5 = { rootStr: 5, offsets: ['x', 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] }

export default {
  styleIntro:
    'In a folk circle you accompany the singer; in a bluegrass jam you ARE the drums — bass notes on 1 and 3 (kick), crisp strums on 2 and 4 (snare), bass runs announcing every change, and the capo moving your open shapes to whatever key the singer holds up fingers for.',

  comping: [
    {
      label: 'Boom-chick (alternating bass)',
      rhythm: 'B . X . B . X .  — root bass, strum, 5th bass, strum',
      description: 'The engine: picked bass note (root on 1, fifth on 3 — each open chord has its alternation map), down-strum chick between. Add an up-strum after each chick for "boom chick-a".',
    },
    {
      label: 'Carter bass runs',
      rhythm: 'runs replace beats 3–4 before a change',
      description: 'G→C: walk G–A–B into the C. C→G: walk back down. G→D: G–A–B–C♯. The run tells the whole circle the change is coming — in bluegrass it\'s practically mandatory.',
    },
    {
      label: 'Travis picking',
      rhythm: 'thumb: steady quarters on alternating bass; fingers: syncopated treble',
      description: 'Thumb never stops (the §boom-chick map), index/middle pick G and B strings between, pinch on beat 1. Freight Train is the curriculum.',
    },
    {
      label: 'Train beat (Cash)',
      rhythm: 'D D U D U D U with accents on 2 & 4, half-muted',
      description: 'Strings damped just enough to fake a snare; keep the boom note clean, mute only the chicks. Folsom Prison at any tempo.',
    },
    {
      label: 'Waltz boom-chick-chick',
      rhythm: '3/4: B X X — bass, strum, strum',
      description: 'Bass note on 1, two strums after, alternating root/5th by bar. Tennessee Waltz, Amazing Grace — every jam has them.',
    },
  ],

  plays: {
    'country-145': [
      {
        label: 'Open G-family, boom-chick',
        level: 'intermediate',
        chords: [
          { shape: OPEN_G_FOLK, note: 'I — bass alternates low-E G / open-D D' },
          { shape: OPEN_G_FOLK, note: '' },
          { shape: OPEN_C, extensions: [], note: 'IV — bass: A-string C / low-E G' },
          { shape: OPEN_G_FOLK, note: 'walk back down C–B–A–G' },
          { shape: OPEN_G_FOLK, note: '' },
          { shape: OPEN_G_FOLK, note: '' },
          { shape: OPEN_D7, note: 'V7 — bass: open D / open A' },
          { shape: OPEN_G_FOLK, note: 'home, G-run on the phrase end' },
        ],
        tips: 'This is the key-of-G home position; for the singer\'s key, move the capo, not the shapes (A = capo 2, B♭ = capo 3, B = capo 4 — the G-run survives the capo, a barre kills it).',
      },
      {
        label: 'Barre shapes (capo-proof)',
        level: 'intermediate',
        chords: [
          { shape: BARRE_MAJ_6, note: 'I' },
          { shape: BARRE_MAJ_6, note: '' },
          { shape: BARRE_MAJ_5, note: 'IV — same fret, next string' },
          { shape: BARRE_MAJ_6, note: '' },
          { shape: BARRE_MAJ_6, note: '' },
          { shape: BARRE_MAJ_6, note: '' },
          { shape: BARRE_DOM7_5, note: 'V7 — two frets up from the IV' },
          { shape: BARRE_MAJ_6, note: '' },
        ],
        tips: 'For keys where no capo position gives you open strings. You lose the ringing folk voice — keep the alternating-bass right hand so you don\'t lose the genre.',
      },
    ],

    'country-folk-axis': [
      {
        label: 'Anchor-finger folk set',
        level: 'intermediate',
        chords: [
          { shape: OPEN_G_FOLK, note: 'I — ring+pinky stay planted on the top two strings' },
          { shape: OPEN_D, note: 'V' },
          { shape: OPEN_EM7, extensions: ['b7'], note: 'vi as Em7 — two fingers move, anchors hold' },
          { shape: OPEN_CADD9, extensions: ['9'], note: 'IV as Cadd9 — same anchors again' },
          { shape: OPEN_G_FOLK, note: '' },
          { shape: OPEN_D, note: '' },
          { shape: OPEN_CADD9, extensions: ['9'], note: '' },
          { shape: OPEN_CADD9, extensions: ['9'], note: 'two bars of IV — let it ring' },
        ],
        tips: 'The modern-folk G-family sound: the top two strings drone through every chord while two fingers do the changes. Wagon Wheel is capo 2 with exactly these grips.',
      },
      {
        label: 'Barre version',
        level: 'intermediate',
        chords: [
          { shape: BARRE_MAJ_6, note: 'I' },
          { shape: BARRE_MAJ_5, note: 'V' },
          { shape: BARRE_MIN_6, note: 'vi' },
          { shape: BARRE_MAJ_5, note: 'IV' },
          { shape: BARRE_MAJ_6, note: '' },
          { shape: BARRE_MAJ_5, note: '' },
          { shape: BARRE_MAJ_5, note: '' },
          { shape: BARRE_MAJ_5, note: '' },
        ],
        tips: 'When the song lands in a capo-hostile key. Lighten the left hand between strums — folk barres should breathe, not sustain like rock.',
      },
    ],

    'country-ragtime': [
      {
        label: 'Open C-family (Alice\'s Restaurant grips)',
        level: 'intermediate',
        chords: [
          { shape: OPEN_C, note: 'I' },
          { shape: OPEN_A7, note: 'VI7 — the ragtime surprise' },
          { shape: OPEN_D7, note: 'II7' },
          { shape: OPEN_G7, note: 'V7 — and the sled arrives home' },
        ],
        tips: 'Each dominant pulls into the next — lean on the bass notes (C→A→D→G is itself a circle of fifths) and the progression plays itself. Capo 2 = the Alice\'s Restaurant recording.',
      },
      {
        label: 'Barre circle',
        level: 'intermediate',
        chords: [
          { shape: BARRE_MAJ_6, note: 'I' },
          { shape: BARRE_DOM7_5, note: 'VI7' },
          { shape: BARRE_DOM7_6, note: 'II7' },
          { shape: BARRE_DOM7_5, note: 'V7' },
        ],
        tips: 'Roots alternate 6th and 5th strings around the circle, so the hand barely travels. Swing the strums — this family is ragtime\'s grandchild.',
      },
    ],

    'country-rising-sun': [
      {
        label: 'The Animals grips (6/8 arpeggios)',
        level: 'intermediate',
        chords: [
          { shape: OPEN_AM, note: 'i — arpeggiate low to high, one sweep per bar' },
          { shape: OPEN_C, note: 'III' },
          { shape: OPEN_D, note: 'IV — the borrowed Dorian colour' },
          { shape: OPEN_F, note: 'VI' },
          { shape: OPEN_AM, note: '' },
          { shape: OPEN_E, note: 'V — the harmonic-minor pull home' },
        ],
        tips: 'Six chords, one arpeggio pattern: bass note then climb the strings in 6/8. The D major is the chord that makes it haunting — don\'t flatten it to Dm.',
      },
      {
        label: 'Barre version',
        level: 'intermediate',
        chords: [
          { shape: BARRE_MIN_6, note: 'i' },
          { shape: BARRE_MAJ_6, note: 'III' },
          { shape: BARRE_MAJ_5, note: 'IV' },
          { shape: BARRE_MAJ_6, note: 'VI' },
          { shape: BARRE_MIN_6, note: '' },
          { shape: BARRE_MAJ_6, note: 'V' },
        ],
        tips: 'Keeps the climb available in any key — arpeggiate the barres rather than strumming them or the 6/8 lilt disappears.',
      },
    ],

    'country-bluegrass-cycle': [
      {
        label: 'G shapes, jam-circle standard',
        level: 'intermediate',
        chords: [
          { shape: OPEN_G_FOLK, note: 'I' },
          { shape: OPEN_C, note: 'IV — walk up G–A–B into it' },
          { shape: OPEN_G_FOLK, note: 'walk back down' },
          { shape: OPEN_D, note: 'V — chromatic walk G–A–B–C♯ if you\'re feeling it' },
        ],
        tips: 'Bluegrass keys are called in fiddle terms: A = capo 2, B = capo 4, all G shapes. Bass on 1 & 3 locks with the upright; your 2 & 4 strums ARE the snare — there is no drummer.',
      },
      {
        label: 'C shapes (for keys C, D via capo)',
        level: 'intermediate',
        chords: [
          { shape: OPEN_C, note: 'I' },
          { shape: OPEN_F, note: 'IV — small F, top four strings' },
          { shape: OPEN_C, note: '' },
          { shape: OPEN_G7, extensions: ['b7'], note: 'V played as V7 — the bluegrass default' },
        ],
        tips: 'The C family gives different bass runs (C–D–E into F) — worth owning both families so the capo choice is about the singer, not your habits.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'I / major vamps', scale: 'major', why: 'Major pentatonic is the country default — the Don Rich/Buck Owens sweetness.' },
      { over: 'I with attitude', scale: 'mixolydian', why: 'The "country composite": major pentatonic + the ♭3 blue note, always resolved up to the major 3rd.' },
      { over: 'i (minor folk)', scale: 'minor', why: 'Natural minor with the harmonic-minor leading tone saved for when the V chord arrives.' },
      { over: 'V7 / II7 (ragtime circle)', scale: 'mixolydian', why: 'Each dominant gets its own Mixolydian; target the 3rd of each as the circle turns.' },
    ],
    targetNotes:
      'Country fills are double-stops: 3rds on the G+B pair, 6ths on G+e (hybrid-picked for the snap), slid or hammered into chord tones on the beat. End phrases with the G-run — it is the genre\'s punctuation mark.',
    licks: [
      {
        over: 'country-bluegrass-cycle',
        description: 'THE G-run (Lester Flatt): the canonical bluegrass phrase-ending tag — hammer through the blue note and land on the open G chord on the downbeat.',
        tab: 'e|----------------------------3--\nB|----------------------------0--\nG|---------------------0------0--\nD|---------------0--2---------0--\nA|--0--h1--2------------------2--\nE|----------------------------3--\n    A  A#  B    D  E   G    (G chord on 1)',
        source: 'hvbluegrass.org "The Truth About the Lester Flatt G Run"; artistworks.com essential bluegrass licks',
      },
      {
        over: 'country-bluegrass-cycle',
        description: 'The original two-note Flatt run for flying tempos: E up to G at the phrase end — "an exclamation point at the end of a paragraph."',
        tab: 'G|--------0--   (open G)\nD|--2--------   (E)',
        source: 'hvbluegrass.org / nativeground.com (Flatt & Scruggs history)',
      },
    ],
  },
}
