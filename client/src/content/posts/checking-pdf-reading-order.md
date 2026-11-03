title: Checking how a PDF is read
date: 2026-09-29
updated: 2026-11-03
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

## Structures that carry meaning beyond order

Columns are the clearest example because the failure is so audible, but several other
structures depend on being tagged rather than merely drawn.

A table communicates through the relationship between a cell and its headers. Read as a flat
sequence of numbers, a row of figures loses what each figure refers to. A list communicates
that its items belong together and how many there are. A heading communicates the start of a
section and its level, which is what lets someone move through a long document by section
instead of reading all of it.

Those relationships exist in the source document when the author uses real headings, real
lists and real table headers rather than text styled to look like them. A paragraph set in
large bold type looks like a heading and is not one. Using those source structures gives the exporter the information it needs. Tags can also be added or repaired afterward, but source fixes are easier to retain through later exports.

## A repeatable export review

For a representative document, I would record the intended sequence and then:

1. Inspect the tag structure and heading hierarchy.
2. Follow the reading order through columns, sidebars and captions with a screen reader.
3. Check that table cells retain their header relationships and lists retain their grouping.
4. Tab through links and form fields in the order a reader needs them.
5. Record each failure by page, element, expected sequence and observed behavior.

For generated documents, keep examples with different content lengths and layouts near the export code. One sample can catch a regression, but it cannot establish that every generated document has correct structure. Hand-authored documents benefit from templates with actual heading styles, lists and table headers.

## Keeping corrections through the next export

A repaired PDF can solve the immediate problem, but the source document is likely to be revised again. Where possible, I would correct the source structure and export a fresh copy. Otherwise, the next export may recreate the same work.

When conversion still needs manual repair, retain the affected pages and review steps with the source. Repeat those checks after content or layout changes.

Reading order is one part of accessibility. Image descriptions, language identification, contrast and form labels need their own checks.
