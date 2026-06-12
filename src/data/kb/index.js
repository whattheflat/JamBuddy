// KB registry — the UI reads only this. Each style folder registers here;
// instruments appear as their cells are completed (see docs/kb-backlog.md).
import jazzMeta from './jazz/meta.js'
import jazzProgressions from './jazz/progressions.js'
import jazzGuitar from './jazz/guitar.js'
import bluesMeta from './blues/meta.js'
import bluesProgressions from './blues/progressions.js'
import bluesGuitar from './blues/guitar.js'

export default {
  jazz: {
    meta: jazzMeta,
    progressions: jazzProgressions,
    instruments: { guitar: jazzGuitar },
  },
  blues: {
    meta: bluesMeta,
    progressions: bluesProgressions,
    instruments: { guitar: bluesGuitar },
  },
}
