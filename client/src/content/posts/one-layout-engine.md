title: One layout engine for decks, documents and websites
date: 2026-10-15
about: Galleo
cover: /img/posts/layout-engine-wide.webp
card: /img/posts/layout-engine-card.webp
summary: Galleo shares layout geometry between its editor and exports. How the solver works, why text measurement matters, and where the output formats still differ.

Galleo creates decks, documents and websites from shared content. Each format needs a different layout, but the editor and exported files need to agree about where that content belongs.

The rendering system separates layout from drawing. A TypeScript solver calculates positions and dimensions, then returns commands that the screen and export backends can use. This gives the product one place to resolve geometry while allowing each output to render it differently.

## Why use a shared solver

Browser layout is useful when the result is a web page. Galleo also needs geometry for presentation canvases, thumbnails, PDF and PowerPoint. Measuring a live DOM is one way to obtain it, but would tie those paths to browser layout and its lifecycle.

A separate solver makes the input and output explicit. It receives a content tree, an available rectangle and a text-measurement function. It returns drawing commands and regions for hit-testing.

This does not make every output identical. Fonts, clipping, effects and the capabilities of each file format still matter. It does remove the need for each backend to independently decide how much space an element should occupy.

## The layout model

The engine follows the box-layout model of [Clay, Nic Barker's C layout library](https://github.com/nicbarker/clay). Clay separates layout from rendering and lets the application supply text measurements. Galleo uses a TypeScript implementation of that approach rather than compiling Clay itself.

Each node declares a size on each axis: fit its contents, grow into available space, take a percentage, or use a fixed value. The solver resolves the tree in three stages before emitting commands.

![Widths are resolved from parent to child, heights from child to parent, then positions. Text is measured after its available width is known.](figure:three-passes)

Widths are calculated first because a parent determines the space available to its children. Heights follow, with text measured at the width it has been given. Once both dimensions are known, the solver calculates positions and alignment.

Flexible children can grow or shrink within their limits. Fixed and percentage sizes remain constrained, so a container can still overflow when its contents cannot fit. Tables reuse the distribution logic to size columns across rows.

Keeping the solver in TypeScript also keeps it alongside the browser's text-measurement code. That simplifies the integration. It is not, by itself, evidence that a WebAssembly implementation would be slower; that would require a comparison of the actual implementations.

## Text measurement is shared too

A shared rectangle is not enough if the editor and export disagree about line breaks. Text measurement is therefore part of the layout contract.

Galleo measures text with Canvas 2D and uses that measurement path when producing export geometry. Measurements are cached, and the rendering code invalidates cached results when fonts finish loading. That matters because an early layout may have measured a fallback font.

The export code also handles fonts explicitly. The vector PDF path embeds font data where available. PowerPoint text is emitted with the engine's line breaks and automatic wrapping disabled.

These choices reduce reflow between outputs. They still need tests: the solver, the measurement code and the format-specific writers can each introduce differences.

## Formats supply layout settings

A format profile describes the frame, content width, spacing and typography scales, responsive stacking, and overflow behavior.

![The deck profile uses a 1280 by 720 frame, the document profile a continuous 816-pixel-wide layout, and the website profile responds to the available width.](figure:three-formats)

The document's 816-unit width is a CSS-pixel layout dimension, approximately 8.5 inches at 96 pixels per inch. It is not 816 PDF points; the export path converts between the units it needs.

Changing a page size can therefore be a profile change without adding a new solver. A format change, resize or content edit can all request a new layout through the same interface. The cost still depends on the tree, text measurement and rendering work, so sharing the interface is not a performance guarantee.

## Shared geometry, separate backends

The solver returns drawing commands in paint order and a second list of node regions. Commands describe rectangles, text, images and self-rendering surfaces such as charts. Regions provide the boxes used for selection and hit-testing.

![The layout produces drawing commands for the DOM, Canvas 2D, PDF and PowerPoint, and a separate region list for hit-testing.](figure:command-list)

The DOM backend renders the editor. Canvas 2D supports presentation and image rendering. PDF and PowerPoint writers translate the same geometry into their own formats.

The distinction between geometry and output is important here. PDF supports a vector path, but the exporter also has raster fallbacks. PowerPoint can preserve suitable shapes and text as editable objects; other commands or effects may become images. Sharing layout does not mean that every element is editable or vector-based in every export.

## Pagination uses the command list

For a document, the fragmenter divides a continuous layout into pages. It searches for a break that avoids splitting content, then uses text-line boundaries when appropriate. The line-break logic tries to leave at least two lines on either side, with a hard break available when the content cannot satisfy the constraints.

![A continuous layout split into two pages, with content moved at a suitable boundary and a spanning background clipped to each page.](figure:fragment)

A background spanning a container's children is treated differently from a content block. It can be clipped across pages without forcing the entire container onto one page. That lets a long card continue while its content determines the break.

## The maintenance tradeoff

Owning layout also means owning wrapping, alignment, clipping and pagination behavior. Those features need explicit tests rather than relying entirely on the browser.

The format layer has readability limits too. Its fit logic uses a scale floor of 0.7 and a minimum text size of 11 pixels when deciding how far to reduce a section. Those are product choices encoded as constraints, not proof that every slide will remain readable.

For Galleo, the value is having a shared description of the geometry across the editor and exports. The remaining work is to make each backend faithful to it and to handle the places where the output formats differ.
