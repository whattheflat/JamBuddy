// Pop piano pack (task P-62). Recipes verified by degree-spelling against
// CHORD_TYPES (src/lib/theory.js) and the validator's stacking convention
// (order inside each hand = voicing order low → high, nearest strictly above —
// documented at jazz/piano.js header). Every voice-leading claim in notes/tips
// is pitch-class arithmetic, computed and checked against the realized
// voicings (key of C for the major loops, E minor for the minor loop) before
// writing. Max combined stack in this pack: 19 semitones (renders for all 12
// roots inside the 36-key MiniPiano window).
//
// Pop piano is deliberately NOT jazz: plain triads and inversions, sus4 pulls
// and one add9 shimmer where the songs themselves put it — no 7ths or 13ths
// bolted on. Patterns and treatments sourced from:
// pianote.com — "Someone Like You" tutorial (the broken bottom–middle–top–
// middle roll over A–E–F♯m–D, i.e. the axis) and "How To Make Your Left Hand
// Sound Awesome" / "3 Left Hand Piano Patterns" (the root–5th–octave "1–5–8"
// pop anchor); pianowithjonny.com — "Rock and Roll Piano Chords and
// Accompaniment" (the '50s triplet pump) and "Pop Piano Accompaniment:
// Popstinatos" (repeated-figure pop comping); 500songs.com episode 25 —
// "Earth Angel" (piano triplets as the doo-wop signature, on the record
// itself); en.wikipedia.org/wiki/Pachelbel's_Canon and /wiki/'50s_progression
// (the descending first-inversion bass stair; the ice-cream changes); and the
// records the progressions.js songs list names: Let It Be (quarter-note block
// chords), Graduation — Vitamin C (Canon changes as straight-8th piano pulse),
// Numb — Linkin Park (8th-note octave pulse), Royals — Lorde (sparse pads,
// the ♭VII shimmer). Pedagogy frame: docs/learn-curriculum.md — Piano pillar
// (register discipline; voice-leading as hand economy).

// Reusable degree recipes. Order inside each hand = voicing order, low → high.
const LH_R = ['1']                 // single bass root
const LH_R5 = ['1', '5']           // root + fifth anchor
const LH_OCT = ['1', '1']          // pumping octaves (the rock-piano kick drum)
const LH_STACK = ['1', '5', '1']   // root–5th–octave: the pianote "1–5–8" pop anchor
const RH_ROOT = ['1', '3', '5']    // root-position triad
const RH_INV1 = ['3', '5', '1']    // first inversion (root on top)
const RH_INV2 = ['5', '1', '3']    // second inversion (3rd on top)
const RH_35 = ['3', '5']           // bare 3rd + 5th dyad

export default {
  styleIntro:
    'Pop piano is the whole arrangement in one instrument: the left hand plays the bass part (roots, fifths, octaves), the right hand stacks plain triads, and the rhythm — pillars, pulses, rolls, triplets — is what changes between songs, not the harmony. Voice-lead the inversions so the top note barely moves, and spend your one colour (a sus4 pull, an add9 shimmer) where the record spends it.',

  comping: [
    {
      label: 'Quarter-note pillars',
      rhythm: 'four even quarter-note chords per bar',
      description:
        'The Let It Be pulse: block the chord on every beat, straight and unhurried, and let the sustain pedal glue the changes. The steadiness is the point — the vocal supplies all the motion.',
    },
    {
      label: 'Driving eighths',
      rhythm: 'straight 8ths, accents on 2 and 4',
      description:
        'Eight even strokes a bar, the piano as rhythm guitar. Verse quiet, chorus loud — in pop the dynamic jump IS the arrangement, so resist adding notes and add weight instead.',
    },
    {
      label: "'50s triplets",
      rhythm: '12/8 — three strokes per beat',
      description:
        'Twelve even triplet chords a bar, the sound of every slow dance since Earth Angel. Keep them soft and metronomic; accent beats 2 and 4 and the whole band swings around you.',
    },
    {
      label: 'The ballad roll',
      rhythm: 'broken-chord 16ths: bottom–middle–top–middle',
      description:
        'Never block the chord — roll it, low to high to low, in an even stream (the Someone Like You engine). One dynamic swell per phrase, pedal through each change.',
    },
  ],

  plays: {
    'pop-axis': [
      {
        label: 'The ballad roll (Someone Like You bed)',
        level: 'foundation',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'anchor 1–5 low, roll the triad above: bottom–middle–top–middle in even 16ths' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'the I\'s 5th is this chord\'s root — the whole pattern just slides down a fourth' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'nothing carries over from the V — the total change is why the relative-minor drop lands' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'two names return: the vi\'s root and ♭3 are this chord\'s 3rd and 5th' },
        ],
        register: 'LH fifths around C3, RH roll around middle C',
        tips: 'The piano-ballad axis is a texture, not a chord trick: keep the 16ths rolling (the literal Someone Like You verse figure) and let the pedal connect the bars. Know the loop\'s one seam with zero shared notes — V into vi — and lean into it; every other change hands you at least one common tone for free.',
      },
      {
        label: 'Let It Be pillars (voice-led quarters)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: RH_INV1 }, note: 'first inversion — the key\'s home note on top' },
          { recipe: { LH: LH_R, RH: RH_INV2 }, note: 'the G holds; the other two fall by step (top C→B a half-step, E→D a whole)' },
          { recipe: { LH: LH_R, RH: RH_INV2 }, note: 'all three voices rise by step: D→E and G→A whole steps, B→C the half-step' },
          { recipe: { LH: LH_R, RH: RH_ROOT }, note: 'two keys hold (A and C); one finger moves — E up a half-step to F' },
        ],
        register: 'RH pillars around middle C, LH single roots an octave and more below',
        tips: 'Four even quarters per bar — the Let It Be pulse — with inversions chosen so the top note only ever leaves the tonic for its neighbour a half-step below (C…B…C…C in the reference key). No right-hand finger moves more than a whole step anywhere in the loop, and the seam home is almost free: the top C holds while F and A fall by step onto E and G.',
      },
    ],

    'pop-50s-doowop': [
      {
        label: 'Earth Angel triplets',
        level: 'foundation',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'root-position triad over the 1–5 anchor — pump it in triplets' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'two names survive the wistful drop: the I\'s root and 3rd are this chord\'s ♭3 and 5th' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'two survive again: the vi\'s root and ♭3 become this chord\'s 3rd and 5th' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'nothing survives — the whole triad steps up a whole step in parallel: the turn home' },
        ],
        register: 'LH around C3, RH triads just above middle C',
        tips: 'Twelve even triplet strokes a bar — the doo-wop engine on the Earth Angel record itself. Root positions on purpose: the pump, not the voice leading, is the part. Play them soft and metronomic, accent 2 and 4, and give the singer the whole top of the keyboard.',
      },
      {
        label: 'Wedding-band walk (one-finger changes)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: RH_INV2 }, note: 'second inversion — G–C–E, the 3rd on top' },
          { recipe: { LH: LH_R, RH: RH_ROOT }, note: 'one finger: the bottom G rises a whole step to A; C and E hold, re-named from root+3rd to ♭3+5th' },
          { recipe: { LH: LH_R, RH: RH_INV1 }, note: 'one finger again: E rises a half-step to F; A and C hold' },
          { recipe: { LH: LH_R, RH: RH_INV1 }, note: 'the whole hand lifts a whole step — A→B, C→D, F→G' },
        ],
        register: 'RH close position around middle C, LH roots below; sustained halves and wholes',
        tips: 'The same four chords as the triplet play, reorganised so the first two changes cost exactly one finger each. The seam home is the lesson: the G stays under your hand (top of the V, bottom of the I) while B and D resolve up by step onto C and E. This is the slow-set reading; the triplets play is the dance-set one.',
      },
    ],

    'pop-canon': [
      {
        label: 'The Pachelbel stair (first-inversion walk)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: RH_INV1 }, note: 'root in the bass — the stair starts on 1' },
          { recipe: { LH: ['3'], RH: RH_INV2 }, note: 'LH plays the 3rd, not the root: the bass steps down a half-step onto the key\'s 7th; above, G holds while E→D and C→B fall by step' },
          { recipe: { LH: LH_R, RH: RH_INV2 }, note: 'bass falls a whole step to 6; every right-hand voice rises by step (D→E, G→A, B→C)' },
          { recipe: { LH: ['3'], RH: RH_INV2 }, note: 'LH takes the ♭3: the bass stair falls another whole step onto the key\'s 5th; E holds while A→G and C→B fall' },
          { recipe: { LH: LH_R, RH: RH_INV2 }, note: 'bass reaches 4, one more whole step down; all three voices rise (B→C and E→F by half-step, G→A by whole)' },
        ],
        register: 'LH bass line around C3, RH close voicings just above middle C',
        tips: 'The whole trick is two first inversions: put the V and iii over their own 3rds and the left hand walks 1–7–6–5–4 — a half-step then three whole steps, the "classical" stair under Memories and Don\'t Look Back in Anger. The right hand alternates fall, rise, fall, rise so no voice ever leaps; at the loop seam the C holds while F and A fall by step.',
      },
      {
        label: 'Graduation pulse (root-position eighths)',
        level: 'foundation',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'straight-eighth root positions — the school-assembly reading' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'the bass drops a fourth; the right hand just re-plants the same grip' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'bass up a whole step' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'down a fourth again' },
          { recipe: { LH: LH_R5, RH: RH_ROOT }, note: 'up a half-step — then the loop falls a fourth home' },
        ],
        register: 'both hands mid-low; eight even strokes a bar',
        tips: 'Graduation (Friends Forever) plays the Canon changes exactly like this: every chord root position, eight even eighths, zero negotiation in the right hand. Let the left hand tell the story instead — down a fourth, up a step, down a fourth, up a half-step, and a fourth drop home. The stair play is what to graduate to once this grooves.',
      },
    ],

    'pop-mixo-bVII': [
      {
        label: 'The tonic drone (pad voicings)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: RH_INV1 }, note: 'the key\'s home note on top for the two tonic bars' },
          { recipe: { LH: LH_R, RH: ['3', '5', '9'] }, note: 'the top note refuses to move — over the ♭VII it becomes the 9, an add9 shimmer; the two voices under it each fall a whole step (E→D, G→F)' },
          { recipe: { LH: LH_R, RH: RH_ROOT }, note: 'two keys stay down (the ♭VII\'s 5th is this root, its 9 this 5th); only the 3rd moves, leaping a fifth up onto the IV\'s 3rd' },
        ],
        register: 'RH just above middle C; long sustains, pedal through each chord',
        tips: 'One key — the key\'s tonic — is physically held down for the entire loop: root of the I, 9 of the ♭VII, 5th of the IV. That drone is the piano translation of the guitar pack\'s ringing open strings, and the 9 it creates on the ♭VII is honest pop colour (Royals hangs its verse on exactly this shimmer). At the seam home the tonic holds again while F and A fall by step onto E and G.',
      },
      {
        label: 'Stadium pulse with the sus pull',
        level: 'foundation',
        chords: [
          { recipe: { LH: LH_STACK, RH: RH_35 }, note: 'root–5th–octave low, bare 3–5 above; across the two bars lift the 3rd a half-step to the 4th and drop it back — the sus4 pull' },
          { recipe: { LH: LH_STACK, RH: RH_35 }, note: 'the whole five-note stack slides down a whole step in parallel' },
          { recipe: { LH: LH_STACK, RH: RH_35 }, note: 'up a fifth (or feel it as down a fourth) — same grip, third station' },
        ],
        register: 'LH stack from around C2, RH dyad just above middle C — big and low',
        tips: 'The piano as rhythm guitar: the 1–5–8 left hand is the pop anchor pianote teaches, the two-finger right hand keeps the mid-range clear for the vocal, and dynamics — not new chords — make the chorus. The sus4 pull on the long I bar is the keys version of the guitar pack\'s hammer-on wiggle: 3rd up a half-step, back down, harmony never changes.',
      },
    ],

    'pop-minor-loop': [
      {
        label: 'Dark pads (voice-led)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: RH_ROOT }, note: 'root-position minor — state the lone i plainly' },
          { recipe: { LH: LH_R, RH: RH_INV1 }, note: 'one finger: the i\'s 5th rises a half-step onto this root (on top); the other two hold, re-named as the ♭VI\'s 3rd and 5th' },
          { recipe: { LH: LH_R, RH: RH_INV2 }, note: 'the ♭VI\'s 5th holds as this root; E→D a whole step, C→B a half-step (reference key E minor)' },
          { recipe: { LH: LH_R, RH: RH_ROOT }, note: 'the ♭III\'s 5th holds as this root; G→F♯ a half-step, B→A a whole step' },
        ],
        register: 'RH around middle C, LH roots below; sustained wholes',
        tips: 'Three of the four changes cost a finger or two; the seam home costs everything — the ♭VII and the i share no notes at all, so all three voices rise by step together (D→E and A→B whole steps, F♯→G the half-step). That full-hand climb is why the loop feels like it leans back into the minor i. Practise the seam alone until the climb is one gesture.',
      },
      {
        label: 'Octave drive (Numb pulse)',
        level: 'foundation',
        chords: [
          { recipe: { LH: LH_OCT, RH: RH_35 }, note: 'left-hand octaves hammer the root; the right hand is just ♭3+5 — thin on purpose' },
          { recipe: { LH: LH_OCT, RH: RH_35 }, note: 'same grip on the major: the dyad narrows by one key (♭3–5 is four semitones, 3–5 is three)' },
          { recipe: { LH: LH_OCT, RH: RH_35 }, note: 'keep the eighths even; accent 2 and 4' },
          { recipe: { LH: LH_OCT, RH: RH_35 }, note: 'last bar — lean the crescendo into the climb back to the i' },
        ],
        register: 'LH octaves around C2–C3, RH dyad mid-keyboard; straight eighths throughout',
        tips: 'The rock-piano reading (Numb\'s pulse): octaves are the kick drum, the two-note right hand stays out of the vocal\'s way, and the chorus is a dynamic, not a chord. The one theory note worth keeping: the dyad is four semitones wide on the minor i and three on the majors — one key narrower every time the loop brightens.',
      },
    ],
  },

  improv: {
    scales: [
      {
        over: 'the major loops (axis, doo-wop, Canon)',
        scale: 'major pentatonic',
        why: 'Pop toplines are mostly pentatonic: five notes with no avoid tone over any chord in the loop. Add the full major scale for passing notes between phrases.',
      },
      {
        over: 'vi (and the minor loop\'s i)',
        scale: 'minor',
        why: 'Natural minor of the vi is the same keys as the parent major — identical fingering, darker targets. Minor pentatonic when in doubt; every chord of the minor loop is diatonic to it.',
      },
      {
        over: 'I–♭VII–IV',
        scale: 'mixolydian',
        why: 'The ♭VII is built from the key\'s ♭7, so Mixolydian covers the whole vamp with one scale — the same call the guitar pack makes.',
      },
      {
        over: 'V (doo-wop, Canon)',
        scale: 'major',
        why: 'Stay in the parent major; land on the V\'s 3rd — the key\'s leading tone — when you want the turn home to bite.',
      },
    ],
    targetNotes:
      'Pop fills live between vocal phrases, not over them. Find the note the whole loop shares — the tonic-drone play makes it physical — and hang fills off it, landing phrase endings on the current chord\'s 3rd. The 9 is pop\'s one free colour: a whole step above any root, it reads as shimmer, never as jazz.',
    licks: [
      {
        over: 'pop-axis',
        description:
          'The roll figure is itself the fill: when the vocal rests, take the right-hand bottom–middle–top–middle broken pattern up an octave for two beats and come back down — motion without a single new note. This is how the Someone Like You verse breathes.',
        source: 'pianote.com — "Someone Like You" piano tutorial (the broken-chord verse figure)',
      },
      {
        over: 'pop-mixo-bVII',
        description:
          'The sus4 pull as a fill: over the held I, alternate the 3rd and 4th in even eighths (3–4–3, harmony unchanged) — the keyboard translation of the guitar sus hammer-on that fills long tonic bars in pop-rock loops.',
        source: 'the guitar pack\'s sus figure (fretjam.com / guitar.com sus embellishments), translated per pianowithjonny.com pop accompaniment patterns',
      },
    ],
  },
}
