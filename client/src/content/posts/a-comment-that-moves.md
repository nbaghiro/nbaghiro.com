title: Keeping a comment on the text it was written on
date: 2026-10-22
about: Galleo
cover: /img/posts/a-comment-that-moves-wide.webp
card: /img/posts/a-comment-that-moves-card.webp
summary: Galleo keeps comment threads outside the content tree and joins a text thread to its range with an invisible mark. How that mark survives editing, and what the thread falls back to when it does not.

Galleo lets someone leave a note on part of an artifact: a whole element, or a range of text inside one. The content keeps changing under those notes, and the same content is exported to PDF and PowerPoint. The way a note is attached has to survive both.

Comments sit outside the content. A thread is a row in a `comments` table and never a node in the artifact tree. The only thing commenting writes into content is an invisible mark carrying a thread id over a text range.

## What the row holds, and what it does not

The row carries the anchor and the id of the section the anchored element sat in. An anchor names an element. For a text thread the range itself lives on that element, as a `cm` mark whose value is the thread's root id.

The section id is a locator rather than an identity. It groups threads in the rail, it is what a jump scrolls to, and the server uses it to refuse a comment on a section the artifact does not have, which comes back as a 409 rather than a 400 because the request is well formed and the world it describes is not. It is not what the thread points at.

Two things follow from keeping the row out of the tree.

Painting and export are the same with and without comments. A reader with threads open and a reader without see identical geometry, and an exported file carries no trace of a discussion.

Undo cannot create or destroy a thread. History moves the content tree, and comment rows are not in it. Undo can still remove the mark or the element a thread points at, which changes how much of the thread resolves. The thread and its replies survive that.

## The mark stamps nothing on the rendered text

Galleo's rich text is a string plus a list of offset marks. Most mark types set a field on the run the renderer draws: `b` sets bold, `link` carries an href, `hl` sets a background. The comment mark is a declared type that sets nothing.

That is deliberate. The tint a reader sees over commented text is drawn by the editor as an overlay, from the thread's live mark ranges and the layout the engine already produced, rather than as a style on the text. A test pins the property directly: the runs produced for a string with a `cm` mark over it are equal to the runs for the same string without one.

## Invisibility is why the mark has to be rebased

The text editor is a contenteditable element. On each input it reads the field back out of the DOM to get the new text and the visible marks. The DOM can only return what it drew, and the comment mark drew nothing, so reading back is where an invisible mark would be lost.

So it is not read back. The editor takes the `cm` marks from the stored data, rebases them across the change the text just took, and merges them with the marks it read from the DOM.

![An edit inserts words ahead of a commented phrase. The old and new strings are compared, the single changed span is found, and the mark is moved by the same amount so it still covers the phrase.](figure:mark-rebase)

Rebasing is a diff and a splice. The two strings are compared for a common prefix and a common suffix, which names one replaced span: where it starts, where it ends, and what went in. The marks are then spliced across that span with the same function the editor uses for a deliberate edit.

Describing a change as one span is an approximation. If several separate edits reach the editor in the same round-trip, the prefix and suffix comparison will describe them as one replacement covering everything between the first and last change, and marks inside that region are spliced accordingly. For typing, which arrives one input event at a time, the span is the keystroke.

## What a splice does to a range

The splice has four outcomes for a comment mark, each of which has a test.

Text inserted before the range shifts it by the length inserted. Text typed inside the range grows it, because a mark covering the replaced span is carried onto what replaced it. Text deleted from the middle of the range leaves the surviving halves marked, and they merge back into one mark when the deletion brings them together. Deleting the whole range removes the mark, because a mark normalises away once its start and end meet.

That last case is the one a reader will notice, and it is not a failure in the splice. A comment written on a phrase that no longer exists has nothing to cover.

## When the anchor stops resolving

A thread resolves against the document on screen in one of three states. It is fully live when both the element and the mark are present. It falls back to the element when the element is there and the mark is gone, which is what the deletion above produces. It is an orphan when the element is no longer in the tree at all.

A thread is degraded when that state differs from the kind of anchor it was written with. A degraded thread leaves the canvas and lives in the rail.

![A text thread resolving fully, the same thread after its phrase is deleted, and the same thread after the element leaves the tree. Each step keeps the row and loses one level of attachment.](figure:anchor-degrade)

This is why the row stores a quote. At write time, the text the anchor covered is captured and stored alongside it, trimmed and capped. For an element anchor with no text of its own, the element's catalog label stands in. When the anchor no longer resolves, the quote is what the reader sees in place of a highlight.

The most common way to orphan a section's worth of threads is an AI turn rewriting that section, because the replacement tree carries fresh element ids. The quote does not recover the attachment. It keeps the discussion legible after the thing it was about has gone, which is the better of the two outcomes available once the content is replaced.

## Access decides which anchor you get

Artifact access is ordered: none, view, comment, edit. Writing the `cm` mark is a content write, so a text-range anchor needs edit. At the comment level the chip anchors to the element instead, which is the attachment that level can actually carry rather than a range that would be refused on the way to the document.

Anchoring also needs the element to have an id, and ids are minted lazily. An element created in the current session may not have one yet, so the id is minted at the moment of anchoring and written out as a structural change. Keeping it local was the wrong answer: the server mints its own id on its next write, and the thread would orphan for every other reader immediately.

## Where this leaves it

The cost of the design is the rebasing, and rebasing is only as good as the diff it is built on. What it buys is that everything downstream of the content tree stays unaware that comments exist: the engine, the PDF writer and the PowerPoint writer need no concept of a thread, and history needs no special case to keep one alive.

It does not preserve an anchor through a rewrite. When the content a thread discussed is replaced, the thread keeps its words and loses its place in the document, and the interface says so rather than dropping it quietly.
