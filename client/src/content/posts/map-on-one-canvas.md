title: Moving Lumischool's map to WebGL
date: 2026-10-16
about: Lumischool
cover: /img/posts/map-on-one-canvas-wide.webp
card: /img/posts/map-on-one-canvas-card.webp
summary: The map's earlier SVG and DOM renderer ran into memory limits on an iPhone. The current renderer uses tiles, cached artwork and WebGL, while keeping text and controls in the DOM.

In Lumischool, children explore lessons through an illustrated map. Moving that map to WebGL2 was mostly a decision about memory.

The earlier renderer placed SVG drawings in the DOM and scaled the world with the camera. It worked on a laptop and on the smaller sample map, but testing the full map on an iPhone exposed a problem: the page was being killed shortly after opening.

The investigation and its measurements are recorded in the repository's September rendering notes. The implementation has continued to change since then. This post distinguishes those historical results from the code reviewed on 16 October.

## The memory was not all in JavaScript

The investigation used the phone's kernel log, the browser's layer tree and Simulator memory measurements. The logs recorded the web content process exceeding a 2,048 MB limit on that device. That is a result from this test, not a universal limit for every iPhone or page.

One compositing layer used 216 MB, 415 MB and 540 MB at progressively smaller camera scales. Zooming out made the map look smaller while increasing the backing memory recorded for that layer.

![Historical measurements of one compositing layer at three map scales: 216 MB, 415 MB and 540 MB. These are observations from the recorded investigation.](figure:layer-memory)

There were other costs. The notes record roughly 27,000 elements and 500 MB of JavaScript heap for the parent map. Animations and overlapping composited content also increased the number of layers.

Some changes helped without resolving the failure. Reducing compositing and pausing animations lowered memory on the sample map. Replacing SVG terrain with image tiles reduced the footprint in a Mac test. Neither change was enough for the full map on the phone. A CSS zoom experiment reduced layer memory but changed text sizing in ways the map could not use.

The useful finding was that the DOM and JavaScript heap did not account for the whole cost. The browser's rendering layers needed to be part of the investigation.

## Drawing the map into a canvas

The current renderer uses WebGL2 for terrain and artwork. It draws the paper grid, terrain, progress masks and illustrations through a shared canvas. Text and interactive controls remain in a DOM overlay.

![A simplified view of the map's drawing stages: the grid, terrain, progress-dependent detail, illustration batches and moving foreground artwork.](figure:five-passes)

The camera changes how that content is positioned on screen. The renderer still has work to do when new content enters view, textures arrive or animations advance. Moving to a canvas gives the application more control over that work and its resource budgets; it does not make a pan or zoom free.

The scene schedules further frames while visible animation or preparation needs them. It can stop requesting frames when the scene has settled.

## Terrain and fine detail

Terrain is loaded from a tile pyramid, so the renderer can choose a resolution appropriate to the view. The tile pipeline uses content-addressed assets, allowing identical tiles to share an image.

Thin details, including coastlines and rivers, also have geometry-based rendering paths. Keeping these strokes separate from terrain images helps preserve their appearance across zoom levels. Progress masks control which parts of the map appear known, coloured or still in pencil.

The tile cache has an explicit memory allowance, currently 160 MiB on a normal device and 64 MiB on a device classified as small. These are tile-texture budgets, not the total memory used by the browser. Artwork, masks, canvas storage and JavaScript have additional costs.

## Reusing the existing illustrations

The renderer reads the output of the existing SVG drawing code. This matters because illustrations can vary with their seed, state and moving parts. A separate catalogue containing every possible rendered variation would be expensive to maintain.

The current code has several ways to obtain pixels. It first tries retained artwork, then looks for a matching prebuilt asset. When a suitable asset is unavailable, workers rasterize a display list of the drawing. The worker pool is capped at four, with device-dependent limits.

That is more specific than saying that every illustration is rendered at runtime. The implementation now supports both prebuilt artwork and on-demand rasterization.

Small drawings can share texture-atlas pages so the GPU can draw them in batches. Larger drawings use separate textures or tiles, depending on the scene and drawing size. A moving part can be represented separately, allowing it to animate without rasterizing the whole illustration again.

Worker rasterization also does not move all rendering work off the main thread. The page still prepares and reads drawing data, manages the scene and uploads textures. Those stages remain relevant when investigating a slow frame.

## Refining the view after movement

The renderer tries to keep useful pixels while the camera moves. It can request a sharper representation when the current one is no longer sufficient, then refine the view after movement settles.

![Texture reuse while the camera moves, followed by refinement after a settling delay. New pixels fade in when they are ready.](figure:reuse-settle)

The scene uses a 200 ms settling threshold and a 150 ms sharpening transition. The threshold starts refinement work; it is not a promise that every visible drawing will be ready exactly 200 ms after the camera stops. Scheduling, rasterization, asset loading and uploads can take additional time.

Caches release artwork under their budgets, and work near the visible area is prioritized. The goal is to reuse what is already available while directing new work toward what the child can see.

## Keeping the controls accessible

Place names, buttons and navigation remain in the DOM over the canvas. This keeps ordinary web controls available for keyboard interaction and accessibility rather than trying to infer them from pixels.

The drawing and interaction layers still have to stay aligned as the camera moves. Retaining DOM controls makes that task more manageable, but accessibility remains something to verify in the interface, not a property guaranteed by the choice of renderer.

## What the measurements establish

The historical notes report improved frame times on a Mac in Chrome. For panning, the recorded median fell from 33 ms with the earlier Canvas2D terrain to 8.3 ms, with the 95th percentile falling from 134 ms to 9.2 ms.

Those results describe that workload and implementation at the time of measurement. They do not establish current performance on every device. The reviewed report does not include a completed follow-up iPhone result, and this source review did not run a new device benchmark.

The current architecture makes texture reuse, work scheduling and memory budgets explicit. That is the part of the change I would carry into another large illustrated interface: inspect all the resources involved, then make their lifetime and cost manageable in the application.
