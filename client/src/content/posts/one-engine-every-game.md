title: Rendering and testing Lumischool’s games
date: 2026-10-23
about: Lumischool
cover: /img/posts/one-engine-every-game-wide.webp
card: /img/posts/one-engine-every-game-card.webp
summary: Lumischool separates game logic from rendering. A shared WebGL2 view draws the games, while tests check turn-based levels through graph searches and lesson rounds through scripted play.

Lumischool’s game catalogue contained 46 games and 344 levels in the 17 October review. They share a WebGL2 renderer, which replaced an SVG-based view that gave moving sprites their own browser layers.

The game logic is separate from the page. A game describes its state and what should be drawn; the renderer turns that description into pixels. This separation also lets tests run the game logic in Node without opening a browser.

## Describing a game

The contracts in `engine/motion/scene.ts` describe two kinds of output. A turn-based game produces a `Scene` containing named drawing elements and their positions. An action game produces a `Frame` containing sprites, a camera and visual effects. Sprites refer to drawings in the shared illustration library, with their position, rotation and scale.

An action game provides functions to start a level, advance its state from input and describe the next frame. It also declares its simulation rate. A turn-based game defines positions, legal moves and an `apply` function that returns a new position. Keeping previous positions makes undo possible without reversing each operation.

Tests can call these functions directly and inspect the results. The game’s behavior can therefore be checked independently of its browser rendering.

![Input advances the game at its simulation rate. The game returns its updated state and a description of the frame for the renderer.](figure:game-loop)

## Sharing the renderer

`engine/ui/game-view.ts` draws sprites in GPU batches, along with lines, discs and other effects. `scene-view.ts` adapts turn-based scenes into sprites for the same view.

The texture atlas caches each distinct drawing configuration: its settings, seed, crop and size. It renders the drawing through the existing SVG renderer, decodes it and packs it into a 2,048-pixel texture page. Sprites using the same configuration can reuse that stored image.

The configured texture-page budget is 48 MB on an iPhone or a device reporting less than 4 GB of memory, and 96 MB elsewhere. Pages are evicted when the budget is exceeded. These limits cover the atlas pages, not the browser’s total memory use.

Text, feedback and controls remain in the DOM over the canvas. That preserves ordinary web elements for keyboard and accessibility support, which still need interface testing. Browser tests can also enable hidden sprite bounds to locate drawings by their keys.

Without WebGL2, turn-based games use a static SVG view. Action games display an unsupported-browser message instead.

The recorded performance run used a synthetic scene of 600 moving sprites, drawn 300 times in Chrome on an M4 Pro. Median main-thread work was 0.50 ms per frame, with a 95th percentile of 0.70 ms and a maximum of 1.00 ms. These are results for that harness and machine. The real-game portion of the harness did not complete in the recorded run, so it provides no frame-time result for those games.

![The shared game data supports GPU rendering, a static SVG fallback for turn-based games and tests in Node. Turn-based mechanics also expose a position graph for verification.](figure:one-renderer)

## Checking turn-based levels

`school/games/prove.ts` searches the graph of positions and legal moves. It uses breadth-first search and groups positions by their keys. This relies on a key identifying positions with equivalent future behavior.

The search has a position limit. Reaching it fails verification rather than returning a partial result as a complete check.

For a completed search, the verifier checks that a win is reachable within the move budget and the declared solution-length range. For games with irreversible moves, it also rejects dead ends and positions from which the remaining budget is insufficient.

Another check models uniformly random legal play. For irreversible games, the chance of winning must stay below a declared threshold. For reversible games, the median number of random moves needed to win is compared with the shortest solution. These are properties of the model, not measurements of how children play or learn.

The recorded run covered 29 activity variants and five levels of the turn-based game, searching 34 graphs and 7,332 positions in 132 ms on the authoring machine. None reached the position limit. Those counts and timing describe that run, not a performance guarantee.

The browser also uses the search to suggest a move that gets closer to a win after a period without progress.

## Checking action-game rounds

The reviewed catalogue had 45 action games and one turn-based game. Action games accept continuous input, so these tests do not enumerate all possible play as a position graph.

Twenty games declared a round for use inside a lesson. The card tests run each declared round in Node using a game-specific input driver. They check that the round can be won using the available field controls, reports the win once, settles afterwards and finishes within its declared duration.

The other 26 games explicitly declare that they do not provide a lesson card. The card tests therefore do not establish a playable round for those games.

A successful scripted run shows that one tested input sequence works. It does not establish that every level is covered or account for all the ways a child might interact with it.

## What the checks cover

Some action games use mechanics that also have graph-based verification. The graph and the continuous controls still represent different behavior. For example, the pouring mechanic can be verified using whole pours, while the interactive game simulates the amount poured as a jug is tilted. A result for the discrete mechanic does not automatically establish the same result for every continuous interaction.

There are also two replay paths. `engine/motion/tape.ts` records inputs for playback and is used by the player and several tests. A separate `verifyReplay` in `engine/motion/verify.ts` checks whether a recorded solution reaches a win, but the reviewed publication path does not use it; it is exercised by its own test.

Some architecture comments describe broader verification than the implementation provides. The implemented checks are the useful boundary: a completed graph search establishes properties of the modeled positions, while scripted play checks a particular round and input sequence. Keeping that distinction explicit makes it easier to see where more testing is needed.
