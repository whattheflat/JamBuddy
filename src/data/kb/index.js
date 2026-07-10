// KB registry — the UI reads only this. Each style folder registers here;
// instruments appear as their cells are completed (see docs/kb-backlog.md).
import jazzMeta from './jazz/meta.js'
import jazzProgressions from './jazz/progressions.js'
import jazzGuitar from './jazz/guitar.js'
import jazzPiano from './jazz/piano.js'
import bluesMeta from './blues/meta.js'
import bluesProgressions from './blues/progressions.js'
import bluesGuitar from './blues/guitar.js'
import bluesPiano from './blues/piano.js'
import rockMeta from './rock/meta.js'
import rockProgressions from './rock/progressions.js'
import rockGuitar from './rock/guitar.js'
import bossaMeta from './bossa/meta.js'
import bossaProgressions from './bossa/progressions.js'
import bossaGuitar from './bossa/guitar.js'
import funkMeta from './funk/meta.js'
import funkProgressions from './funk/progressions.js'
import funkGuitar from './funk/guitar.js'
import reggaeMeta from './reggae/meta.js'
import reggaeProgressions from './reggae/progressions.js'
import reggaeGuitar from './reggae/guitar.js'
import countryMeta from './country/meta.js'
import countryProgressions from './country/progressions.js'
import countryGuitar from './country/guitar.js'
import rnbMeta from './rnb/meta.js'
import rnbProgressions from './rnb/progressions.js'
import rnbGuitar from './rnb/guitar.js'
import rnbPiano from './rnb/piano.js'
import gospelMeta from './gospel/meta.js'
import gospelProgressions from './gospel/progressions.js'
import gospelGuitar from './gospel/guitar.js'
import gospelPiano from './gospel/piano.js'
import popMeta from './pop/meta.js'
import popProgressions from './pop/progressions.js'
import popGuitar from './pop/guitar.js'

export default {
  jazz: {
    meta: jazzMeta,
    progressions: jazzProgressions,
    instruments: { guitar: jazzGuitar, piano: jazzPiano },
  },
  blues: {
    meta: bluesMeta,
    progressions: bluesProgressions,
    instruments: { guitar: bluesGuitar, piano: bluesPiano },
  },
  rock: {
    meta: rockMeta,
    progressions: rockProgressions,
    instruments: { guitar: rockGuitar },
  },
  bossa: {
    meta: bossaMeta,
    progressions: bossaProgressions,
    instruments: { guitar: bossaGuitar },
  },
  funk: {
    meta: funkMeta,
    progressions: funkProgressions,
    instruments: { guitar: funkGuitar },
  },
  reggae: {
    meta: reggaeMeta,
    progressions: reggaeProgressions,
    instruments: { guitar: reggaeGuitar },
  },
  country: {
    meta: countryMeta,
    progressions: countryProgressions,
    instruments: { guitar: countryGuitar },
  },
  rnb: {
    meta: rnbMeta,
    progressions: rnbProgressions,
    instruments: { guitar: rnbGuitar, piano: rnbPiano },
  },
  gospel: {
    meta: gospelMeta,
    progressions: gospelProgressions,
    instruments: { guitar: gospelGuitar, piano: gospelPiano },
  },
  pop: {
    meta: popMeta,
    progressions: popProgressions,
    instruments: { guitar: popGuitar },
  },
}
