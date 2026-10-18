title: Checking how a PDF is read
date: 2026-09-29
about: Documents
category: Industry & practice
cover: /img/posts/checking-pdf-reading-order-wide.webp
card: /img/posts/checking-pdf-reading-order-card.webp
summary: A PDF’s visual layout and reading order can differ. Checking both helps make exported documents usable beyond the screen they were designed on.

A PDF can look well organized while presenting its content in a confusing order to someone using assistive technology. Columns, sidebars and captions give a sighted reader clues about how the page fits together. Those relationships also need to exist in the document's structure.

This makes reading order a separate part of reviewing an export. Seeing every paragraph in the right place does not establish that someone will encounter those paragraphs in a meaningful sequence.

## Following one argument through the page

Imagine a two-column report with a sidebar explaining a term. Visually, the main argument continues down the first column and then down the second. The sidebar sits beside it and can be read separately.

Now imagine hearing the first line of the left column, then the first line of the right column, then part of the sidebar. The words are all present, but the argument has become difficult to follow. The reader has to reconstruct relationships that the page was meant to communicate.

The W3C's [PDF reading-order guidance](https://www.w3.org/WAI/WCAG22/Techniques/pdf/PDF3) describes this kind of problem. In a tagged PDF, tag order primarily determines reading order, with the content within individual tags also affected by the content tree. It recommends checking reading order and the tab order of interactive elements, rather than relying on appearance alone.

## Deciding where supporting material belongs

For the report example, I would first describe the intended sequence in ordinary terms. Read the section heading, follow the main paragraphs, encounter the supporting explanation at a sensible break and then continue to the next section. That gives the review something concrete to compare against.

A sidebar's position on the page does not by itself answer where it belongs in that sequence. If it defines a term needed to understand the next paragraph, moving it to the very end could be confusing. If it is optional background, inserting it halfway through a sentence would interrupt the main explanation.

Captions need the same attention. A caption that identifies a chart should be encountered with enough context to understand what it describes. Reviewing the text in sequence helps expose these relationships more clearly than inspecting one object at a time.

## Checking how someone will use it

I would include a screen-reader review of representative pages, listening for interruptions, repeated material and explanations that arrive without context. A simple page establishes the basic flow. A page with columns, a figure and a sidebar gives the structure a more demanding check.

Keyboard navigation is another part of the review when the document contains links or form controls. The W3C guidance treats tab order as a related check. The person moving through those controls should encounter them in an order that makes sense for the task.

For example, a report might ask a reader to follow a link after explaining a result. I would try finding that explanation and reaching the link through the document, rather than checking only that the URL opens when clicked with a mouse. This keeps the review connected to an actual reading task.

## Keeping corrections through the next export

A repaired PDF can solve the immediate problem, but the source document is likely to be revised again. Where possible, I would correct the source structure and export a fresh copy. Otherwise, the next export may recreate the same work.

Some layouts still need attention after conversion. In that case, the export process should retain a clear note of the affected pages and the checks to repeat. A change that moves a paragraph or adds a figure can alter a sequence that was previously sensible.

Reading order is one part of accessibility. A document may also need work on headings, image descriptions, tables and other details. For this particular check, the goal is concrete: someone should be able to follow the content in a meaningful sequence without having to infer the layout from disconnected pieces of text.
