Technical posts library

Canonical records: technical-library.json. Live page: /ads/technical-posts.
Product art direction and exact source captures: product-visuals.mjs.
Renderer: node scripts/editorial/render-product-visuals.mjs [optional article slugs].
Output: ../.scratchpad/technical-product-media/frames (relative to repository parent).
Publish: node scripts/editorial/publish-technical-library.mjs.

Product-specific posts use productVisual as their lead asset. Article covers stay
on the blog; general engineering posts without a product retain their article diagram.
The existing technical copy and first-comment links remain independently editable.

Design references:
- Clientbridge: galleo/.local/founder/cb-shots and scripts/campaigns, blue contour backgrounds.
- Galleo: .local/founder/galleo-engine, Couture fonts and captures in .local/instagram/m/couture.
- LumiSchool: .scratchpad/social/social.css, graph paper, taped title cards, Andika/Shantell.
- Tondo: existing porcelain product posts, plum text and warm pink surfaces.
- FlowMaestro: .local/founder/flowmaestro-sandbox, dark dot grid and actual marketing captures.
- LlamaTrade: existing light product shots, cream surface and orange accent.
All source paths are relative to Documents/code in product-visuals.mjs. The LlamaTrade
source was retrieved from its existing private Ad Studio shot, not redrawn.

To extend: add a record and a visual configuration, render, inspect at full size,
check factual labels against the article, then publish. Do not modify screenshot
content or imply the screenshot itself proves a backend guarantee. Invoice views
in the arithmetic image are separate demo invoices, explicitly labelled as such.

Media URL cache version uses the manifest's publishedAt field. Older carousels
remain secondary reference material; their captions still require review before use.
Original founder pages remain intact. This library is the curated editable copy.
