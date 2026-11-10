title: Serving pages on customer domains
date: 2026-11-09
about: Engineering
cover: /img/posts/serving-pages-on-customer-domains-wide.webp
card: /img/posts/serving-pages-on-customer-domains-card.webp
summary: How Tondo separates customer pages from application routes, verifies domain ownership, and handles the gaps between DNS, hosting, database state, and cached permissions.

A page in [Tondo](https://tondo.page) normally lives at an address such as `tondo.page/maya`. Adding `maya.example.com` looks like a small change from the visitor's side. The server has to make several decisions before it can safely return the same page there.

Which page owns the hostname? Has someone proved control of it? Should `/app` or `/api` work there too? What happens when the page is unpublished, the subscription changes, or the domain changes hands?

I built the domain handling around those questions. The implementation uses one server, a small domain table, and middleware that runs before the rest of the application.

## Decide what exists on each hostname

The application has an explicit set of its own hostnames, built from configured public, editor, and hosting addresses. A request to one of those names continues through the normal router. A customer hostname enters a smaller set of routes.

For `maya.example.com`, that set includes the page at `/`, tracked links belonging to Maya's page, public photos, `robots.txt`, and a sitemap containing that one address. The handler accepts `GET` and `HEAD`. An explicit `/health` exception runs before the hostname checks so infrastructure health checks can reach it.

Everything else gets a 404. That includes `/app`, `/login`, account APIs, payment webhooks, another page's handle, and writes such as `POST /`.

![The hostname is checked before normal application routing. App hosts continue to the application; customer hosts resolve to one verified page and a small route list.](figure:domain-routing)

This ordering is the useful part. A newly added application endpoint remains unavailable on customer domains unless the domain handler deliberately allows it through. Maintaining a list of forbidden application paths would require someone to remember every new endpoint.

The tracked-link route also checks the handle inside the path. Knowing a valid target on another page does not make `/l/other/target` work under Maya's hostname. The domain resolves the page first; the path cannot choose another one.

Photos are a deliberate exception. The current handler forwards `/photos/*` to the shared public-photo route. Those files are already public on the main site, and the handler does not restrict them to photos from this particular page. That would need to change if the product introduced private media.

## Treat the hostname as a routing input

The request helper normalizes the `Host` header through URL parsing. It removes the port and trailing dots, lowercases the hostname, and rejects credentials or a non-root path. Exact membership in the application-host set matters: `tondo.page.evil.example` must not match `tondo.page`.

The code does not read `X-Forwarded-Host`, `X-Original-Host`, or `Forwarded` to select the page. Tests send those headers with conflicting values and check that they cannot switch a customer request into an application request.

There is still a deployment assumption. The application uses the `Host` value delivered to it by the router. Ignoring forwarded headers does not make `Host` proof of identity, and it does not verify how a production proxy handles conflicting request authorities. The edge configuration and direct-origin behavior need their own tests. Authentication and authorization remain necessary on the application routes.

There is also an important configuration limit in this version: domain middleware is mounted only when domain hosting is enabled. Without the required hosting configuration, the application preserves its earlier behavior and serves ordinary routes regardless of hostname. I would make that mode visible in deployment checks before attaching customer domains. A stronger design could keep hostname restrictions enabled independently of the provider credentials.

## A DNS address does not identify the page owner

Pointing a hostname at shared infrastructure only gets the request to the service. It does not say which Tondo account should be allowed to publish there.

Consider a domain whose previous owner left its address records pointing at the host. Letting the first account that types that domain into settings claim it would be unsafe. Tondo asks for a separate TXT record whose value is tied to both the page ID and hostname:

```text
name:  _tondo.maya.example.com
value: tondo-verify=<first 32 hex characters of SHA-256(pageId + ":" + host)>
```

This value is public and deterministic. Its purpose is to bind the DNS change to this page. Publishing the expected value at the required DNS name demonstrates control at the time of the check. A value left behind for a different page does not satisfy the new page's check.

The settings input also gets its own normalization. The code accepts common pasted forms such as `https://www.example.com/`, handles internationalized names through URL parsing, and checks for a registrable domain. It rejects IP addresses, explicit ports, public suffixes such as `co.uk`, the service's own domains, and blocked names.

When the owner asks to connect a domain, Tondo records a pending request. When they check it, the server reads TXT records, finds the expected page-bound value, asks the hosting adapter to add the hostname, and waits for the provider's verification response before marking the row verified.

![A pending request becomes a verified domain only after page-bound DNS proof and provider verification. Serving also depends on current page and plan eligibility.](figure:domain-verification)

Render is the adapter used here. It handles certificate creation and renewal for custom domains, with DNS configuration and verification as separate setup steps. Its documentation also notes that routing can take a little longer after verification. A provider status of verified is useful evidence, but a real HTTPS request is still an important deployment check. [Render custom domains](https://render.com/docs/custom-domains)

## Let pending requests coexist

The domain table contains `page_id`, `host`, and `verified_at`. The page ID is the primary key, so each page has at most one domain request. The hostname is unique only among verified rows.

The essential database rule is equivalent to:

```sql
CREATE UNIQUE INDEX domains_verified_host
ON domains (host)
WHERE verified_at IS NOT NULL;
```

Several accounts can therefore have pending requests for the same hostname. Asking first does not reserve it. Once one proves control and becomes verified, the database prevents a second verified holder. A partial unique index enforces uniqueness for rows matching its predicate. [PostgreSQL partial indexes](https://www.postgresql.org/docs/current/indexes-partial.html)

That constraint matters during races. An application check that sees no holder can become stale before its update executes. The store catches the unique-constraint violation and the route returns a conflict. The database is responsible for the final one-holder rule.

The constraint does not make the whole operation atomic. DNS reads, provider calls, and database writes happen at different times. This implementation can leave a hostname attached at the provider while the local row is still waiting. Repeating the check is meant to recover from that state; the adapter first looks for an existing provider attachment before creating one.

## Domain transfers have more than one step

Suppose Maya sells a domain. The new owner publishes a code for their page and removes the old code. During verification, the server checks both the new page's expected value and the existing holder's value.

If the old value remains, the existing connection is treated as still in use. If the old value is absent and the new value is present, the code can release the old holder and verify the new one. The old page returns to a waiting state.

This behavior is covered by a browser test using a DNS and hosting stand-in. It is a useful lifecycle test, but the database operations deserve a careful qualification: releasing the old holder and verifying the new holder are separate calls. A failure between them can leave no verified holder. The unique index prevents two holders; it does not guarantee an uninterrupted transfer.

A more robust transfer would put the database handoff inside a transaction with suitable concurrency control, while keeping the external DNS and hosting work outside the transaction. It would also need an explicit retry path. That is an improvement to make, rather than a guarantee to attribute to the current code.

## A verified domain still needs a live page

On a customer request, the server resolves the verified hostname to a handle, loads the page, and checks whether the page can be shown and whether its plan permits a domain. The returned domain must still equal the requested hostname.

The plan rules are conditional on the product's plan-enforcement setting. When enforcement is enabled, a plan change can stop the custom domain while leaving an eligible page available at its original Tondo address. Suspension or unpublishing can stop the page entirely.

Both hostname lookup and page data use a 15-second in-process cache. Domain changes invalidate the relevant entries in the process handling that change. The code also evaluates an already-known plan end date on each request, so passing that timestamp does not require the cached object to be reloaded first.

A newly changed plan or suspension is different: another process can still hold old data until its cache expires. I would not describe this as instant revocation across replicas. If the requirement became immediate removal everywhere, this design would need shared invalidation, a version check, or an uncached eligibility check for the relevant operation.

## Keep the original address usable

The main `tondo.page/maya` address continues to render the page. While the custom domain is eligible, canonical and share metadata name that domain. The main sitemap omits the custom-domain page, and the customer's sitemap contains only their address. Visits and tracked links still refer to the same internal page ID.

Keeping the original address available avoids making every old link depend on customer-managed DNS. The current implementation does not continuously recheck a verified domain's DNS, so automatically redirecting the original address could send visitors to an address that no longer works.

There is a remaining tradeoff: canonical metadata can continue naming that domain after its DNS breaks. Retaining the original page helps visitors with old links; it does not detect domain expiry or repair search metadata. Periodic DNS checks and a visible connection status would address a different part of the problem.

The application also redirects `www` to the bare hostname only when the bare name has a verified holder. It preserves the requested path and query. The destination still applies its own route and eligibility checks.

## Test the boundaries and the recovery paths

The focused tests check successful page rendering, blocked application routes, rejected writes, unknown hosts, forwarded-header spoofing, normalization, canonical metadata, sitemaps, and plan or suspension behavior. Separate browser tests describe proof, conflicting claims, transfer, and removal using the hosting stand-in. These tests do not establish that DNS, certificates, and the production router have all been verified together.

I would add production checks for the exact hostname passed by the edge, HTTPS readiness, stale DNS, provider timeouts, and removal after partial setup. Cached reads and concurrent transfers also deserve tests that involve more than one process or a real database; in-memory route tests cannot establish those properties.

The design keeps the public route surface small and places the one-holder rule in the database. Its operational limits come from the systems around that rule: DNS changes over time, provider work can partially succeed, and cached permissions can lag. Those are the details that make a customer domain more than an extra URL for an existing page.
