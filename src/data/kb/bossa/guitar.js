// Bossa nova guitar pack. Grips verified by note-spelling against: jazzguitar.be
// (Ipanema chords), jenslarsen.nl (bossa patterns, 5 levels), thejazzpianosite.com
// (rhythm layers), Nelson Faria "The Brazilian Guitar Book" (canonical grip source),
// mdecksmusic.com (Ipanema analysis), jazz-circle.com (Blue Bossa, Black Orpheus).
//
// Construction: thumb takes the root on string 6 or 5; fingers take 3-4 notes on
// D-G-B(-e). Every grip movable. Two plays per progression = the two root-string
// sets, because that's how bossa voice-leads: adjacent chords trade root strings
// so inner voices move by one fret ("two fingers move, the chord transforms").

// Root on the low E string (thumb).
const M7_6 = { rootStr: 6, offsets: [0, 'x', 0, 0, 0, 'x'], fingers: [1, 0, 2, 3, 4, 0] }        // R-♭7-♭3-5
const MAJ7_6 = { rootStr: 6, offsets: [0, 'x', 1, 1, 0, 'x'], fingers: [1, 0, 3, 4, 2, 0] }      // R-7-3-5
const DOM7_6 = { rootStr: 6, offsets: [0, 'x', 0, 1, 0, 'x'], fingers: [1, 0, 2, 3, 4, 0] }      // R-♭7-3-5
const DOM13_6 = { rootStr: 6, offsets: [0, 'x', 0, 1, 2, 'x'], fingers: [1, 0, 2, 3, 4, 0] }     // R-♭7-3-13
const DOM7B9_6 = { rootStr: 6, offsets: [0, 'x', 0, 1, 0, 1], fingers: [1, 0, 2, 3, 1, 4] }      // R-♭7-3-5-♭9
const M7B5_6 = { rootStr: 6, offsets: [0, 'x', 0, 0, -1, 'x'], fingers: [2, 0, 3, 4, 1, 0] }     // R-♭7-♭3-♭5
const M6_6 = { rootStr: 6, offsets: [0, 'x', -1, 0, 0, 'x'], fingers: [2, 0, 1, 3, 4, 0] }       // R-6-♭3-5
const DIM7_6 = { rootStr: 6, offsets: [0, 'x', -1, 0, -1, 'x'], fingers: [2, 0, 1, 3, 1, 0] }    // R-♭♭7-♭3-♭5
const DOM7S11_6 = { rootStr: 6, offsets: [0, 'x', 0, 1, -1, 'x'], fingers: [2, 0, 3, 4, 1, 0] }  // R-♭7-3-♯11 (the tritone-sub grip)

// Root on the A string (thumb).
const M7_5 = { rootStr: 5, offsets: ['x', 0, 2, 0, 1, 'x'], fingers: [0, 1, 3, 2, 4, 0] }        // R-5-♭7-♭3
const M7_5C = { rootStr: 5, offsets: ['x', 0, -2, 0, 1, 'x'], fingers: [0, 2, 1, 3, 4, 0] }      // R-♭3-♭7-♭3 compact grab
const MAJ9_5 = { rootStr: 5, offsets: ['x', 0, -1, 1, 0, 'x'], fingers: [0, 2, 1, 4, 3, 0] }     // R-3-7-9
const DOM9_5 = { rootStr: 5, offsets: ['x', 0, -1, 0, 0, 'x'], fingers: [0, 2, 1, 3, 4, 0] }     // R-3-♭7-9
const DOM7B9_5 = { rootStr: 5, offsets: ['x', 0, -1, 0, -1, 'x'], fingers: [0, 3, 1, 4, 2, 0] }  // R-3-♭7-♭9
const M7B5_5 = { rootStr: 5, offsets: ['x', 0, 1, 0, 1, 'x'], fingers: [0, 1, 3, 2, 4, 0] }      // R-♭5-♭7-♭3
const M6_5 = { rootStr: 5, offsets: ['x', 0, -2, -1, -2, 'x'], fingers: [0, 4, 1, 3, 2, 0] }     // R-♭3-6-R
const DIM7_5 = { rootStr: 5, offsets: ['x', 0, 1, -1, 1, 'x'], fingers: [0, 2, 3, 1, 4, 0] }     // R-♭5-♭♭7-♭3

export default {
  styleIntro:
    'The bossa guitarist is the whole rhythm section: thumb plays the surdo drum (root on 1, fifth on 3, never syncopated), fingers play the chord block on the anticipations. Quiet is louder — the genre was invented at apartment volume, and intensity comes from rhythmic placement and harmonic colour, never from strumming harder.',

  comping: [
    {
      label: 'Thumb bass (the surdo)',
      rhythm: 'B . . . B . . .  — root on 1, fifth on 3',
      description: 'Metronomic, soft, every bar, under everything. The one layer that is never syncopated. With a bassist: drop it entirely and play only the upper notes.',
    },
    {
      label: 'One-bar starter pattern',
      rhythm: 'X . . X . . X .  — hits on 1, and-of-2, 4',
      description: 'The training-wheels comp: chord block on 1, the and-of-2, and 4 over the steady thumb. Master this before the two-bar pattern.',
    },
    {
      label: 'Two-bar João Gilberto pattern',
      rhythm: 'X . . X . . . X~ | . . . X . . X .  — the 4& ties over the barline',
      description: 'Bar 2 has no downbeat chord — the tied and-of-4 carries across. The anticipation is the hardest and most essential bossa skill. Gilberto drifted between patterns freely; treat it as a motif, not a loop.',
    },
    {
      label: 'Partido alto (the samba cousin — for contrast)',
      rhythm: '. X . X X . . X  — lands HARD on beat 3',
      description: 'Percussive, chopped, with muted ghost-strums — the opposite aesthetic. Bossa never accents beat 3: that beat belongs to the bass register (the surdo). Hammering it squares the lilt into a polka.',
    },
  ],

  plays: {
    'bossa-ipanema': [
      {
        label: 'Low-E roots (the João position)',
        level: 'intermediate',
        chords: [
          { shape: MAJ7_6, note: 'Imaj7' },
          { shape: DOM13_6, extensions: ['13'], note: 'II7(13) — the Lydian ♭7 colour' },
          { shape: M7_6, note: 'ii7' },
          { shape: DOM7S11_6, extensions: ['#11'], note: '♭II7(♯11) — tritone sub of V' },
          { shape: MAJ7_6, note: 'home' },
          { shape: DOM7S11_6, extensions: ['#11'], note: 'and the ♭II7 again — Jobim never quite lets go' },
        ],
        tips: 'The whole A-section lives in a four-fret window: each change moves the thumb a fret or two and one or two fingers inside the grip. If a finger jumps more than two frets, you took a wrong turn.',
      },
      {
        label: 'A-string roots, colour-tone set',
        level: 'intermediate',
        chords: [
          { shape: MAJ9_5, extensions: ['9'], note: 'Imaj9' },
          { shape: DOM9_5, extensions: ['9'], note: 'II9' },
          { shape: M7_5, note: 'ii7' },
          { shape: DOM9_5, extensions: ['9'], note: '♭II9' },
          { shape: MAJ9_5, extensions: ['9'], note: '' },
          { shape: DOM9_5, extensions: ['9'], note: '' },
        ],
        tips: 'Same progression, one string set higher and sweeter — 9ths everywhere. Use this set when another guitarist or pianist already owns the low-E register. (If the band plays a plain major tonic, the 6/9 grab — drop the 7th for the 6 — is the classic bossa colour.)',
      },
    ],

    'bossa-minor-251': [
      {
        label: 'Low-E roots with the ♭9',
        level: 'intermediate',
        chords: [
          { shape: M7_6, note: 'i7' },
          { shape: M7B5_6, note: 'iiø7 — the ♭5 on the B string is the saudade note' },
          { shape: DOM7B9_6, extensions: ['b9'], note: 'V7♭9 — the ♭5 you just played, reinterpreted' },
          { shape: M6_6, note: 'i6 — resolve to the sixth, not the seventh' },
        ],
        tips: 'One pitch threads the middle of the progression: the iiø7\'s ♭5 IS the V7\'s ♭9. Find it, hold it, let the thumb do the moving.',
      },
      {
        label: 'A-string roots, compact grabs',
        level: 'intermediate',
        chords: [
          { shape: M7_5C, note: 'compact i7 — no 5th, pure bossa economy' },
          { shape: M7B5_5, note: 'iiø7' },
          { shape: DOM7B9_5, extensions: ['b9'], note: 'V7♭9' },
          { shape: M6_5, note: 'i6' },
        ],
        tips: 'Black Orpheus oscillates between this cell and the relative major\'s ii–V–I — learn both as one hand pattern and the whole tune is two moves.',
      },
    ],

    'bossa-blue': [
      {
        label: 'Thumb-bass through the form',
        level: 'intermediate',
        chords: [
          { shape: M7_6, note: 'i7' }, { shape: M7_6, note: '' },
          { shape: M7_5, note: 'iv7 — A-string root, same fret region' }, { shape: M7_5, note: '' },
          { shape: M7B5_5, note: 'iiø7' },
          { shape: DOM7B9_6, extensions: ['b9'], note: 'V7♭9' },
          { shape: M7_6, note: '' }, { shape: M7_6, note: '' },
          { shape: M7_6, note: '♭iii7 — the excursion begins' },
          { shape: DOM9_5, extensions: ['9'], note: '♭VI9' },
          { shape: MAJ9_5, extensions: ['9'], note: '♭IImaj9 — a major-key vacation' },
          { shape: MAJ9_5, extensions: ['9'], note: '' },
          { shape: M7B5_5, note: 'iiø7 — back to reality' },
          { shape: DOM7B9_6, extensions: ['b9'], note: 'V7♭9' },
          { shape: M7_6, note: '' }, { shape: M7_6, note: '' },
        ],
        tips: 'i and iv sit on adjacent root strings in one position, like a blues. The bars 9–12 excursion is a normal major ii–V–I — play it sweeter, then darken again for the iiø7.',
      },
      {
        label: 'Colour set (9ths and the 6/9 cadence)',
        level: 'intermediate',
        chords: [
          { shape: M7_5C, note: '' }, { shape: M7_5C, note: '' },
          { shape: M7_6, note: 'iv7 low' }, { shape: M7_6, note: '' },
          { shape: M7B5_6, note: '' },
          { shape: DOM7B9_5, extensions: ['b9'], note: '' },
          { shape: M7_5C, note: '' }, { shape: M7_5C, note: '' },
          { shape: M7_5C, note: '' },
          { shape: DOM13_6, extensions: ['13'], note: '♭VI13' },
          { shape: MAJ9_5, extensions: ['9'], note: '♭IImaj9' },
          { shape: MAJ9_5, extensions: ['9'], note: '' },
          { shape: M7B5_6, note: '' },
          { shape: DOM7B9_5, extensions: ['b9'], note: '' },
          { shape: M7_5C, note: '' }, { shape: M7_5C, note: '' },
        ],
        tips: 'Blue Bossa\'s tonic is a true m7 — save the m6 colour for tunes that ask for it (see the minor ii–V–i cell). Keep all of it at whisper volume.',
      },
    ],

    'bossa-one-note': [
      {
        label: 'Two grips falling by half-steps (A-string roots)',
        level: 'intermediate',
        chords: [
          { shape: M7_5, note: 'iii7' },
          { shape: DOM9_5, extensions: ['9'], note: '♭III9 — same fret region, one finger reshapes' },
          { shape: M7_5, note: 'ii7 — whole grip slides down' },
          { shape: DOM9_5, extensions: ['9'], note: '♭II9' },
        ],
        tips: 'The entire progression is two grips alternating while the thumb walks down chromatically. Hold one melody note on top if you can reach it — that\'s the whole point of the tune.',
      },
      {
        label: 'Low-E roots with 13s',
        level: 'intermediate',
        chords: [
          { shape: M7_6, note: '' },
          { shape: DOM13_6, extensions: ['13'], note: '♭III13' },
          { shape: M7_6, note: '' },
          { shape: DOM13_6, extensions: ['13'], note: '♭II13' },
        ],
        tips: 'The 13 on top of each dominant descends in parallel with the bass — two chromatic lines moving in lockstep, which is why this progression sounds inevitable.',
      },
    ],

    'bossa-corcovado': [
      {
        label: 'Chromatic staircase, low-E roots',
        level: 'intermediate',
        chords: [
          { shape: M6_6, note: 'iii6' },
          { shape: DIM7_6, note: 'passing °7 — one fret down' },
          { shape: M7_6, note: 'ii7 — one more' },
          { shape: DOM7S11_6, extensions: ['#11'], note: '♭II7(♯11) — tritone sub' },
          { shape: MAJ7_6, note: 'Imaj7 — arrival' },
        ],
        tips: 'The low E string walks down one fret per bar — let that bassline sing through the grips. This is the same passing-diminished device as How Insensitive; learn it once, hear it everywhere in Jobim.',
      },
      {
        label: 'A-string set with the 6/9 landing',
        level: 'intermediate',
        chords: [
          { shape: M6_5, note: 'iii6' },
          { shape: DIM7_5, note: '°7' },
          { shape: M7_5C, note: 'ii7' },
          { shape: DOM7B9_5, extensions: ['b9'], note: '♭II7(♭9)' },
          { shape: MAJ9_5, extensions: ['9'], note: 'Imaj9 — arrival' },
        ],
        tips: 'When the singer holds the tonic, swap the maj9 for a 6/9 grab (7th down to the 6) — no leading tone to fight them. Over a detected maj7, stay with the maj9.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'ii7 / i7 / iv7', scale: 'dorian', why: 'All the minor 7ths take Dorian — bossa is jazz harmony in a swimsuit.' },
      { over: 'V7 → major I', scale: 'mixolydian', why: 'Plain Mixolydian when resolving to major; add the 13 — it\'s the genre\'s favourite colour.' },
      { over: 'II7 / ♭II7 (tritone subs)', scale: 'lydian', why: 'Lydian dominant (melodic minor from the 5th) — the ♯11 is already in the chord grip.' },
      { over: 'V7♭9 → minor i', scale: 'phrygian', why: 'Phrygian dominant (harmonic minor from the V) for the ♭9; the altered scale if you want more trouble.' },
      { over: 'iiø7', scale: 'locrian', why: 'Locrian, or raise the 2 (melodic-minor mode 6) for a smoother colour.' },
    ],
    targetNotes:
      'Bossa solos are melody-first: hold or repeat a small cell and let the CHORDS recontextualise it — One Note Samba is the method stated as a song title. Target the colour tones (9, 13, ♯11) and the 3rd/7th guide-tone line; avoid sitting on roots. Phrase behind the beat and leave bar-length gaps.',
    licks: [
      {
        over: 'bossa-ipanema',
        description: 'The Ipanema opening cell: the melody sits on the 9th and major 7th of the Imaj7 — never the root. The identical two notes work over the II7 bars, where they become root and 13.',
        tab: 'e|--3--------------3-----------\nB|------5--5--3--------5--5----\n    G    E  E  D    G    E  E\n   (9)  (7)(7)(6)  (9)  (7)(7)   over Fmaj7',
        source: '"Garota de Ipanema" — Jobim/de Moraes (Real Book lead sheet; mDecks harmonic analysis)',
      },
    ],
  },
}
