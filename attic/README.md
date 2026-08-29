# attic

Nothing in here is loaded by anything. It is parked, not deleted, so Mark can
look at it and decide.

## app.mjs.dead-2026-08-28

A 2330-line copy of the app that sat in the repo ROOT while the live one, at
`js/app.mjs`, was 2857 lines. Nothing referenced it: `index.html` loads
`js/app.mjs` and `sw.js` precaches `js/app.mjs`. It still imported `nextAction`
from `library.mjs`, which no longer exists, so it had been dead for a while.

It was found on 2026-08-29 by the decoy gate in `test/check.mjs`, which now
fails if any root-level module shadows a shipped `js/` one. That gate exists
because this is the trap where you edit a file, reload, see no change, and then
spend an hour explaining the wrong thing.

Moved rather than deleted: deleting is Mark's call. If he does not want it,
`rm -rf attic/`.
