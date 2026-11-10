title: Checking permissions before serving a cached export
date: 2026-11-10
about: Engineering
cover: /img/posts/permissions-before-cached-exports-wide.webp
card: /img/posts/permissions-before-cached-exports-card.webp
summary: A cached file can remain valid after a person's access changes. A concrete export design separating reusable bytes, current authorization, background work, and temporary download links.

Suppose a team member exports a report on Monday. Generating the PDF takes several seconds, so the service saves it for reuse. On Tuesday, that person's access to the report is removed. They request the same export again, and the file is still in the cache.

The cached PDF may be exactly the right version of the report. That does not establish whether this person should receive it today.

I find it useful to model export caching as two decisions: which bytes can be reused, and who can receive them now. The following design uses a fictional reporting application to show where those decisions belong, including the parts that become harder when generation runs in a background worker.

## Check the requested action before looking for the result

An export request needs more context than a document ID. It has a requester, a resource, an output format, and sometimes an access path such as a shared link.

The server should resolve that context before serving a cached result. A signed-in user might be able to read a report but not export it. A shared link might permit a PDF but not the underlying data. A workspace setting might disable downloads entirely.

I would keep these checks in one authorization operation that answers whether this principal may export this resource in this form. Cache hits and cache misses pass through the same operation. OWASP's authorization guidance calls for permission checks on every request, including access to static resources. [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

A simplified handler would look like this:

```text
principal = resolve_identity_or_share_link(request)
report = load_report_in_scope(request.report_id)
options = validate_export_options(request.options)

authorize_export(principal, report, options)

key = identify_rendered_output(report, options)
artifact = find_completed_export(key)

if artifact exists:
    return issue_download_grant(principal, artifact)

return enqueue_export(principal, report, options, key)
```

The ordering should remain visible in the code. A shortcut that returns early on a cache hit can otherwise bypass checks added later to the slower generation path.

![Both a cache hit and a cache miss follow the same authorization check. Existing bytes can be reused only after the current request is allowed.](figure:export-authorization-order)

For a request carrying both a shared-link token and a report ID, the server also needs to confirm that they refer to the same resource. It should resolve the resource from the validated link or explicitly compare the two. A valid token for one report cannot authorize an arbitrary ID supplied beside it.

## Give the artifact a content identity

The cache key needs to identify everything that changes the output. For this fictional report, I would start with:

```text
workspace_id
report_id + immutable_revision
format + rendering_version
locale + timezone
page_size + selected_sections
redaction_profile + watermark_profile
```

Some fields might be unnecessary in a particular product. Others may be missing. The test is whether changing an input could produce different bytes or reveal different information.

For example, two authorized colleagues can reuse the same unpersonalized PDF. If the export places the recipient's email in a watermark, they need different output identities. If one role receives redacted rows, its artifact cannot share a key with the unrestricted version.

I would derive the redaction profile from server-side policy. Letting the request choose an arbitrary profile and then trusting that value in the key would leave the authorization problem unresolved.

An immutable revision is useful because it gives the worker a stable input. If a job is keyed as revision 12 but reads whatever happens to be current when it starts, it might save revision 13 under the earlier key. A cache hit could then return the wrong document even though all permission checks were correct.

Hashing the key can make it compact. It does not make the resulting object name an access control mechanism. The object should remain private, and the application should control how a requester obtains a download grant.

## Keep permission decisions separate from stored files

A completed artifact can live longer than a particular person's permission to use it. Deleting every cached copy whenever membership changes would create unnecessary rendering work for the people who still have access.

I would store the reusable artifact and its provenance separately from request-specific download grants. The artifact record might contain the content key, object reference, checksum, size, creation time, and completion state. It would not contain a permanent authorization result for everyone who might request it later.

Permission checks can themselves be cached, but that adds another expiry problem. An authorization cache needs keys covering the principal, resource, action, and relevant policy context. It also needs an explicit policy for changes to membership, shared links, or export settings. A short lifetime reduces staleness; it does not provide immediate revocation.

For a modest export workload, I would begin with current permission reads at download-grant issuance. If those reads become expensive, I would measure them before introducing a second cache with different correctness requirements.

## Check again when background work finishes

An export may take long enough for access to change between queueing and completion. Checking permission when the job is created controls who can request work. It does not settle who can download the result later.

I would have the worker write the completed artifact to private storage and update the job record. A completion notification would say that the job finished and provide a job identifier. The client would then request a download through an authenticated endpoint, which checks current access before issuing a grant.

That arrangement also gives the job-status route its own responsibility. A person should not be able to inspect another workspace's job by guessing its ID. Status responses can reveal filenames, resource identifiers, failure details, or whether a confidential report exists.

The queue payload should refer to server-resolved identities and immutable inputs. The worker still needs to handle deleted resources, canceled jobs, and invalid output variants. For long-running or expensive jobs, checking continued eligibility before rendering can save work. The delivery check remains necessary even if the worker performs that earlier check.

![Authorization at request time permits work to begin. Authorization at delivery time decides whether the requester can receive the completed artifact after access may have changed.](figure:export-delivery-lifecycle)

This design does not make permission changes and network delivery one atomic operation. There is still a moment after the final check when the system issues a grant or begins sending bytes. The product needs a clear meaning for revocation around that point.

## A signed URL grants access for its lifetime

A signed object URL lets storage serve the file without routing its bytes through the application. That can reduce application bandwidth and simplify large downloads.

It also creates a separate access grant. Google Cloud Storage documents that anyone holding a valid signed URL can use it until it expires or the signing key is rotated. Removing a workspace membership does not, by itself, invalidate an already-issued storage URL. [Cloud Storage signed URLs](https://docs.cloud.google.com/storage/docs/access-control/signed-urls)

For an ordinary report export, a short validity period may be an acceptable policy. The application can authorize each new grant while allowing recently issued ones to remain usable for their brief lifetime. The duration should account for legitimate download behavior as well as the exposure window.

If a product requires checking permission on every download request, an application-controlled download route is a better fit. It can authorize the request and stream the object. That introduces bandwidth, connection handling, and range-request concerns. Permission changes during an already-running transfer still need a defined policy; rechecking at the start does not retrieve bytes already sent.

A stored file, an application download endpoint, and a signed URL therefore have different lifetimes. Keeping them separate makes it easier to retain expensive output without handing out long-lived access.

## Prevent the response cache from sharing a grant

There can be more than one cache in the delivery path. The application may correctly protect the artifact while an HTTP cache stores a JSON response containing someone's signed download URL.

For a user-specific grant response, I would use `Cache-Control: no-store` and ensure the CDN does not apply a public caching rule to that endpoint. The same applies to responses whose content reveals sensitive job status. These response policies are separate from retaining the generated file in private object storage.

Logging needs a similar distinction. A log entry can include an internal job ID, content revision, result code, and decision category without recording the complete signed URL or shared-link token. Those values grant access and do not belong in routine analytics events.

I would also avoid including detailed authorization reasons in public errors. Internal logs can distinguish an expired link from a denied export format. A public response should reveal only what the requesting principal is allowed to know about the resource.

## Make cache and generation paths share the tests

The most useful test setup generates an export, confirms it is cached, removes the requester's access, and repeats the request. The second attempt must be denied even though the artifact still exists.

I would run a small permission matrix against both cache hits and misses: permitted member, removed member, read-only member without export rights, valid shared link, revoked shared link, and a link paired with another resource ID. Output variants need their own cases when permissions differ by format or redaction profile.

The asynchronous path needs an interleaving test. Enqueue work while access is valid, remove access, complete the worker, then request the download. The job may have produced a valid private artifact, but the final request should not receive a new grant.

Content tests address a different failure. Change the report revision, locale, watermark, or redaction profile and check that the cache identity changes where the bytes change. Reusing identical bytes for two authorized users should remain possible when the output has no user-specific content.

Finally, test the chosen revocation policy. If signed URLs remain usable until expiry, the test should describe that behavior explicitly. If downloads must pass through the application, test that route and its range requests. “Access removed” needs a precise meaning in the system that actually sends the file.

The main benefit of this separation is straightforward: rendering can be reused without treating yesterday's permission as today's permission. The extra authorization work belongs on both paths, and the download mechanism determines how quickly an issued grant can stop being useful.
