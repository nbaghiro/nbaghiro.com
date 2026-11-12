Technical posts library

Canonical editable records: technical-library.json.
Live page: /ads/technical-posts.
Publish content-only edits with node scripts/editorial/publish-technical-library.mjs.
The page reads the private Ad Studio manifest; no frontend deploy is needed for record changes.

Each record carries a stable article slug, title, products array, LinkedIn text,
firstComment, article URL, cover, summary, and media readiness fields.
Current cover paths are live website article visuals. Existing product carousel
alternatives reference the source project and asset file without duplicating media.

To extend: add a record or update its media list, verify its article and copy,
inspect candidate media, then publish. Preserve technical caveats. A product
screenshot does not demonstrate server correctness. Do not mark older carousel
captions approved without checking against the current article.

Initial scope: 16 existing Founder posts with published articles and five earlier
Galleo/LumiSchool technical posts from Founder series. The presentation-tool
repository announcement has no corresponding article and was not included.
Original founder pages remain intact. This library is the editable curated copy;
future changes should be made here, not regenerated from the old collections.
