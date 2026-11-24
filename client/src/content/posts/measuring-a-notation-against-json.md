title: Measuring a notation against JSON
date: 2026-10-23
about: Lumischool
cover: /img/posts/measuring-a-notation-against-json-wide.webp
card: /img/posts/measuring-a-notation-against-json-card.webp
summary: Lumischool writes its lessons in a small notation rather than JSON. This separates the syntax from the vocabulary, measures what a swap to JSON would actually replace, counts what the content files would lose, and says what would change the decision.

Writing your own text format is the kind of decision that attracts opinions. Lumischool keeps its lessons in a small notation rather than in JSON, and the fair question, asked more than once, is whether that is worth a parser nobody else can read.

The useful way to answer it is to measure rather than argue: how much of the system the syntax actually is, what a swap would replace, and what the content files would lose.

## Separate the syntax from the vocabulary

A lesson file is a tree of nodes, one per line:

```
type value* key=value* { children }?
```

The syntax reads values into a small set of kinds: a number, a word, a quoted string, a block of prose, an expression, a size, a list, a setting. It keeps comments, blank-line grouping and source positions, so formatting is lossless and an error can point at a column.

What a node means is not in the syntax at all. It is in the vocabulary, a separate module where each node type declares what it takes: its settings, their kinds and defaults, the anchors a label or an arrow can attach to, and the box it occupies. The checker, the renderer and the verifier all read those declarations.

That split is a claim, so it is worth checking rather than asserting. Today the vocabulary declares 59 scene node types. The syntax is 489 lines. Not one of those 59 names appears in those 489 lines.

![Text is parsed into a generic tree, checked against the vocabulary into typed documents, verified, then instantiated, laid out and drawn. Only the first step is syntax, and it is the only step a move to JSON would replace.](figure:notation-layers)

The practical consequence is the one that matters day to day: adding a kind of drawing never touches the grammar. A new drawing on the shelf becomes writable in a lesson because the vocabulary reads it from the art catalogue, not because anyone edited a parser.

## Measure what a swap would replace

The notation module is 13,112 lines, excluding its tests. The syntax is 489 of them, under four per cent.

Everything else in the module is indifferent to how the text is spelled. Exact rational arithmetic with ranges and sets. The vocabulary. Variant enumeration and proof. Instantiation, layout into squares, and the renderers that draw to a screen or a sheet. Swap the surface format and all of that survives unchanged, because none of it reads characters.

![What a move to JSON would replace, against what it would leave untouched. The syntax is 489 lines of a 13,112 line module.](figure:notation-cost)

This is the part of the argument that surprised me when I first put numbers on it. The debate is usually framed as notation versus JSON, as though the format were the system. The format is four per cent of the system. A smaller version of this measurement in September put the syntax at eleven per cent, and the share has fallen since, not because the parser shrank but because everything around it grew.

## Count what the files would lose

The corpus is 6,455 files and 241,369 lines of notation.

Inside them are 1,713 blocks of triple-quoted prose, spread across 831 files. These are the sentences a child reads: an explanation, a question, a hint. In the notation they are written as they will be read, with line breaks and apostrophes and no escaping. In JSON every one of them becomes a quoted string with `\n` in it.

There are also 10,496 lines of comment, which is where the reasoning behind a lesson lives. JSON has nowhere to put them. JSONC would, at the cost of no longer being the thing whose selling point was that every tool reads it.

On size, a hand-tuned schema measured in September came out about 40 per cent larger in characters on the files we open most often. A naive port of the parse tree, which is what a quick conversion actually produces, came out at nearly fourteen times the lines.

## Spend the saved effort where the cost actually was

The measurement was worth doing for a reason beyond the decision it settled: it pointed at the real expense.

At the time, a single visual was declared in four or five places, and one of those declarations, its size, was copy-pasted between the drawing and the layout code. Two copies of a number that must agree. That cost was identical under either format, which is the clearest evidence that the surface was never the problem.

So the work went there instead. The vocabulary now builds its scene entries from the art catalogue when it loads, so adding a drawing is one declaration rather than five, and the copied size formula in the layout is gone: the drawing's own box function is asked instead. The format debate produced a format decision worth about a day of work either way, and a duplication fix worth considerably more.

## What would change the decision

Three things a schema would genuinely buy, which are worth stating plainly rather than talking past.

Editor tooling comes free with JSON Schema: autocomplete, hover documentation and inline validation, with no work from us. The notation needs a grammar file for highlighting and a language server for anything past that.

Every language has a JSON parser. If a partner, an export pipeline or a service written in something other than TypeScript ever needs to read this content, JSON is readable everywhere and the notation needs our parser or a port of it.

Some model APIs can constrain output to a schema, which removes malformed generated content as a category rather than as a bug.

The decision rests on an assumption, and it is the assumption rather than the measurement that could fail. Lessons are not meant to be hand-edited by outsiders as the normal path: authoring happens through a purpose-built interface over the notation, or through generation, both inside our own systems, and no outside consumer is planned. If content stopped being written and reviewed as text, the text surface would be earning much less and a schema would be the simpler choice.

The reversal is cheap, which is the point. Four per cent of one module, about a day of work, as long as the vocabulary stays where the meaning is.
