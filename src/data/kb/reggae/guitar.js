// Reggae guitar pack. Shapes verified by note-spelling against: guitarwiz.app
// (skank voicings, bubble grid), guitarworld.com (Marley rhythm lesson),
// guitarkitchen.com (Stir It Up / Get Up Stand Up lessons), Wikipedia ("Ska
// stroke", "One drop rhythm"), ethanhein.com (Stir It Up hook analysis).

// Top-3-string triads — the classic skank register (above the bubble, far above the bass).
const TOP3_MAJ = { rootStr: 1, offsets: ['x', 'x', 'x', 1, 0, 0], fingers: [0, 0, 0, 2, 1, 1] }  // 3-5-R
const TOP3_MIN = { rootStr: 1, offsets: ['x', 'x', 'x', 0, 0, 0], fingers: [0, 0, 0, 1, 1, 1] }  // ♭3-5-R barre

// Middle-string triads (strings 4-3-2) — the Wailers chop register.
const MID_MAJ = { rootStr: 3, offsets: ['x', 'x', 0, 0, 0, 'x'], fingers: [0, 0, 1, 1, 1, 0] }   // 5-R-3
const MID_MIN = { rootStr: 3, offsets: ['x', 'x', 0, 0, -1, 'x'], fingers: [0, 0, 2, 3, 1, 0] }  // 5-R-♭3

// Top-4 partial barres — fuller chop, still no low strings.
const TOP4_MAJ = { rootStr: 4, offsets: ['x', 'x', 0, -1, -2, -2], fingers: [0, 0, 4, 3, 1, 1] } // R-3-5-R
const TOP4_MIN = { rootStr: 4, offsets: ['x', 'x', 0, -2, -2, -2], fingers: [0, 0, 4, 1, 1, 1] } // R-♭3-5-R

// Quality-neutral 5th+root dyad (strings B+e) — works over major or minor.
const DYAD_5R = { rootStr: 1, offsets: ['x', 'x', 'x', 'x', 0, 0], fingers: [0, 0, 0, 0, 1, 1] }

export default {
  styleIntro:
    'The reggae guitarist plays one thing and plays it perfectly: the skank — a small, high, choked chord chop strictly on the offbeats. Beat 1 is sacred silence (the one drop), beat 3 belongs to the drums, the low end belongs to the bass. Strike, choke, wait.',

  comping: [
    {
      label: 'One-drop skank',
      rhythm: '. . X . | . . X .  — chops on 2 and 4 only',
      description: 'The core part. Strike the chord, release fret pressure instantly (fingers stay touching, off the frets), silence until the next chop. Downstroke-dominant in reggae. Counted double-time it becomes the and-of-every-beat.',
    },
    {
      label: 'Double skank (Stir It Up)',
      rhythm: '. . D U | . . D U  — down-up pair on 2 and 4',
      description: 'Each chop splits into a two-hit "chak-a": downstroke on the beat, upstroke on its and. The rockers-era intensifier — same placement, doubled motion.',
    },
    {
      label: 'Ska upstroke',
      rhythm: '. U . U . U . U  — every offbeat 8th, bright and fast',
      description: 'The same offbeat principle at 120–180 BPM: upstrokes on every "and". Rocksteady is this relaxed; roots reggae is this halved. The placement never changes across the whole family — only the drums do.',
    },
    {
      label: 'The bubble (only without keys)',
      rhythm: '. . X X . . X X . . X X . . X X  — the "& a" of every beat',
      description: 'Normally the organ\'s job (Jackie Mittoo): a palm-muted continuous offbeat pulse in the midrange. Cover it on guitar only when there is no keyboardist — never alongside one.',
    },
  ],

  plays: {
    'reggae-stir': [
      {
        label: 'Top-3 triads (the classic skank)',
        level: 'intermediate',
        chords: [
          { shape: TOP3_MAJ, note: 'I' },
          { shape: TOP3_MAJ, note: 'IV — same shape up the neck' },
          { shape: TOP3_MAJ, note: 'V — two frets above the IV' },
        ],
        tips: 'One shape, three positions, chop on 2 and 4. The chop must die immediately — if a chord rings into the next beat, that\'s a rock strum, not a skank.',
      },
      {
        label: 'Middle-string set (Wailers register)',
        level: 'intermediate',
        chords: [
          { shape: MID_MAJ, note: 'I — strings 4-3-2' },
          { shape: MID_MAJ, note: 'IV' },
          { shape: MID_MAJ, note: 'V' },
        ],
        tips: 'A warmer chop one string set down — the Marley band register. Use it when a second guitar or keys already occupy the top strings.',
      },
    ],

    'reggae-two-chord': [
      {
        label: 'Top-3 triads',
        level: 'intermediate',
        chords: [
          { shape: TOP3_MAJ, note: 'I' },
          { shape: TOP3_MAJ, note: 'IV — five frets up, or two down on the next string set' },
        ],
        tips: 'Two chords for the whole tune means the skank IS your entire job: identical length, identical volume, every chop. Boredom is the test — pass it.',
      },
      {
        label: 'Top-4 partial barres',
        level: 'intermediate',
        chords: [
          { shape: TOP4_MAJ, note: 'I' },
          { shape: TOP4_MAJ, note: 'IV' },
        ],
        tips: 'The fuller chop for when the band is sparse — still nothing below the D string. Half-press the barre (Marley style) and the chop turns almost fully percussive.',
      },
    ],

    'reggae-minor-vamp': [
      {
        label: 'Top-3 triads',
        level: 'intermediate',
        chords: [
          { shape: TOP3_MIN, note: 'i — one-finger barre' },
          { shape: TOP3_MAJ, note: '♭VII — a passing breath, two frets down' },
        ],
        tips: 'Treat the ♭VII as ornament, not destination — Get Up Stand Up is functionally one chord, and the groove is the message. The intro hook (♭7→root on the G string) doubles the bass.',
      },
      {
        label: 'Middle-string set',
        level: 'intermediate',
        chords: [
          { shape: MID_MIN, note: 'i' },
          { shape: MID_MAJ, note: '♭VII' },
        ],
        tips: 'Lower, darker chop for the heavier roots feel. Keep the choke brutal at slow tempos — space is the instrument at 75 BPM.',
      },
    ],

    'reggae-nwnc': [
      {
        label: 'Top-3 triads with the bass walk',
        level: 'intermediate',
        chords: [
          { shape: TOP3_MAJ, note: 'I' },
          { shape: TOP3_MAJ, note: 'V — the bass plays its 3rd underneath; your triad doesn\'t change' },
          { shape: TOP3_MIN, note: 'vi' },
          { shape: TOP3_MAJ, note: 'IV' },
        ],
        tips: 'The V⁶\'s descending bass (root→7th of the scale→6th) is the bassist\'s line — your job is to NOT double it. Stay high, stay small, let the walk happen below you.',
      },
      {
        label: 'Neutral 5+R dyads',
        level: 'intermediate',
        chords: [
          { shape: DYAD_5R, omit3: true, note: 'I' },
          { shape: DYAD_5R, omit3: true, note: 'V' },
          { shape: DYAD_5R, omit3: true, note: 'vi — same dyad; the bass supplies the minor' },
          { shape: DYAD_5R, omit3: true, note: 'IV' },
        ],
        tips: 'Two strings, no 3rd — quality-neutral, so one dyad shape skanks the whole progression while bass and vocals colour it. The most transparent part you can play behind a singer.',
      },
    ],

    'reggae-rocksteady': [
      {
        label: 'Top-3 triads, doo-wop sweetness',
        level: 'intermediate',
        chords: [
          { shape: TOP3_MAJ, note: 'I' },
          { shape: TOP3_MIN, note: 'ii' },
          { shape: TOP3_MIN, note: 'iii — two frets up' },
          { shape: TOP3_MIN, note: 'ii' },
        ],
        tips: 'A diatonic staircase: the minor barre walks up two frets and back while the I anchors. Rocksteady tempo (~86 BPM) sits between ska\'s sprint and roots\' crawl — relax the chop accordingly.',
      },
      {
        label: 'Top-4 partial barres',
        level: 'intermediate',
        chords: [
          { shape: TOP4_MAJ, note: 'I' },
          { shape: TOP4_MIN, note: 'ii' },
          { shape: TOP4_MIN, note: 'iii' },
          { shape: TOP4_MIN, note: 'ii' },
        ],
        tips: 'The soul-ballad version of the skank — slightly fuller, still bass-free. Good under a falsetto lead vocal where top-3 triads would crowd the singer\'s register.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'major vamps', scale: 'major', why: 'Major pentatonic fills in the gaps AFTER vocal lines — call and response, never over the singer.' },
      { over: 'i–♭VII vamps', scale: 'minor', why: 'Minor pentatonic answer phrases; the ♭7 doubles as the ♭VII chord\'s root — the free note of roots reggae.' },
      { over: 'any vamp (riddim role)', scale: 'minor', why: 'The classic second-guitar job is doubling the bass melody in unison, palm-muted for a dull attack — locked exactly, not approximately.' },
    ],
    targetNotes:
      'Reggae lead is economy: short pentatonic answers in vocal gaps, high picked arpeggios of the current chord with 16th-note pickups, or unison bass-doubling. If you\'re not sure whether to play — don\'t. Beat 1 stays empty even for the soloist\'s instincts.',
    licks: [
      {
        over: 'reggae-stir',
        description: 'The Stir It Up hook (reconstruction from Ethan Hein\'s published note-by-note analysis, not a record transcription): an ornamented rise A→C♯→D over the I, then arpeggios of the IV and V with 16th-note pickups carrying the swing.',
        tab: '    A (I)              D (IV)        E (V)\ne|--------------------|----2----5---|----4----7----\nB|---------2----3-----|--3----------|--5-----------\nG|----2---------------|-------------|--------------\n     A    C#   D        D  F#   A     E  G#   B',
        source: 'ethanhein.com "Musical simples: Stir It Up"; Bob Marley & The Wailers (1973)',
      },
    ],
  },
}
