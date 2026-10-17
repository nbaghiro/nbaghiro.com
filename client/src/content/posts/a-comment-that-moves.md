title: Keeping comments attached as text changes
date: 2026-10-22
about: Galleo
cover: /img/posts/a-comment-that-moves-wide.webp
card: /img/posts/a-comment-that-moves-card.webp
summary: Galleo keeps comment threads outside the content tree and joins a text thread to its range with an invisible mark. How that mark survives editing, and what the thread falls back to when it does not.

Galleo lets someone leave a note on part of an artifact: a whole element, or a range of text inside one. The content keeps changing under those notes, and the same content is exported to PDF and PowerPoint. The way a note is attached has to survive both.

Comments sit outside the content. A thread is a row in a `comments` table and never a node in the artifact tree. The only thing commenting writes into content is an invisible mark carrying a thread id over a text range.

## What the row holds, and what it does not

The row carries the anchor and the id of the section the anchored element sat in. An anchor names an element. For a text thread the range itself lives on that element, as a `cm` mark whose value is the thread's root id.

The section id groups threads in the sidebar and identifies where to scroll when opening one. The server also checks that the section exists. A valid request referring to a missing section receives a 409 conflict response. The element id and text mark identify the anchor itself.

Two things follow from keeping the row out of the tree.

Painting and export are the same with and without comments. A reader with threads open and a reader without see identical geometry, and an exported file carries no trace of a discussion.

Undo cannot create or destroy a thread. History moves the content tree, and comment rows are not in it. Undo can still remove the mark or the element a thread points at, which changes how much of the thread resolves. The thread and its replies survive that.

## Keeping comment marks out of rendered text

Galleo's rich text is a string plus a list of offset marks. Most mark types set a field on the run the renderer draws: `b` sets bold, `link` carries an href, `hl` sets a background. The comment mark is a declared type that sets nothing.

That is deliberate. The tint a reader sees over commented text is drawn by the editor as an overlay, from the thread's live mark ranges and the layout the engine already produced, rather than as a style on the text. A test pins the property directly: the runs produced for a string with a `cm` mark over it are equal to the runs for the same string without one.

## Invisibility is why the mark has to be rebased

The text editor is a contenteditable element. On each input it reads the field back out of the DOM to get the new text and the visible marks. Because the comment mark has no visible DOM representation, reading the edited text back does not recover it.

The editor instead reads the stored `cm` marks, adjusts their ranges for the text change, and merges them with the visible marks recovered from the DOM.

![An edit inserts words ahead of a commented phrase. The old and new strings are compared, the single changed span is found, and the mark is moved by the same amount so it still covers the phrase.](figure:mark-rebase)

Rebasing is a diff and a splice. The two strings are compared for a common prefix and a common suffix, which names one replaced span: where it starts, where it ends, and what went in. The marks are then spliced across that span with the same function the editor uses for a deliberate edit.

Describing a change as one span is an approximation. If several separate edits reach the editor in the same round-trip, the prefix and suffix comparison will describe them as one replacement covering everything between the first and last change, and marks inside that region are spliced accordingly. For typing, which arrives one input event at a time, the span is the keystroke.

## What a splice does to a range

The splice has four outcomes for a comment mark, each of which has a test.

Text inserted before the range shifts it by the length inserted. Text typed inside the range grows it, because a mark covering the replaced span is carried onto what replaced it. Text deleted from the middle of the range leaves the surviving halves marked, and they merge back into one mark when the deletion brings them together. Deleting the whole range removes the mark, because a mark normalises away once its start and end meet.

Deleting the whole phrase removes its highlight. The comment thread remains available.

## When the anchor stops resolving

A thread resolves against the document on screen in one of three states. It is fully live when both the element and the mark are present. It falls back to the element when the element is there and the mark is gone, which is what the deletion above produces. It is an orphan when the element is no longer in the tree at all.

A thread is degraded when that state differs from the kind of anchor it was written with. A degraded thread is shown in the sidebar without a canvas highlight.

![A text thread resolving fully, the same thread after its phrase is deleted, and the same thread after the element leaves the tree. Each step keeps the row and loses one level of attachment.](figure:anchor-degrade)

This is why the row stores a quote. At write time, the text the anchor covered is captured and stored alongside it, trimmed and capped. For an element anchor with no text of its own, the element's catalog label stands in. When the anchor no longer resolves, the quote is what the reader sees in place of a highlight.

An AI rewrite can orphan a section’s threads when the replacement tree uses new element ids. The quote does not recover the attachment. It preserves the original context so the discussion remains understandable after the content is replaced.

## Access decides which anchor you get

Artifact access is ordered: none, view, comment, edit. Writing the `cm` mark is a content write, so a text-range anchor needs edit. With comment access, the thread anchors to the element instead. A text-range mark requires permission to change the content.

Anchoring also needs the element to have an id, and ids are minted lazily. An element created in the current session may not have one yet, so the id is minted at the moment of anchoring and written out as a structural change. The id must be persisted. A local-only id could differ from the one assigned by the server, leaving other readers unable to resolve the thread.

## Tradeoffs

This design requires range rebasing, with the limitations of a single-span diff. In return, comments do not affect layout or exports, and content undo does not remove discussion threads.

A rewrite that replaces the anchored elements can still break the attachment. The interface retains the discussion and its original quote, and shows that it is no longer attached to the current content.
