// Blues piano pack (task P-31). Recipes verified by degree-spelling against
// CHORD_TYPES (src/lib/theory.js) and the validator's stacking convention
// (order inside each hand = voicing order low → high, nearest strictly above —
// documented at jazz/piano.js header). Every voice-leading/interval statement
// in notes/tips is pitch-class arithmetic, computed against the realized
// voicings (reference key C / C minor) before writing. Combined LH+RH stacks
// are kept ≤ 23 semitones so every recipe renders inside JamGuide's 36-key
// window for all 12 roots (same budget as rnb/piano.js).
// Voicings and treatments sourced from:
// pianogroove.com — Chicago Blues course ("Chicago Blues Hand Independence":
// LH shell / RH chord two-job split), "How To Count Slow Blues" & "12/8 Feel
// For Slow Blues" (four beats each split in three; rolled arrivals), "Blues
// Piano Comping Patterns & Rhythms" and "Basic Blues Voicings & Patterns"
// (shell + guide-tone comping, 9th/13th dominant colour);
// pianowithjonny.com — "Blues Chords for Piano: The Complete Guide" (9ths and
// 13ths as the bright blues extensions, ♭9/♯9/♭13 as the crunch) and "Slow
// Blues Piano for Beginners";
// piano-ology.com — "Dominant 7(♯9) Voicings" (the no-5th grip: 3–♭7–♯9,
// major-against-minor-third tension) and "Killer Blues Piano Grace Notes"
// (the ♭3→3 crush as the pianist's bend);
// Wikipedia, "Dominant seventh sharp ninth chord" (the 7♯9 codifies the blues
// scale's ♭3 sounding over a major-third dominant);
// Otis Spann (Blues Hall of Fame) — the postwar Chicago model this pack's
// two-fisted play imitates: piano as the only harmony behind voice and guitar;
// Pinetop Smith, "Pinetop's Boogie Woogie" — the rocking 5th↔6th shuffle
// left hand; pianote.com "How to Play Blues Piano" (right-hand harmony in
// sixths); Mark Levine, The Jazz Piano Book (rootless Type A/B dominants,
// 13 replacing the 5) — the uptown/band grips blues borrows from jazz.
// Pedagogy frame: docs/learn-curriculum.md — Piano pillar (shells → rootless,
// register discipline, voice-leading as hand economy).

// Reusable degree recipes. Order inside each hand = voicing order, low → high.
const LH_R = ['1']                     // single bass root
const LH_R5 = ['1', '5']               // root + fifth anchor
const LH_R7 = ['1', '7']               // root + ♭7 shell — the Chicago left hand
const RH_TRIAD = ['1', '3', '5']       // plain root-position triad (the ♭7 lives downstairs)
const GT_37 = ['3', '7']               // guide tones, 3rd on the bottom
const GT_73 = ['7', '3']               // guide tones flipped, ♭7 on the bottom
const RH_9 = ['9', '3', '7']           // 9th spread: the 9 tucked under the guide tones
const RH_7TH = ['3', '5', '7']         // full seventh chord stacked above the anchor
const RH_SHARP9 = ['3', '7', '#9']     // the crying chord: 3–♭7–♯9, no 5th (piano-ology grip)
const RH_13 = ['3', '13', '7']         // 13th cluster: the 13 crushed under the ♭7
const A_DOM = ['3', '13', '7', '9']    // rootless Type A dominant (Levine: 13 for 5)
const B_DOM = ['7', '9', '3', '13']    // rootless Type B dominant

export default {
  styleIntro:
    'Blues piano is two instruments in one player: a left hand that keeps the shuffle honest (roots, shells, the boogie rock) and a right hand that talks back — stabs, sixths, tremolos, the crush of ♭3 into 3. Harmony is three dominant chords and everything expressive happens in how little you move between them: the whole form voice-leads by half-steps and whole steps if you let it.',

  comping: [
    {
      label: 'Shuffle backbeat stabs',
      rhythm: 'swung 8ths; right-hand chips on 2 and 4',
      description:
        'The Chicago comp: the left hand holds the shell (or rocks the boogie) while the right hand stabs with the snare on 2 and 4. Keep the stabs short and identical — in a Chicago band the piano is felt more than heard until the fill.',
    },
    {
      label: 'Slow-blues 12/8 rolls',
      rhythm: 'four beats to the bar, each split in three',
      description:
        'The slow-blues pulse: block or roll the chords into beats 1 and 3 and let the triplet grid breathe underneath. Tremolo the top of the hand at phrase ends — on a slow blues the tremolo is the horn section.',
    },
    {
      label: 'The Pinetop rock (5–6 left hand)',
      rhythm: 'left hand swung 8ths, rocking 5th ↔ 6th',
      description:
        'The boogie cell from "Pinetop\'s Boogie Woogie": the left hand rocks a whole step between the chord\'s 5th and 6th on every swung 8th, on every chord of the form. It is a drum pattern played on pitches — once it runs itself, the right hand is free.',
    },
  ],

  plays: {
    'blues-12bar': [
      {
        label: 'Horn-section shells (jump-blues guide tones)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: GT_37 }, note: '3rd under ♭7 — the two notes that make it a dominant' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'hold — the stabs are rhythm, not new notes' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'still home; leave holes for the singer' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'last bar of home — lean on the and-of-4 into the IV' },
          { recipe: { LH: LH_R, RH: GT_73 }, note: 'both voices fall a half-step: the I\'s 3rd onto this ♭7, its ♭7 onto this 3rd' },
          { recipe: { LH: LH_R, RH: GT_73 }, note: 'sit' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'home — the same two half-steps, rising this time' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'hold' },
          { recipe: { LH: LH_R, RH: GT_73 }, note: 'bar 9: both voices rise a half-step — the I\'s 3rd becomes this ♭7, its ♭7 this 3rd' },
          { recipe: { LH: LH_R, RH: GT_73 }, note: 'V to IV: the pair slides down a whole step in parallel' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'home on half-steps again' },
          { recipe: { LH: LH_R, RH: GT_73 }, note: 'bar 12 pushes: a half-step up in both voices, and the next chorus starts' },
        ],
        register: 'LH single roots around C3; RH dyads just above middle C — horn-section territory',
        tips: 'Two right-hand fingers cover the whole form, and no change moves either of them more than a whole step: into the IV both guide tones fall a half-step, into the V both rise a half-step, and V-to-IV slides a whole step in parallel. This is the jump-blues horn pad translated to the keys — play it on the shuffle backbeat and you are the brass section. When the band thins out, add the root back with the left hand; when a soloist rips, this is already everything they need from you.',
      },
      {
        label: 'Slow blues, full hands (12/8)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'a two-hand 9th spread — root and 5th below, the 9 tucked under the guide tones above' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'hold — roll it into beat 3, or tremolo the top two notes' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'still home; answer an imaginary singer in the gaps' },
          { recipe: { LH: LH_R, RH: RH_SHARP9 }, note: 'I7♯9 — the 9 sharpens a half-step into the ♯9, which is the key\'s own ♭3: the blue note leaning into the IV' },
          { recipe: { LH: LH_R5, RH: B_DOM }, note: 'the ♯9 holds over as this chord\'s ♭7 (same key); the I\'s ♭7 falls a half-step onto this 3rd' },
          { recipe: { LH: LH_R5, RH: B_DOM }, note: 'sit on the 13 — it is the key\'s own 9th, sweet against the IV' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'the IV\'s 13 holds as this 9; its guide tones each rise a half-step home' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'hold — or thin out before the V arrives' },
          { recipe: { LH: LH_R, RH: RH_SHARP9 }, note: 'the crying chord: the key\'s ♭7 refuses to move — it was the I\'s ♭7 and stays on as this ♯9' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'the ♯9 slips a half-step onto this 3rd; the V\'s ♭7 lands in your left hand as the new root' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'the guide tones trade one last time — two half-step rises' },
          { recipe: { LH: LH_R5, RH: RH_13 }, note: 'V13 out: the I\'s 3rd holds as this 13 while its ♭7 pushes up a half-step onto the 3rd' },
        ],
        register: 'LH around C3, RH stacks around middle C; 12/8 — every beat divides in three',
        tips: 'The slow blues legitimizes both blue notes with chords: the key\'s ♭3 becomes the I7\'s ♯9 in bar 4 and then holds over as the IV7\'s ♭7 in bar 5; the key\'s ♭7 becomes the V7\'s ♯9 in bar 9. The 7♯9 grip here is the classic three-note voicing — 3rd, ♭7, ♯9, no 5th — the "minor third" slung up high, a major seventh above the major third — the whole blues argument in one hand. Roll the big chords into the beat and save the tremolo for the ends of phrases.',
      },
    ],

    'blues-quickchange': [
      {
        label: 'Two-fisted Chicago (Otis Spann lane)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'root + ♭7 shell below, plain triad above — the ♭7 lives downstairs' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'quick change: the I\'s root holds as this chord\'s 5th; its 3rd climbs a half-step onto the new root' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'home in bar 3 — the IV\'s root falls the same half-step back onto the 3rd' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'hold; rock the right hand in swung 8ths' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'IV again — same half-step climb as bar 2' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'sit' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'home' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'hold — bar 8 sets up the V' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'the I\'s 5th holds as the new root; the old root slips a half-step down onto the V\'s 3rd' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'the triad slides down a whole step in parallel — V to IV is the blues\' one pure parallel move' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'home' },
          { recipe: { LH: LH_R7, RH: RH_TRIAD }, note: 'V7 — kick the next chorus' },
        ],
        register: 'LH shell around C2–C3, RH triads mid-keyboard — two hands, two jobs',
        tips: 'The postwar Chicago model (Otis Spann behind Muddy Waters): the piano is the only harmony instrument, so the left hand is the bass player (root + ♭7 shell, or the Pinetop 5–6 rock) and the right hand is the section. The right-hand triad carries no ♭7 on purpose — the shell already supplies it, so together the hands spell the full dominant without mud. The drill this progression exists for: hear bar 2 coming — the quick change is the same one-half-step move as bar 5, just three bars early.',
      },
      {
        label: 'Uptown rootless (9s and 13s behind a band)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: A_DOM }, note: 'Type A dominant: 3–13–♭7–9 — two colour tones per chord' },
          { recipe: { LH: B_DOM }, note: 'quick change: two names hold (the I\'s 13 and 9 become this 3rd and 13); the 3rd falls a half-step onto this ♭7, the ♭7 drops a minor third onto the 9' },
          { recipe: { LH: A_DOM }, note: 'home — the same two fingers walk back' },
          { recipe: { LH: A_DOM }, note: 'hold' },
          { recipe: { LH: B_DOM }, note: 'the bar-2 seam again — spot it faster this time' },
          { recipe: { LH: B_DOM }, note: 'sit' },
          { recipe: { LH: A_DOM }, note: 'home' },
          { recipe: { LH: A_DOM }, note: 'hold — or thin to bare 3 + ♭7 if the guitarist is busy' },
          { recipe: { LH: A_DOM }, note: 'two names hold again (the I\'s 3rd becomes this 13, its 13 this 9); the ♭7 rises a half-step onto the V\'s 3rd' },
          { recipe: { LH: B_DOM }, note: 'the V\'s 9 holds as this 3rd; its 13 falls a half-step onto this ♭7' },
          { recipe: { LH: A_DOM }, note: 'the IV\'s ♭7 rises a half-step onto this 3rd; its 3rd and 13 stay put as the 13 and 9' },
          { recipe: { LH: A_DOM }, note: 'bar 12 — same grip as bar 9; the form is a wheel' },
        ],
        register: 'left hand alone, top note between C4 and C5 — the bassist owns the roots',
        tips: 'The Levine rootless dominants moved into a blues — the uptown sound of a jump band with a bassist, where doubling roots just muddies the bottom. Every I-to-IV seam is the same physical fact: two fingers freeze while two slide, so the quick change costs exactly as much in bar 2 as in bar 5. Comp these on the backbeat and keep the top note in one narrow lane; the colour (9s and 13s everywhere) does the rest.',
      },
    ],

    'blues-8bar': [
      {
        label: 'Front-porch pillars (rolled 12/8)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'root and 5th below, the full seventh chord stacked above' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'the V in bar 2 — every voice by step: the 3rd and 5th fall a whole step (onto the V\'s 5th and ♭7), the ♭7 rises a half-step onto its 3rd' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'V to IV: the entire two-hand grip — roots included — slides down a whole step in parallel' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'sit on the IV — roll it' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'home: the IV\'s ♭7 rises a half-step onto the 3rd; its 3rd and 5th each fall a whole step' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'V again — bar 6, not bar 9; count the form out loud' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'home for one bar' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'V out — it hands you bar 1' },
        ],
        register: 'LH open fifths around C3, RH sevenths around middle C; roll into beats 1 and 3',
        tips: 'One two-hand shape planted on three roots — the front-porch reading of "Key to the Highway". Because the right hand is the plain 3–5–♭7 stack, no change in the form moves any right-hand finger more than a whole step (the left hand\'s roots do the jumping), and V-to-IV slides both hands down a whole step in parallel. That makes this the form-learning play: your hands physically feel that the V arrives in bar 2, which is exactly where 12-bar reflexes get wrong-footed.',
      },
      {
        label: 'Parallel sixths (the fills lane)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: ['5', '3'] }, note: 'a bare sixth — the 5th with the 3rd singing a major sixth above it' },
          { recipe: { LH: LH_R, RH: ['7', '5'] }, note: 'both voices fall a whole step — the dyad is now ♭7 under 5th, still a sixth wide' },
          { recipe: { LH: LH_R, RH: ['1', '13'] }, note: 'the dyad does not move: the V\'s ♭7 and 5th are already this chord\'s root and 13 — only the bass falls' },
          { recipe: { LH: LH_R, RH: ['1', '13'] }, note: 'sit — tremolo the sixth' },
          { recipe: { LH: LH_R, RH: ['5', '3'] }, note: 'both voices climb a whole step home' },
          { recipe: { LH: LH_R, RH: ['7', '5'] }, note: 'down a whole step again — the early V, second lap' },
          { recipe: { LH: LH_R, RH: ['5', '3'] }, note: 'home' },
          { recipe: { LH: LH_R, RH: ['7', '5'] }, note: 'out — the sixth rocks down one more time and the form comes around' },
        ],
        register: 'LH roots low; the sixths sit where a singer would — the middle of the keyboard',
        tips: 'Right-hand sixths are blues piano\'s harmonized-vocal sound — two notes that move like one singer with a shadow. The whole eight bars is one dyad rocking between just two positions a whole step apart, plus one free change (into the IV, where the notes stay and only the bass moves). Decorate it the blues way: tremolo the dyad, and crush into its top note from the key a half-step below — the ♭3-into-3 crush is the pianist\'s string bend.',
      },
    ],

    'blues-minor': [
      {
        label: 'The Thrill pads (m9 spreads)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'm9 — the 9 tucked under the ♭3, a slow-burn spread' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'hold — tremolo, or answer yourself with a fill' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'still home; minor blues burns slower than major' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'lean into the iv' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'two names hold — the i\'s ♭3 is this ♭7, its 5th this 9; the i\'s ♭7 and 9 each fall a whole step (onto this ♭3 and 5th)' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'sit' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'the mirror: the iv\'s ♭3 and 5th climb a whole step back; its ♭7 and 9 hold' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'hold — bar 9 is coming' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'the drama: the i\'s ♭7 holds on as this chord\'s 9, and the bass 5th climbs a half-step onto the new root' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'all five voices sink a half-step together — the ♭VI was the V a half-step early' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'resolve dark: the V\'s ♭7 falls a whole step onto the ♭3; its 3rd slips a half-step back onto the ♭7' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'sit — no push; the minor blues ends its chorus at home' },
        ],
        register: 'LH fifths around C3, RH spreads just above middle C; long tones, B.B.-band tempo',
        tips: 'The lane B.B. King\'s bands live in on "The Thrill Is Gone": sustained 9th spreads, one shape for the whole form. The payoff bar is 9-into-10 — keep the identical grip on the ♭VI7 and V7 and every voice, bass included, sinks exactly a half-step: the strongest move in the style is also the easiest. (B.B.\'s recording colours the ♭VI as a maj7, as the progression card notes — this play keeps it dominant so the plane stays pure; try both.)',
      },
      {
        label: 'After-hours dyads (two fingers and smoke)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: GT_37 }, note: '♭3 under ♭7 — a bare fifth; minor blues needs almost nothing' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'hold' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'space — the drummer is playing; you don\'t have to' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'a small push into the iv' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'the i\'s ♭3 holds as this ♭7; its ♭7 falls a whole step onto this ♭3' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'sit' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'the same two names trade straight back' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'hold' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'suddenly a tritone — the form\'s first true dominant crunch; the i\'s ♭7 climbed a whole step onto this 3rd' },
          { recipe: { LH: LH_R, RH: RH_SHARP9 }, note: 'both dyad voices fall a half-step, and the ♯9 lands on top — the i\'s own ♭7, back from its one-bar detour' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'the ♯9 keeps its key and goes back to being the ♭7; the V\'s ♭7 falls a whole step onto the ♭3' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'sit in the dark' },
        ],
        register: 'one bass note, two (then three) right-hand notes mid-keyboard; late-night volume',
        tips: 'Minor blues by subtraction: on the minor chords the 3-and-7 dyad is a hollow perfect fifth, and the moment the ♭VI7 arrives the same two degrees snap into a tritone — the form\'s harmonic drama is audible in one interval changing shape under two fingers. The V7♯9 is the only three-note chord of the night, and its ♯9 is the note the night was built on: the key\'s ♭7, recast as the scream. If it sounds empty, good — push the placement, not the note count.',
      },
    ],

    'blues-turnaround': [
      {
        label: 'Stormy Monday pillars (slow 12/8)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_9 }, note: '9th spread over root and 5th — uptown from the first beat' },
          { recipe: { LH: LH_R, RH: ['3', '7', 'b9'] }, note: 'VI7♭9: the I\'s ♭7 holds on as this ♭9; its 9 falls a half-step onto this 3rd; the bass drops a minor third' },
          { recipe: { LH: LH_R5, RH: RH_9 }, note: 'the ♭9 sighs a half-step down onto this chord\'s 5th; the VI\'s ♭7 falls a whole step onto this ♭3' },
          { recipe: { LH: LH_R5, RH: RH_13 }, note: 'V13: the ii\'s 9 and ♭3 hold (as this 13 and ♭7); its ♭7 falls a half-step onto this 3rd — the ii–V law' },
        ],
        register: 'LH low anchors, RH stacks around middle C; slow 12/8, roll the big ones',
        tips: 'The uptown turnaround under one thread: a single key does three jobs in three bars — it starts as the I\'s ♭7, holds on as the VI7\'s ♭9, then sighs a half-step onto the ii\'s 5th. Back into bar 1 both of the V\'s guide tones fall a half-step (♭7 onto the I\'s 3rd, 3rd onto the I\'s ♭7), so the wheel never clunks. T-Bone Walker\'s "Stormy Monday" intro walks a close cousin of this cycle, as the progression card says — learn it here as hand motion and the uptown blues stops being mysterious.',
      },
      {
        label: 'Jump kicks (two-beat shells)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'guide tones only — this cycle usually gets two beats per chord' },
          { recipe: { LH: LH_R, RH: GT_73 }, note: 'the one athletic move: I and VI share no guide tones, so both voices hop up a minor third' },
          { recipe: { LH: LH_R, RH: GT_37 }, note: 'the VI\'s 3rd falls a half-step onto this ♭7; its ♭7 a whole step onto this ♭3' },
          { recipe: { LH: LH_R, RH: GT_73 }, note: 'the ii\'s ♭3 holds as this ♭7; its ♭7 falls a half-step onto this 3rd — then both voices sigh a half-step into bar 1' },
        ],
        register: 'short stabs either side of middle C; two-beat changes, land them with the drummer',
        tips: 'The turnaround at jump tempo: two-note kicks placed with the drummer, two beats per chord when the band squeezes the cycle into two bars. One lap costs one athletic move — the minor-third hop into the VI, the only seam in the loop where a voice has to leap — and after that every voice holds or resolves by half-step or whole step back to the top. Drill the lap until the hop is automatic; it is the same physical seam as bar 8 of a jazz blues.',
      },
    ],
  },

  improv: {
    scales: [
      {
        over: 'the whole form (I7–IV7–V7)',
        scale: 'the key\'s blues scale',
        why: 'One scale over all three chords is the genre\'s licence, and the chords themselves pre-clear the "wrong" notes: the scale\'s ♭3 is the I7\'s ♯9 and the IV7\'s ♭7, and its ♭7 is the V7\'s ♯9.',
      },
      {
        over: 'I7',
        scale: 'mixolydian, mixed with the blues scale',
        why: 'Mixolydian supplies the chord, the blues scale the attitude — switch phrase by phrase. The ♭3→3 crush (a half-step, played as a grace note) is the pianist\'s string bend: piano can\'t bend, so it crushes.',
      },
      {
        over: 'IV7',
        scale: 'mixolydian from the IV',
        why: 'Its ♭7 is the key\'s ♭3 — bar 5 re-tunes the blue note into a chord tone. Target it on the downbeat of the change and the room hears you hear the form.',
      },
      {
        over: 'V7',
        scale: 'mixolydian from the V',
        why: 'And keep the key\'s ♭7 on call: over the V it becomes the ♯9, the crying note. Let it melt a half-step down onto the natural 9 — the classic slow-blues resolution.',
      },
      {
        over: 'i7 (minor blues)',
        scale: 'minor pentatonic of the key',
        why: 'The minor form pre-clears everything, and it mostly survives bar 9: three of the ♭VI7\'s four chord tones already sit inside the key\'s blues scale. The one outside note is the ♭VI\'s own root — lean on it only if you want the dark.',
      },
    ],
    targetNotes:
      'Land the 3rd of each chord on the downbeat of the change — bars 5, 9 and 10 are the exam. Treat the two blue notes as a budget with a schedule: the key\'s ♭3 crushes into 3 over the I and sits still as the ♭7 over the IV; the key\'s ♭7 is home over the I and becomes the ♯9 the moment the V arrives. Between phrases, silence — a blues chorus is a conversation, and the piano already talked.',
  },

  // Structured piano licks (SCHEMA.md "Piano licks", task P-60). Degree-based
  // and key-agnostic: every deg resolves through the stated quality (all four
  // licks sit on dominant stations — the blues' native chord; the pentatonic
  // fall's tip notes where it survives the minor form too). Realized offsets
  // in the comments use a C-rooted chord; every interval claim in notes/tips
  // was recomputed from those offsets before writing (P-41 bar).
  licks: [
    {
      // Over C7: (E♭4)E4 G4 C5 B♭4 G4 (E♭4)E4 — offsets [3]4 7 12 10 7 [3]4.
      // Both crushes are the ♭3 (3) into the 3rd (4), same beat.
      id: 'blues-b3-crush',
      name: 'The ♭3 crush',
      level: 'foundation',
      chordContext: 'over the I7',
      quality: 'dom7',
      techniques: ['grace-note'],
      source: 'the ♭3→3 crush as the pianist\'s string bend — piano-ology "Killer Blues Piano Grace Notes"',
      notes: [
        { deg: 'b3', beat: 1, technique: 'grace-note' },
        { deg: '3', beat: 1 },
        { deg: '5', beat: 1.5 },
        { deg: '1', octave: 1, beat: 2 },
        { deg: '7', beat: 2.5 },
        { deg: '5', beat: 3 },
        { deg: 'b3', beat: 3.5, technique: 'grace-note' },
        { deg: '3', beat: 3.5 },
      ],
      tips: 'Strings bend; the piano crushes. Flick the ♭3 into the 3rd almost as one gesture, walk straight up the chord (3, 5, octave root), answer back down (♭7, 5), and close with the same crush that opened the phrase — one blue note, spent twice.',
    },
    {
      // Over C7: C5 B♭4 G4 F4 E♭4 C4 — offsets 12 10 7 5 3 0: the full
      // minor pentatonic (1 ♭7 5 4 ♭3 1) falling top to bottom on the
      // triplet grid, landing the low root on beat 3.
      id: 'blues-penta-fall-turnaround',
      name: 'Pentatonic fall (turnaround run)',
      level: 'foundation',
      chordContext: 'bar 11, over the I7, setting up the turnaround',
      quality: 'dom7',
      techniques: [],
      source: 'the descending minor-pentatonic run every blues pianist keeps — stock vocabulary; see pianogroove.com\'s Chicago Blues course',
      notes: [
        { deg: '1', octave: 1, beat: 1 },
        { deg: '7', beat: 1.33 },
        { deg: '5', beat: 1.67 },
        { deg: '11', beat: 2 },
        { deg: 'b3', beat: 2.33 },
        { deg: '1', beat: 3 },
      ],
      tips: 'Top to bottom of the minor pentatonic — root, ♭7, 5, 4, ♭3, root — in one triplet gesture, with a breath before the low root lands on beat 3 so the turnaround has somewhere to kick from. Over the I7 the run\'s ♭3 is the chord\'s ♯9 and the 4 passes between the 3rd and the 5th; the same six keys survive untouched over the i7 of a minor blues.',
    },
    {
      // Over C7, high dyads: E5+G5 ×4 (offsets 16+19, a minor third apart)
      // hammered on the triplet grid, then peeling down the chord:
      // C5(12) B♭4(10) G4(7).
      id: 'blues-spann-hammer-dyads',
      name: 'Spann hammer dyads',
      level: 'intermediate',
      chordContext: 'over the I7 — the high fill that cuts through a Chicago band',
      quality: 'dom7',
      techniques: ['double-stop'],
      source: 'in the Otis Spann lane — hammered right-hand triplet dyads, the postwar Chicago fill (Blues Hall of Fame)',
      notes: [
        { deg: '3', octave: 1, beat: 1 },
        { deg: '5', octave: 1, beat: 1, technique: 'double-stop' },
        { deg: '3', octave: 1, beat: 1.33 },
        { deg: '5', octave: 1, beat: 1.33, technique: 'double-stop' },
        { deg: '3', octave: 1, beat: 1.67 },
        { deg: '5', octave: 1, beat: 1.67, technique: 'double-stop' },
        { deg: '3', octave: 1, beat: 2 },
        { deg: '5', octave: 1, beat: 2, technique: 'double-stop' },
        { deg: '1', octave: 1, beat: 2.33 },
        { deg: '7', beat: 2.67 },
        { deg: '5', beat: 3 },
      ],
      tips: 'One dyad — the 3rd with the 5th a minor third above it — hammered four times on the triplet grid like a snare press, then the line peels off down the chord: octave root, ♭7, settling on the 5th. The repetition IS the lick; on a slow blues, stretch it toward a tremolo.',
    },
    {
      // Over C7 as the V7 (an F blues): E♭5(15) held, D5(14), B♭4(10),
      // G4(7), then the crush (E♭4=3)E4(4). The ♯9→9 melt is 15→14.
      id: 'blues-cry-melt-v7',
      name: 'The cry and melt (V7 fill)',
      level: 'intermediate',
      chordContext: 'over the V7, bar 9 of a slow blues',
      quality: 'dom7',
      techniques: ['grace-note'],
      source: 'the ♯9→9 "crying" resolution — pianogroove.com slow-blues lessons; the no-5th grip per piano-ology "Dominant 7(♯9) Voicings"',
      notes: [
        { deg: '#9', octave: 1, beat: 1 },
        { deg: '9', octave: 1, beat: 2 },
        { deg: '7', beat: 2.33 },
        { deg: '5', beat: 2.67 },
        { deg: 'b3', beat: 3, technique: 'grace-note' },
        { deg: '3', beat: 3 },
      ],
      tips: 'Lean on the ♯9 for a full beat — over the V7 it is the key\'s own ♭7, the crying note — then let it melt a half-step onto the natural 9, fall through the ♭7 and 5th, and land a ♭3 crush on the 3rd. Placement is the whole trick: bar 9 is the emotional peak of the form.',
    },
  ],
}
