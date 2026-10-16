title: The map a phone could not hold
date: 2026-10-16
about: Lumischool
cover: /img/posts/map-on-one-canvas-wide.webp
card: /img/posts/map-on-one-canvas-card.webp
summary: Lumischool's lessons sit on one hand-drawn country, and drawing it as SVG in the page killed the tab on an iPhone within seconds. The fix was to stop asking the browser's compositor to be a map engine.

Lumischool is a year of lessons for children, and the thing that holds them together is a map: one hand-drawn country with 41 worlds on it and 221 drawings between them, which a child walks through a term at a time. It was drawn the obvious way, as the same SVG the lessons are drawn with, placed in the page and scaled by the camera. That worked on a laptop and it worked on the small sample map we test with. On an iPhone, the real country killed the tab.

This is what the measurements said, what we tried that did not work, and the renderer that replaced it.

## What the phone was actually doing

The first reports were the kind you cannot act on: the map opens, the page goes white, sometimes it takes a few seconds and sometimes half a minute. Nobody had to touch anything. Two rounds of plausible fixes made no difference, which is usually a sign that the thing being fixed is not the thing that is wrong.

So we connected a phone to a Mac and read three things at once: the kernel's log through `idevicesyslog`, the page's layer tree through `ios_webkit_debug_proxy`, and the page process's memory footprint in the Simulator.

The kernel was killing the web content process for passing its hard limit of 2,048 MB. The kills we logged came between 2.1 and 3.4 GB, one to thirty-six seconds after the map opened.

![One layer under a map scaled down to fit: the further the camera draws back, the larger the backing store WebKit keeps for it. The page held seventy-one layers at the opening view, and iOS kills the tab at 2,048 MB.](figure:layer-memory)

Where the memory went is the part worth knowing. WebKit gives a composited layer a backing store sized as if its contents were at scale one, clipped to a cap that grows as the camera pulls back. Measured on the opening view of the real map, one layer was 216 MB at a zoom of 0.084, 415 MB at 0.039, and 540 MB at 0.0069. Drawing the camera back makes the map look smaller and makes the layer behind it larger.

On top of that, a composited element pulls in whatever overlaps it, so a single animated drawing near the bottom of the country promoted everything above it. Three ordinary things started that cascade: `will-change: transform` on the terrain surface, the paper canvas under the world, and the idle animation on every travelling drawing. At the sample map's opening zoom the page held 71 layers and 2,557 MB of them.

The parent map added 27,089 elements and about 500 MB of JavaScript heap to that, and its one world layer was repainted roughly twice a second while nothing moved.

## The three fixes that did not work

Keeping the world as a single layer and resting the animations below a zoom of 0.3 brought the sample map down to 250 MB at rest and 580 MB at its worst. The real map still died, because its single layer was still 540 MB at the opening view.

Drawing the terrain from image tiles instead of SVG was the next guess, and it did nothing for the crash, because the terrain was never the cost. It did lower WebKit's footprint on a Mac from about 1.4 GB to about 0.95 GB while flying, which is a real improvement and the wrong problem.

Using CSS `zoom` on the world rather than `transform: scale` held the layers to between 72 and 212 MB, which looked like the answer for an afternoon. Then the place names grew to fill the screen, because iOS enforces a minimum size on text shrunk by zoom.

Each of those is a way of asking the browser's compositor to behave like a map engine. Map engines do not work that way. They draw into one GPU canvas from tiles and atlases, and a pan or a zoom changes a matrix rather than asking anything to repaint.

## What a frame is now

The map is one WebGL2 canvas with a renderer of our own, about as much as a tile layer, a sprite batch, a line batch and a grid need. A frame is drawn in a fixed order.

![The five passes of a frame, in order: the paper grid from a shader, the terrain tiles masked by what the child has reached, the child's own ink, every drawing in view as instanced batches, and the plane and the guide's token on top.](figure:five-passes)

The renderer asks for a frame only when the camera moves or something visible is playing. At rest it asks for nothing.

We wrote it rather than taking PixiJS, which would have added about 450 KB to a screen whose whole script budget is 380 KB. What the map needs is textured quads, instanced sprites, lines and a grid, and that is a smaller thing than a general engine.

## The terrain is data, not pictures

The country is exported once as a pyramid of seven levels of 256-pixel tiles, from a single tile at the top to a 64 by 56 grid at the bottom. Each cell exists in seven layers, which is 33,467 cell-and-layer slots in total, and most of them are identical: empty sea, blank paper, flat land.

![Seven levels of tiles in seven layers, 33,467 slots in all, folded by content address into 6,680 images and 26 MB of PNG. Most slots are sea or blank paper and collapse into one another.](figure:tile-pyramid)

Folding them by content address brings 33,467 slots down to 6,680 images and about 26 MB on disk. The export takes about eight minutes, which is fine for something that runs when the country changes rather than when a child opens it.

The thin strokes are deliberately not in those rasters. Coasts, contour rings, rivers and lakes are cut once into straight segments and drawn instanced as capsules, with their dashes, their fade at the country's edge and their antialiasing all worked out in the fragment shader. The washes and islands are filled even-odd through the stencil buffer, so no polygon is ever triangulated on the processor. Keeping them as vectors is what lets a coastline stay a crisp line at any zoom instead of a resampled picture of one.

What the child has done is a mask rather than a redraw. Where the map is known, where the colour has reached, and the hatched rim at its edge are drawn into a screen-sized target each frame, and every other pass reads the channel it needs where it lands on the screen. A mask is never magnified or shifted, which is why the edge of the known world stays sharp while the camera moves.

## The atlas that could not be built ahead of time

The design said the drawings would become a sprite atlas at build time, exported from the same catalogue the page draws from. That was the plan for about a week, and it was wrong.

Every placed drawing takes its sketch's seed from where it stands, so no two are the same drawing: two windmills a kilometre apart have different pencil strokes. They are also drawn in whatever state they are in, which means in pencil or in colour, in a season, with whatever the child has lit. A build-time atlas would have had to hold every drawing in every state at every size, which runs to hundreds of megabytes, and it would still have left the painters' layout to be written a second time inside the renderer.

So the atlas is filled while the map runs, and none of the filling happens on the page's thread. A drawing's SVG is read into a display list of paths, text and groups. A pool of up to four workers draws that list on a canvas of its own at the size the camera wants, composites each group's opacity as SVG would, and posts the pixels back. A drawing that fits a 512-pixel cell goes into a 2,048-pixel page with four pixels of padding around it, so the two levels of mipmaps cannot reach a neighbour; anything larger keeps a texture of its own. Drawings that land on the same page are drawn as one instanced batch, nineteen floats an instance, carrying the transform, the crop, the opacity, the tone and the mask.

The part I would keep in any version of this is that the painters never changed. The same code draws the screen, the printed poster and the test snapshots, and the renderer reads what it produces out of a container the page is told never to lay out.

## Keeping the pixels you already have

Rasterising an SVG is not free, and it happens on the main thread when it happens at all, so the scene is careful about asking for it twice.

![While the camera moves a drawing keeps the texture it already has, unless it would look more than twice as soft. Two hundred milliseconds after the camera rests it is drawn again at exactly the size it is seen, and the sharper pixels fade in over the softer ones.](figure:reuse-settle)

A drawing is rasterised at a power-of-two scale and keeps that texture while the camera stays within a factor of two of it. Two hundred milliseconds after the camera stops, everything in view is redrawn at exactly the size it is being shown, and the sharper version fades in over the softer one across 150 milliseconds rather than snapping. A part that moves on its own, a windmill's sails or a volcano's smoke, is a texture of its own, so the drawing around it is not rasterised again on every frame.

Textures are held against budgets rather than counted: the terrain keeps 160 MB of tiles on a normal device and 64 MB on a small one, the drawings' atlas pages have their own allowance, and in both cases the least recently drawn go first. The finest tile level a view will ask for is the finest whose textures fit inside 60 percent of the tile budget. The canvas itself is capped at four million backing pixels, which is about twice the CSS pixels of a phone.

## The text never went onto the canvas

Everything a person reads or presses is still in the DOM, in an overlay over the canvas: the names, every place as a real button with a 44-pixel target and the keyboard order the map always had, the HUD, the flight controls. A canvas has no accessibility tree, and building one by hand to describe a country that a screen reader could already read correctly would have been a straight loss.

The rule that matters is that nothing in the overlay may have a layer of its own, since that is precisely what started the cascade we were escaping. The plane is the interesting case: the craft, its rider and its shadow are moved by script every frame, so they are marked as live and drawn by the renderer from their transforms, while the button that launches them is an ordinary DOM button.

## What it cost

Two faults took a day each to find. The mask pass drew into a texture that was still bound for reading, which WebGL treats as a feedback loop and silently refuses, so every polygon fill into the masks was being dropped. And tiles that happened to load while the context was lost were marked failed for thirty seconds, which looked like a slow network rather than a bug.

The measurements, on a Mac in Chrome over the real map: panning holds a median frame of 8.3 ms and a 95th percentile of 9.2 ms, where the Canvas2D terrain held 33 and 134 ms. Zooming holds a median of 8.3 ms with a 95th percentile between 9 and 17 ms, against 59 ms before the drawings were rasterised by the workers. Fast flight with turns runs at 17 ms. What is left is the occasional frame of 33 to 59 ms, which is the painter building a new place with rough.js as the camera arrives at it.

The honest gap is the phone. Everything above was measured on a Mac. The device pass needs a staging service that can be opened over HTTPS from a phone, that service has not been created, and until it is, the thing I can say about the iPhone is that the old renderer killed the tab and the new one is built not to. That is a reasonable expectation and it is not a measurement.

There is also a quieter cost. The SVG painters still run on every frame the camera moves, into a container the page never lays out, and the scene reads them back. That keeps one painter for the screen, the poster and the snapshots, which is worth a great deal, and it means the browser is still doing SVG work in the background of a renderer written to avoid exactly that. If the next bottleneck is anywhere, it is there.

If you are looking at a page that dies on a phone and survives everywhere else, the useful advice is the one that cost us three wrong fixes: read the compositor before the heap. The JavaScript heap was a fifth of the problem and the first place everyone looked, and the layer tree, which nobody looks at, was the rest of it.
