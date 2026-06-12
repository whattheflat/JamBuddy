// KB registry — the UI reads only this. Each style folder registers here;
// instruments appear as their cells are completed (see docs/kb-backlog.md).
import jazzMeta from './jazz/meta.js'
import jazzProgressions from './jazz/progressions.js'
import jazzGuitar from './jazz/guitar.js'

export default {
  jazz: {
    meta: jazzMeta,
    progressions: jazzProgressions,
    instruments: { guitar: jazzGuitar },
  },
}
