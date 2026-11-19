title: Search results after access changes
date: 2026-11-19
about: Galleo
cover: /img/posts/search-results-and-changing-permissions-wide.webp
card: /img/posts/search-results-and-changing-permissions-card.webp
summary: How document access should carry through search snippets, separate indexes, cached results and AI answers. A look at Galleo’s database search, followed by a proposed design for asynchronous indexing.

A colleague searches for a project brief on Monday. On Tuesday, their access to the project is removed. The brief still exists, its text is still indexed, and the search is still a good match.

The next search should leave that brief out, including its title, preview and matching sentences. Checking permission only when someone opens the document would leave part of the content visible in the results.

In Galleo, we use PostgreSQL full-text search for the document library. That gives us a concrete starting point: the query can combine text matching with document visibility. A separate search service or embedding store introduces another copy of the data, with its own update schedule.

This article first describes the database search we have, then develops a proposed design for that separate-index case. The indexing pipeline, cache policy and AI retrieval flow below are design proposals, not claims that Galleo already implements them.

## A search result already contains information

Search often returns more than a link. A result can contain a document title, author, thumbnail and a sentence from the body. Autocomplete, recent items and result counts can reveal information too.

We therefore need an access decision before those fields leave the trusted service. The document endpoint still needs its own check: permission may change between searching and opening, and someone can request a document without searching first. This follows the broader rule of checking authorization on every request. [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

For the rest of the example, suppose Maya can read documents A and C. Her access to B has just been removed. All three still match “launch plan.” The intended response contains A and C. It does not include B’s title with a disabled link, a snippet from B, or an unrestricted count of three results.

![Three documents match the query. Current permissions allow A and C; B is excluded before titles and snippets are returned.](figure:search-permission-gate)

## What Galleo’s query does today

Galleo stores extracted document text on the artifact row. PostgreSQL derives a weighted search vector from that text and the title. The search route resolves the signed-in person’s current workspace membership, then supplies the viewer context to the query.

The query filters by workspace, excludes trashed artifacts and applies the document-visibility predicate before its result limit. For ordinary members, visibility accounts for authorship, workspace defaults, document-level access and direct grants. Elevated workspace roles follow the broader access policy. The recent-items query applies the visibility predicate too.

Matching snippets are selected from the filtered result set. PostgreSQL’s `ts_headline` produces excerpts from the source text; in Galleo, the response converts its highlight markers into text offsets for the interface. [PostgreSQL text-search functions](https://www.postgresql.org/docs/current/functions-textsearch.html)

This arrangement means that changing a document’s access fields or grants does not require removing its search text. Other authorized people can continue finding it.

There are limits to that observation. The route resolves membership before the search statement, so these reads are not one atomic authorization snapshot. PostgreSQL’s ordinary Read Committed behavior gives each statement its own snapshot; it does not make a sequence of reads simultaneous. A request already in progress can overlap an access change. [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)

The browser also keeps a short-lived search cache and reconciles hits against its loaded library. Those improve responsiveness, but they do not establish immediate revocation across open browsers. Server filtering and client freshness need separate review.

## When the index lives elsewhere

Now suppose we move matching into a separate service. A worker extracts text, splits it into chunks and writes searchable records or embeddings. Document changes and index updates no longer commit together.

We would keep the application’s authorization data as the authority and treat the index as a source of candidate matches. The server resolves the requester and workspace; it does not accept an unrestricted tenant filter from the browser. The index can use access metadata to narrow the search, but a delayed metadata update must not become the only barrier to disclosure.

A simplified flow would be:

```text
principal = authenticate(request)
scope = resolve_current_workspace(principal)
candidates = index.search(scope.id, request.query)

allowed = authorize_candidates(
    principal, scope, candidates.document_ids
)

content = load_authorized_revisions(allowed, candidates)
return make_results(content)
```

These are conceptual operations, not a complete handler. The authorization step should batch its reads, reject candidates outside the resolved scope and fail closed if it cannot establish access. Content loading must bind each chunk to its document and an acceptable revision. A candidate ID or a matching similarity score is not sufficient evidence.

The same rule applies before an external reranker receives text. Candidate filtering inside a trusted search service is different from sending unchecked snippets to another model provider. Only permitted content should cross that boundary.

Filtering candidates after retrieval can reduce the number of usable results. If the first twenty matches contain eighteen denied documents, returning two is safe but may miss useful matches further down the ranking. We would fetch additional candidates within a bounded work budget, preserving ranking among accepted hits. Raw totals, facets and suggestions also need authorization-aware handling; otherwise they can disclose information the result list correctly hides.

## Keep index updates recoverable

Permission enforcement at read time lets the index catch up without making that delay an access grant. The index still needs a reliable update path for content freshness, storage cleanup and search quality.

For this design, we would record an indexing event in the same database transaction as the source change. A worker then reads those committed events and applies them to the index. If delivery fails, the event remains available for retry.

Each event needs a document identity and an ordered generation. The index writer must actually enforce that ordering: attaching a version number without comparing it does not prevent an older job from overwriting newer data. A deletion should leave a versioned tombstone, or equivalent durable state, so a late content job cannot recreate a removed document.

![Revocation takes effect in the permission store while the index update is pending. A new authorization decision excludes the document during that delay. The worker later updates the index.](figure:search-revocation-timeline)

Access removal and document deletion also have different storage consequences. Removing one colleague’s grant usually leaves the document and its embeddings useful to the remaining readers. Deleting the document requires tracking its derived chunks, embeddings and cached content for cleanup. Authorization controls new delivery while that work completes; it does not itself erase stored copies.

A content edit can create another problem: an old chunk might contain text that has since been removed. Current permission to the document does not automatically authorize every historical revision. We would validate the indexed revision against the product’s history policy, then omit stale chunks or load current content when necessary.

## Cache candidates separately from answers

A cache of candidate IDs can save search work while still passing every request through current authorization. A cache containing titles and snippets already holds discloseable content, so its hits need the same checks as newly retrieved results.

A permission-aware cache key might include the principal, workspace, query and policy generation. The generation is useful only if the service reads a sufficiently current value and every relevant access change advances it. Document grants, group membership and workspace policy changes must all be covered. A short expiry alone permits stale decisions until that expiry.

In the browser, we would clear results on account and workspace changes and invalidate affected entries when access changes are observed. An in-flight response needs protection too: otherwise a request started in one workspace can repopulate the cache after the person switches to another. Associate the response with the session and scope that started it, and discard it when that context has changed.

These measures reduce stale display. They cannot retrieve text a person has already received, copied or saved. That distinction should be explicit when the product describes what revoking access does.

## AI answers inherit their sources’ permissions

Retrieval for an assistant needs the same authorization step before assembling the prompt. Hiding a citation afterwards would not remove restricted text from the model’s input or from an answer it has already produced.

For a generated answer, we would record the source document IDs and revisions used to build its context. Reusing that answer later requires checking the requester’s access to those sources and whether those revisions remain acceptable. If a source is no longer allowed, the straightforward policy is to discard the cached answer and regenerate from permitted material. Removing one citation is insufficient because the source may have influenced several sentences.

![Candidate documents pass through authorization before entering model context. A cached answer retains source identities and revisions, and reuse checks those dependencies again.](figure:search-answer-provenance)

Conversation history needs a policy as well. A previous turn may quote a document that the person can no longer access. We would avoid silently sending that old text into a new model request merely because it appears in the conversation. Existing displayed messages, new retrieval and reuse of historical context are separate decisions.

For a long-running answer, another check before delivery can detect access changes during generation. It cannot undo a prompt already sent to a provider. Streaming makes the timing more visible: some output may already have reached the browser before revocation occurs. The product needs a defined cutoff and cancellation behavior, rather than a promise that access removal recalls every copy.

## Test access changes while work is in flight

A useful test deliberately leaves the index stale. Give Maya access to B, index it, remove her access and pause the indexing worker. Search again. The server must exclude B’s metadata and text even though the index still returns it as a candidate.

We would also test these cases:

- Warm the result cache, revoke access and repeat the query.
- Remove a group membership that supplied access to several documents.
- Change workspace while a search request is in flight.
- Deliver an older indexing event after a newer update or deletion.
- Retrieve an old chunk after sensitive text is removed from the document.
- Reuse an AI answer after access to one of its sources changes.
- Make the permission store unavailable and confirm that unchecked candidates are not returned.

The tests should inspect snippets, suggestions, counts and model context as well as document IDs. Operational logs can record decision outcomes and indexing lag without copying private snippets into another searchable system.

For Galleo’s current scale, keeping full-text matching close to the document records makes the server query easier to reason about. If we introduce a separate index, the design above preserves a clear responsibility: each new delivery checks the requester’s access, while background updates maintain the searchable copy. Browser caches, historical revisions and generated answers each need to follow that same policy at their own point of reuse.
