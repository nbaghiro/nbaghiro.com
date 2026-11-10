title: Fetching a URL someone else controls
date: 2026-11-10
about: Engineering
cover: /img/posts/fetching-user-provided-urls-wide.webp
card: /img/posts/fetching-user-provided-urls-card.webp
summary: How Tondo checks destinations at connection time, handles redirects, and limits downloaded content, with the gaps these controls still leave.

[Tondo](https://tondo.page) can read a website while helping someone build their page. It also downloads images selected from search results. Both features need the server to request addresses supplied from outside the application.

The visible feature is small: paste a link, read some text, suggest content. The backend is making a more consequential decision. It is allowing an outside party to influence where a server opens a network connection. A server may have access to services that the person using the product cannot reach directly.

I wanted the page reader and image downloader to share the same destination checks. That led to a small HTTP wrapper with explicit URL validation, a guarded DNS lookup, manual redirects, and download limits. These controls are useful, but their details matter. The current implementation also has limits that I would keep visible when extending it.

## Start with the connection being requested

A URL parser answers whether an address can be interpreted. It does not answer whether the server should contact it. `http://127.0.0.1/` is a valid URL. So is a public hostname that resolves to a private address.

Tondo first parses the input with the standard `URL` object. Its policy then accepts only HTTP and HTTPS, rejects embedded usernames or passwords, and permits only the usual web port numbers, 80 and 443, including an omitted default port. This is a port allowlist, not a requirement that each scheme use only its conventional port.

Literal IP addresses are checked immediately. Hostnames such as `localhost`, or names ending in `.local`, `.localhost`, or `.internal`, are rejected too. These name checks catch obvious cases early. They cannot replace checking the resolved addresses: an ordinary-looking public domain can still resolve inside a private network.

The outbound request is a GET with a fixed user agent and Accept header. The wrapper does not copy incoming cookies or authorization headers into it. That keeps the reader from becoming a general authenticated HTTP client on the user's behalf.

## Put the DNS check where the socket gets its address

An easy implementation is to resolve a hostname, inspect the answer, and then call an HTTP client with the original URL. The problem is the second lookup. If the HTTP client resolves the hostname again, it may receive a different answer from the one the application approved.

Tondo supplies a custom `lookup` function directly to Node's HTTP and HTTPS request functions. That lookup obtains all returned addresses, applies the address policy, and passes the accepted results back to the connection machinery. There is no separate application-level preflight lookup followed by another unchecked lookup in this path.

This matters for DNS rebinding. An attacker controlling DNS could return a public address during a preliminary check and a private address when the client connects. Moving validation into the lookup used for connection establishment removes that particular gap. Node exposes the custom lookup option through its [HTTP request API](https://nodejs.org/api/http.html#httprequestoptions-callback).

The wrapper takes a conservative approach to mixed answers. If a lookup returns one public IPv4 address and one private IPv6 address, the entire result is rejected. It does not select the public entry and assume that address ordering or fallback will always stay favorable. An empty answer is rejected as well.

![Every new destination passes URL validation and the lookup used by the connection. Redirects return to the start of the same process.](figure:url-fetch-boundaries)

A literal address takes a different route because it does not need DNS resolution. That is why literal-IP checking exists in URL validation as well as inside the lookup callback. Neither layer alone covers both input forms.

For HTTPS, the original hostname remains in the request URL. The wrapper changes address resolution without rewriting the URL to an IP address or disabling certificate checks. Node's normal HTTPS handling therefore retains the hostname context needed for TLS. Replacing the hostname with an IP would need separate care around certificate identity and server name indication. The relevant options are documented in [Node's HTTPS request API](https://nodejs.org/api/https.html#httpsrequesturl-options-callback).

The lookup check runs when a hostname is resolved for a new connection. It is not a fresh DNS query for every request sent over an already established socket. That distinction matters when describing the control: the intended boundary is the destination used to establish the connection, not continuous validation of DNS records.

## Address classification needs explicit coverage

The current IPv4 checks cover loopback, private networks, link-local addresses, carrier-grade NAT space, benchmarking space, multicast, and reserved high addresses. Link-local blocking includes the familiar cloud metadata address `169.254.169.254`.

IPv6 needs more than a check for `::1`. The code also checks unique-local, link-local, site-local, multicast, and documentation addresses. It recognizes several representations containing an IPv4 address, including IPv4-mapped addresses, IPv4-compatible addresses, a NAT64 form, and 6to4. The embedded IPv4 value is checked against the IPv4 policy.

For example, `::ffff:7f00:1` must not escape a loopback restriction just because it lacks the string `127.0.0.1`. The existing test cases cover both dotted and hexadecimal mapped forms.

I would not describe this handwritten list as a complete classification of all nonpublic address space. It is not one. There are special-purpose ranges and translation mechanisms beyond those explicitly handled. Maintaining the list, testing boundary addresses, and comparing it with current address registries are ongoing work.

Network policy provides a second place to enforce the boundary. Restricted outbound routing or a dedicated fetch service can limit what happens if application validation misses a destination. I am describing those as additional controls to consider, not as infrastructure this implementation proves is already in place. OWASP's [SSRF prevention guidance](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) discusses both application checks and network restrictions.

## A redirect starts another destination decision

A safe first address says nothing about the next one. A public server can respond with a redirect to a private IP, another hostname, a different port, or another scheme.

Tondo's low-level request function returns the status and Location header without following redirects. The outer loop resolves a relative Location against the current URL, validates that new URL, and makes another guarded request. It allows three redirects, meaning a chain can involve four requests including the original one.

A redirect from a public site to `http://169.254.169.254/latest/meta-data` is rejected before the next request. A redirect to another public-looking hostname still passes through the connection lookup; validating only literal IPs in Location would leave a gap.

The implementation treats all responses from 300 through 399 as redirect candidates. A missing Location fails, and a fourth redirect fails. It does not maintain a set of visited URLs, so a cycle is stopped by the hop limit rather than detected by identity.

There are tradeoffs here. Three hops can reject a legitimate site with a longer chain. HTTP remains allowed, including after an HTTPS URL redirects to HTTP. The wrapper does not promise encrypted transport throughout a chain. If the feature later requires that, scheme transitions need their own rule.

## Time and bytes are separate budgets

Each `safeFetch` call combines the caller's cancellation signal with a 15-second timeout. All redirects inside that call share the resulting signal. A slow redirect chain does not receive a fresh 15 seconds at each hop.

The page reader makes two separate calls: one for `robots.txt`, then one for the page. Each has its own timeout. Without a shorter caller deadline, the combined read can therefore take roughly twice the per-call allowance. The implementation should not be described as a 15-second limit for the entire page-reading operation.

The response limits also differ by use: 200,000 bytes for robots, 2,000,000 bytes for a page, and 12 MiB for an image. These are body limits for individual responses, including responses encountered on redirect chains. They are not a total bandwidth allowance for the whole operation.

![Destination checks decide where a connection may go. Separate budgets limit redirects, elapsed time, and response bodies, while decoding requires its own controls.](figure:url-fetch-budgets)

The body handler counts received chunks. When the count reaches the configured cap, it resolves with the permitted prefix and destroys the response. It does not reject an oversized body with a distinct error, and it does not return a truncation flag. A page can consequently produce partial text without the caller knowing it was cut short.

There is also a memory detail: the handler stores the final whole chunk before concatenating and slicing. The returned byte array is capped, but temporary allocations can exceed that cap. Calling this a strict process-memory limit would be inaccurate. A tighter implementation could retain only the remaining bytes and make truncation explicit.

The request path uses Node's low-level response stream and adds no gzip or Brotli decompression. It also does not advertise compression support. That means there is no implemented pair of compressed-byte and expanded-byte budgets. Unexpected encoded content is not explicitly decoded by this wrapper. If decoding is added, its output needs a separate bound; a small compressed body can expand substantially.

Image processing has the same distinction at another layer. The thumbnail path feeds downloaded bytes into Sharp and resizes the result. A 12 MiB file limit is not a 12 MiB decoded-pixel memory limit. Decoder limits and processing deadlines need their own review. The HTTP abort signal is not, by itself, a cancellation mechanism for work already happening inside the image decoder.

## Reading the content introduces another boundary

After fetching, the page reader accepts status 200 and content types matching HTML, plain text, or XHTML. HTML passes through a text extractor that removes scripts, comments, and several hidden-element patterns.

That reduces noise. It does not establish that the remaining text is trustworthy, and it does not eliminate prompt injection. Visible text can contain instructions too. The assistant must treat downloaded material as external content rather than authority to change its behavior.

The assistant also checks whether the requested hostname appears in the person's message. The current check normalizes the hostname and uses substring matching. It is a modest relevance check, not proof that the person supplied that exact URL or owns the site. Parsing explicit links would provide a more precise input rule.

The robots handling is similarly limited. It reads an initial robots file and interprets applicable Disallow prefixes. It is not a complete robots standard implementation, and the page-fetch redirect loop does not independently retrieve robots rules for every destination origin. These details are worth stating because “respects robots” can otherwise imply more than the code does.

## What the tests establish

The focused test file currently passes 45 tests. They cover representative private addresses, accepted public examples, prohibited URL forms, mixed DNS answers, a redirect to metadata, the redirect count, caller cancellation, and basic content extraction and robots behavior.

The mixed-answer test injects a resolver result. The redirect tests inject the low-level request function. These are useful unit tests for policy and control flow. They do not constitute a live DNS rebinding test or verify real socket behavior, TLS identity, byte truncation, or decompression handling.

The next tests I would add are transport-level tests for the lookup callback and response limits, plus explicit cases for relative redirects, scheme changes, empty DNS answers, and address-range boundaries. I would also distinguish complete and truncated responses in the return type before relying on the reader for tasks requiring a full document.

The useful design choice here is that every caller shares one outbound-request path. Improvements to connection checks and limits then apply to website reading, thumbnails, and selected image downloads together. Keeping the checks centralized makes it easier to review what the server is allowed to contact, and equally important, what the current implementation still does not guarantee.
