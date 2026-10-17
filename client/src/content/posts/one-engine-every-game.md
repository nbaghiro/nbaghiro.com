title: One renderer for every game, and two ways to check a level
date: 2026-10-23
about: Lumischool
cover: /img/posts/one-engine-every-game-wide.webp
card: /img/posts/one-engine-every-game-card.webp
summary: Lumischool's games hand the engine plain data: a position with its legal moves, or a frame of keyed sprites. One WebGL2 renderer draws all of them, and the same description is what the build gate reads, though what the gate can establish differs by the kind of game.

Lumischool has 46 games across 344 levels, reached from the same map its lessons are on. One WebGL2 renderer draws all of them. That is recent. Until this autumn the games were drawn the way the lessons are: every drawing rendered from the art shelf as SVG, with each moving sprite given a layer of its own for the browser to rasterise once and then only move. Above that sat two runtimes, one for the games that move by themselves and one for the games played a move at a time. All three files are now deleted.

That was cheaper than it sounds, because of an older decision. A game never touches the page.

## What a game hands over

`engine/motion/scene.ts` holds the two shapes a game describes itself in. A turn game gives a `Scene`: parts named by key, each one a drawing from the art shelf, placed on a sheet of squares. An action game gives a `Frame`: keyed sprites under a camera, the marks the pen draws over them, any water, any lights, and the bursts. Neither carries a pixel. A sprite names its drawing, where it stands in world squares, how it is turned and how it is scaled.

The rest of a game is functions. An action game declares `rate` steps a second, a `start(level, seed)`, a `step(s, pad)` that reads the buttons and returns what happened, and a `frame(s)` that describes what to draw now. A turn game declares a mechanic: a position, the moves legal in it, and an `apply` that returns a new position rather than changing the one it was given, which is what makes undo free.

Nothing in either list needs a browser, so Node can call `start`, `step` and `frame` and read what comes back. That is how most of the games' tests run.

![The page reads the pad at a fixed rate, the game steps and returns what happened, and the frame it describes is handed to the renderer. The state stays inside the game and the frame carries no pixels.](figure:game-loop)

## One renderer

`engine/ui/game-view.ts` takes a frame and draws it: sprites as instanced batches, marks as lines and discs, bursts as sprites, over the paper's grid. The textures come from `game-atlas.ts`, and its unit of work is a look. A look is a shelf drawing with its settings, seed, crop and size, rendered once through the ordinary SVG renderer at the size it will be shown, decoded, and packed into a 2,048 pixel page, so a thousand sprites sharing one look cost one place in a page. Pages are held to 48 MB on an iPhone or a device reporting under 4 GB of memory, 96 MB elsewhere, and evicted past that.

A turn game's board goes through the same view: `scene-view.ts` turns the scene's parts into sprites, steps the springs and sways itself, and hands them down, so one renderer draws both kinds of game.

Two things stay in the page over the canvas. The words a game writes are DOM, where a screen reader and the keyboard still find them. And with `probe=1` in the address, or in any browser that reports itself as automated, a hidden copy of every sprite's box is kept, so browser tests can still find a sprite by key.

Where WebGL2 is missing the two kinds part company. A turn game falls back to `still-view.ts`, which draws the same frames as SVG with no motion. An action game does not: the page says it needs a newer browser and stops there.

A synthetic scene of 600 moving sprites, drawn 300 times through the real view, costs a median of 0.50 ms of main-thread work per frame, a 95th percentile of 0.70 and a worst frame of 1.00, in Chrome on an M4 Pro. That is the harness's own scene rather than a game, on one machine, against a budget that fails above 4 ms. The half of the script that plays six real games did not run for me, so the games' own frame times are unmeasured.

![One description, several readers: the GPU view, the SVG still view, a Node test reading the frame, and for a mechanic the prover walking the position graph behind it.](figure:one-renderer)

## Whether a level can be won

Having the game as data makes the question askable before anything ships, and it has two answers that are not equally strong.

For a mechanic, `school/games/prove.ts` walks the position graph breadth first, collapsing any two positions whose `key` matches, because two positions with the same key have the same future. There is no depth limit, only a cap on positions, and hitting the cap is a failure rather than an approximation: a level whose space cannot be searched is one nothing can be promised about. Then it checks three things. A win has to be reachable, inside the level's move budget, and inside the range of solution lengths it declared. Where a move cannot be taken back, there may be no dead ends and no positions whose win has drifted out of budget. The third clause is read differently for the two families: where moves are spent, the chance that uniformly random legal play wins has to stay under a declared `luck`; where moves can be taken back, the median number of random moves to a win has to be at least a declared `patience` times the shortest win, so that thinking is visibly faster than poking.

That luck figure is computed exactly over the graph rather than sampled, which is what lets a level with a few thousand positions be proved in the page as well as in a test. The code is careful about it: random play is a weak model of a five-year-old at a screen, so the number is an upper bound rather than a measurement.

The gate covers 8 activities with 29 versions between them, plus the 5 levels of the one turn game in the catalogue. Proving all 34 walks 7,332 positions and takes 132 ms on my laptop. The largest single graph is a version of `spell.the-picture` at 1,555 positions. Every one is searched to the end, and the test asserts that none was capped. The same search runs in the page, where the guide points at a move that gets closer to a win after twenty seconds without one.

## The other 45

45 of the 46 games are action games. Exactly one, shut the box, is a turn game. An action game has no position graph: it steps at a fixed rate from a continuous input, and what a finger can do is not a list.

Those are gated by tests that play. Twenty of the 46 declare how they run as a card inside a lesson, and for each one a round is played in Node by hands written for that game, with no buttons, using only what the field itself can give. The round has to be won, to say it ended won, to say so once, to settle afterwards, and to fit inside the minutes the game claimed. The hands are specific: a driver that lifts off early enough to roll into each bay and never brakes hard, a pilot that climbs and dives, a plan built through the real game. The other 26 declare `card: null`, which the gate makes them say rather than leave blank.

## What this does not establish

Eight action games play the versions of one of those eight activities, so the same level is both proved as a graph and played with continuous controls. The proof is about the moves the mechanic lists. `pour-hands.ts` scopes its own claim correctly: the prover shows every level can be won with whole pours, while the child pours by tipping a jug and the amount that lands is whatever the simulation gives. The architecture comment in `game.ts` is more confident than the code it describes. It says a hands-on game's controls each choose one of the moves the mechanic already lists, so the prover's guarantee holds for the game a child plays. That is written for a category which currently has one member.

The same comment says an action game's gate is a set of named invariants and a seeded replay. There is no named-invariants mechanism in the code; the phrase appears in that comment and nowhere else. The seeded replay is real, but it is the tape in `engine/motion/tape.ts`, which records the pad each step read, so playing it back into a fresh start is the same try again. That is what the player uses to show a try back, and several games' tests drive it.

A separate `verifyReplay` in `engine/motion/verify.ts` replays a recorded solution and reports whether it reaches the win. Nothing ships through it: it is referenced only by its own test. That was already so when I wrote about the exercise verifier.

So the two gates differ in kind. For a mechanic, the build knows the whole space and refuses a level on a measured property of it. For an action game, the build knows that one careful way of playing wins inside the time claimed. The second is a weaker statement than the first, and it is the one that covers almost every game a child will open.
