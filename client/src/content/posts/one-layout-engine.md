title: One layout engine, four places it draws
date: 2026-10-15
about: Galleo
summary: A box solver modelled on Clay, ported to TypeScript, and why the export matching the screen is a byproduct of it rather than a feature.

Galleo renders everything through one layout engine: a box solver modelled on [Clay](https://nicbarker.com/clay), the C layout library, ported to TypeScript. Every node declares a size per axis, fit, grow, percent or fixed, and the solver resolves the tree in three O(n) passes: widths top-down, heights bottom-up with text measured at the width it has just been given, then positions and alignment top-down.

What comes out is not a DOM. It is a flat list of render commands, rects, text runs, images and surfaces, and a second list of regions for hit-testing. `layout(node, size)` is the whole public surface.

## Formats are data, not code paths

The engine knows nothing about pages, formats, breakpoints or fonts. A deck is 1280 by 720 with one section per slide, a document is a centred column, a site fills the width, and all three are profiles handed to the same solver. A theme switch, a window resize, an edit and a new page size are then the same operation: recompute. Immediate mode is what makes that cheap enough to run per frame.

That is also why a custom page size is a data change rather than new layout code, and why the same section can be a slide in the morning and a paragraph in a report in the afternoon.

## Text is the one hard invariant

The measure callback has to return identical metrics in the editor and in every export, or the PDF drifts from the screen. The editor measures with Canvas 2D, the export path reuses that same measurement, and the theme fonts are bundled so the two agree.

It is also the reason the engine is plain TypeScript rather than WebAssembly. The callback fires per text node, and crossing that boundary per call is where the time would go. A faster solver that has to ask JavaScript how wide a line is on every leaf is not faster.

## What falls out of the single pass

Export is not a second renderer, so a PDF or a PowerPoint is the same geometry written out differently. Pagination is a function that slices the command list at a clean edge, never through a block. The covers on the library shelf are the same thing at thumbnail size: each one is the artifact re-rendered, which is why they change when the theme does.

None of that is a feature anybody asked for. It is what you get when there is only one place that decides where things go.
