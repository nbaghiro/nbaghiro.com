title: Checking how a PDF is read
date: 2026-10-17
about: Documents
category: Industry & practice
cover: /img/posts/checking-pdf-reading-order-wide.webp
card: /img/posts/checking-pdf-reading-order-card.webp
summary: A PDF’s visual layout and reading order can differ. Checking both helps make exported documents usable beyond the screen they were designed on.

A two-column PDF can look perfectly readable and still be read in the wrong order by assistive technology.

[W3C’s guidance](https://www.w3.org/WAI/WCAG22/Techniques/pdf/PDF3) gives this example: instead of finishing the first column and moving to the second, a screen reader may read across both columns as though they were one. The words are present, but their sequence no longer makes sense.

## Reviewing the exported file

That is why a visual check of an exported document is only part of the review. Reading order and the order of keyboard navigation need checking too.

W3C recommends structuring the source document before conversion and checking the resulting PDF. Complex layouts can still need correction after export.

For a report or proposal, I would listen to the exported file with a screen reader and tab through its links and controls. Those checks can reveal problems that a screenshot will not show. They do not cover every accessibility requirement, but they make the review more representative of how people use the document.

## Review the document’s structure

Start with a page whose meaning depends on sequence: two columns, a sidebar or a form. Follow the content using assistive technology and compare the order with the intended reading path. Listen for headings that arrive after their paragraphs or unrelated material inserted into the middle of a sentence.

Keyboard navigation deserves its own check. A reader moving through links or fields needs a sequence that makes sense without a mouse. The appearance of those elements on the page is not enough to establish that sequence.

## Keep the check in the export process

Fixing structure in the source is preferable when the authoring tool supports it, because the next export can carry that correction forward. A repair made only to the final PDF may need repeating when the document changes.

The practical goal is to make these checks part of handing over a document, alongside proofreading and reviewing the layout. Reading order is one aspect of accessibility. A successful check here should not be presented as proof that every accessibility requirement has been met.
