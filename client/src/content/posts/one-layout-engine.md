title: One tree, three formats
date: 2026-10-15
about: Galleo
cover: /img/posts/layout-engine-wide.webp
card: /img/posts/layout-engine-card.webp
summary: A deck, a document and a web page are the same content in three shapes. Making one layout pass draw all three, and the exports as well, meant not using the browser's layout at all.

A pitch deck, the document somebody asks for after the meeting, and the page you publish are usually three files. They begin as one idea and drift apart within a week, so the number you corrected in the deck is still wrong on the page, and the only person who knows which one is current is the person who last touched it.

Galleo treats them as one artifact rendered three ways. Most of the hard decisions in the product follow from that single choice, and the first of them was not to use the browser's layout engine. This is about what replaced it, what the replacement borrows from [Clay](https://nicbarker.com/clay), and what the borrowing cost.

## Why not let the browser do it

The browser is a layout engine that ships on every machine, and it is very good. The reason it does not work here is that its answers live in the document rather than in your hands.

To know where anything ended up you have to measure elements that are attached, laid out, and at the size you care about. One artifact that must exist as a deck at 1280 by 720, as a document column, as a published page at whatever width the visitor has, and as a thumbnail on a shelf is four live layouts, four times the work, and four opportunities to disagree.

The disagreement is the real problem. If the browser lays out the screen and a PDF library lays out the file, you have two layout engines with different ideas about where a line breaks, and every export is an approximation of what the person edited. You can get close. You cannot get identical, and the difference is exactly the kind of thing a person notices in the one document they are about to send to a client.

## What Clay is, and what it refuses to do

Clay is Nic Barker's 2D UI layout library: a single `clay.h` of about 4,800 lines of C with zero dependencies, not even a standard library link. The [README](https://github.com/nicbarker/clay) is worth reading in full, because the shape of the thing is unusual in a way that turns out to matter.

Every element declares a size per axis, and there are four ways to do it: fit, grow, percent and fixed. Fit sizes to the content, grow takes the space that is left, and the other two are what they sound like. That is the whole sizing vocabulary, and it is close enough to flexbox that you can hold it in your head on the first read.

It is immediate mode. You declare the entire interface between `Clay_BeginLayout()` and `Clay_EndLayout()` on every frame, and Clay keeps no retained state about what it drew last time.

Then there are the two things it refuses to do, which are the reason I took the model.

It does not draw. The output is a sorted array of render commands, rectangles and text and images and borders and scissor regions, and walking that array and putting pixels on a screen is your job. For a library aimed at games this is a practical necessity, since everybody has their own renderer. For what I needed it is the whole point: a layout that ends in a list of instructions rather than in pixels can be carried out by anything, including something that writes a file instead of drawing a frame.

It does not measure text either. You install a callback with `Clay_SetMeasureTextFunction()`, and the README says plainly that it is on the hot path and should be as fast as you can make it. Text measurement is the one thing a layout engine cannot do without and cannot do alone, so Clay draws the boundary there and hands the problem back to you.

## The port, and the one thing that changed

Galleo's engine is modelled on Clay and written in TypeScript. The sizing vocabulary is the same four modes, as a tagged union rather than macros. The solver resolves a tree in three passes, and the order is forced by text.

![The same tree resolved three times. Widths come down the tree, heights come back up, positions come down again. Text is measured in the middle pass, at the width the first pass has just given it.](/img/figures/three-passes.svg)

Widths go top-down, because a parent is the only thing that knows how much room there is to share out. Heights come bottom-up, because a paragraph has no height until something has told it how wide it is, and a row is as tall as its tallest child. Positions and alignment go top-down once both dimensions are known. Each pass is linear in the number of nodes, and at the end every box has an absolute x, y, width and height.

Sizes that can move are distributed rather than assigned: the solver grows or shrinks the flexible children into whatever space is available, while fixed and percent children stay where they are and the remainder overflows if it has to. This is the part that behaves most like flexbox, and it is also the part that a table has to borrow directly, because a table is the one element whose columns are shared across rows and sized to their content.

The thing I did not do is compile Clay itself. It builds to a 15kb WebAssembly module, which is tempting, and for most uses that is clearly the right move. It is the wrong move here because of the measure callback. It fires per text node, on the hot path, and in a browser the only authority on how wide a line of a particular font at a particular size will be is Canvas 2D, which lives in JavaScript. A WebAssembly solver would have to cross back into JavaScript for every text leaf in the tree. The crossing is where the time would go, so the solver stays on the same side of the boundary as the thing it keeps asking.

## Text is the invariant everything else leans on

There is one rule the whole design rests on: `measure(leaf, maxWidth)` must return identical metrics in the editor and in every export, or the exports drift from the screen.

So there is one measurement path. The editor measures with Canvas 2D. The export path reuses that same measurement rather than asking its own renderer. Theme fonts are bundled so that both are asking about a font that is actually present. The results are memoized, and the cache is thrown away when the browser fires `loadingdone` on the font set, because the first layout of a page can happen before a webfont has arrived and those metrics are wrong the moment it does.

That is a small amount of code and it is the part I would protect most carefully. Every guarantee further down the page is really this guarantee wearing a different hat.

## Formats are data, not code paths

Because the engine knows nothing about pages, a format is not a mode in the engine. It is a descriptor handed to the same solver.

![One tree, three profiles. The deck is a paged frame at 1280 by 720, the doc is a continuous column 816 wide, and the site fills whatever width it is given.](/img/figures/one-tree-three-formats.svg)

A deck is paged, 1280 by 720, one section per slide. A document is continuous, a column 816 points wide, which is 8.5 inches at 96dpi. A site is continuous and fills the width it is given. Alongside the dimensions each profile carries a type and space multiplier, the width below which a row of columns stacks, and what a paged render should do with a section taller than its frame.

Two consequences fall out of this that I did not plan for and would not give up. A custom page size is a data change rather than new layout code, so a deck that renders at 1080 by 1080 needed no engine work. And a theme switch, a window resize, an edit and a change of format are all the same operation: recompute. Immediate mode is what makes that affordable enough to do on a resize frame.

## One list, four backends

The solver returns two arrays. The first is the render commands in paint order: rectangles, text, images, and surfaces, which are the elements that draw themselves, such as charts and diagrams. The second is the regions, which are the boxes of every node that carries an id.

![The layout returns two arrays: the commands, in paint order, and the regions, which are the boxes of every node that carries an id. Four backends consume the commands; hit-testing consumes the regions.](/img/figures/command-list.svg)

Four things consume the command list. The DOM backend paints it into elements on screen. A 2D canvas backend paints it for presenting and for PNG export. The PDF writer emits vectors with the fonts embedded, so the text in the file is selectable and searchable rather than a picture of text. The PowerPoint writer is a hybrid: rectangles become autoshapes, each text leaf becomes a real text box with styled runs and the engine's own line breaks baked in, with PowerPoint's own wrapping and autofit switched off so that it never reflows the text and undoes the agreement. Self-painted surfaces go in as vector.

Hit-testing reads the region list. It is a separate output rather than a question you ask the DOM, which is what lets the same selection and drag code work on a canvas that has no elements in it at all.

## Pagination is a function over the list

If layout ends in a flat list, cutting a long flow into pages is not a layout problem any more. It is a problem about where to put the scissors.

![Cutting one flow into two pages. The break lands above the block that must not be split, so that block moves whole to page two, while the card's background is clipped to each page's window rather than closing at the seam and reopening.](/img/figures/fragment.svg)

The fragmenter is greedy. It looks for the lowest edge that does not split any command, and if there is no such edge inside a long paragraph it breaks at a line boundary instead, leaving a minimum number of lines on each side so that no page ends on a widow.

The interesting case is a container's own background. A card that straddles a page boundary should continue onto the next page, not close at the bottom of one and reopen at the top of the next. So a fill that spans its children is marked as such, and rather than forbidding a break it is clipped to each page's window. The break search ignores it entirely. A leaf's own fill, a swatch or a divider, is content and stays indivisible.

## What it costs

Everything above is the case for the approach. Here is the bill.

You write the layout features yourself, and there are more of them than you expect. Baseline alignment between siblings. Distributing leftover space. Clipping on one axis but not the other. Floating an element out of the flow and still having it participate in reading order. Each of those is a day you did not spend on the product.

You lose what the browser gives away. Accessibility is the clearest example: a DOM document has a usable accessibility tree by default, and a canvas has nothing, so the backend has to build one and keep it correct. Text selection across elements, find-in-page, and the dozens of small behaviours people expect from a web page are yours to implement or to live without.

Text layout is yours too. Wrapping, whitespace handling, tab stops, clamping a label to a fixed number of lines: all of it is code you own, tested against the one measurement path, because any disagreement there shows up as an export that does not match the screen.

And some judgements end up as constants in a file. When a section does not fit its frame, the engine re-composes it smaller rather than scaling the pixels, and it will not go below 70 percent, or below 11 pixels for the smallest text in the section, whichever binds first. Those two numbers are a taste decision about when a slide stops being readable, and they live in the code because there is nowhere else to put them.

If you are weighing the same choice, the question worth asking first is whether your output has to exist anywhere other than the screen. If it does not, use the browser; it is better at this than anything you will write. If it does, and if two renderers disagreeing by a few pixels would be a real problem rather than an annoyance, then owning the geometry is the cheaper path, and Clay's shape is a good one to borrow.
