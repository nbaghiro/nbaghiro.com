title: Mux, Video.js, and the cost of video
date: 2026-11-08
about: Engineering
cover: /img/posts/mux-videojs-and-the-cost-of-video-wide.webp
card: /img/posts/mux-videojs-and-the-cost-of-video-card.webp
summary: Direct uploads, asynchronous processing, signed playback, and Video.js, with a concrete cost model for storage, delivery, and the player choices that affect both.

Mux is one of the best APIs I have worked with. The part I appreciate most is how clearly it separates uploading a file, processing an asset, and playing it. Those are different operations with different failure cases, and the API gives each one a useful place in the application.

Video.js handles the browser side: loading the stream and presenting the controls people use to watch it. Together, they let a product team build video features without also operating an encoding and delivery system.

The tradeoff deserves just as much attention. Video has ongoing costs, and a player setting can change those costs without changing how many people press play. This article walks through an illustrative integration and a small cost model. The examples are deliberately independent of any particular product or private codebase.

## Start with three separate identifiers

An **upload ID** tracks an upload attempt. An **asset ID** identifies the video managed by Mux. A **playback ID** identifies a way of accessing that asset. Keeping them separate makes retries, permissions, and deletion easier to reason about. One asset can have multiple playback IDs with different policies. [Mux fundamentals](https://www.mux.com/docs/core/mux-fundamentals) and [playback policies](https://www.mux.com/docs/guides/secure-video-playback) describe these boundaries.

I would keep the application's own video ID as the primary key and store the provider identifiers alongside it:

```text
video_id          application record and owner
upload_id         current upload attempt
asset_id          provider resource to manage or delete
playback_id       selected public or signed playback policy
processing_state  waiting / processing / ready / failed
```

An application ID also gives comments, attachments, and permissions a stable reference if the underlying video is replaced. In a product that allows replacements, I would model upload attempts separately so a late event from an old attempt cannot overwrite the new video.

## Send the bytes directly to Mux

The backend authenticates the user, checks their upload allowance, and creates a Direct Upload. It returns the upload URL to the browser, which sends the file directly to Mux. The application server handles authorization and metadata without carrying the video bytes. Mux supports a `passthrough` value to associate the resulting asset with an application record. [Direct Uploads](https://www.mux.com/docs/guides/upload-files-directly)

For example, this is the request body I would send from a server for a private video:

```json
{
  "cors_origin": "https://app.example.com",
  "new_asset_settings": {
    "playback_policies": ["signed"],
    "video_quality": "basic",
    "passthrough": "video_123:attempt_2"
  }
}
```

The API credentials stay on the server. The upload URL is a temporary capability, so it should not go into analytics or public logs. CORS restricts browser access from other origins; it does not replace authentication on the endpoint that issues URLs.

I would create the local attempt before calling Mux. That allows a webhook to find its record even if it arrives before the upload-creation request finishes locally. If the API call times out, the attempt stays unresolved until reconciliation rather than being silently treated as a failed upload with no possible remote resource.

![The application authorizes an upload, the browser sends bytes to Mux, and a verified readiness event updates the application before playback is offered.](figure:mux-upload-flow)

## Upload complete is not playback ready

Finishing the file transfer only closes one part of the workflow. The UI still needs a processing state and a useful error state. It should offer playback after `video.asset.ready`, rather than assuming a successful upload means a playable stream exists. If the product requests a static rendition for downloads, that output has its own readiness event. [Mux webhook reference](https://www.mux.com/docs/webhook-reference)

Mux retries failed webhook delivery for up to 24 hours and can send duplicates even after a successful response. Its request timeout is five seconds. That makes a short, durable receiver a better fit than a handler that performs several slow tasks before responding. [Webhook delivery](https://www.mux.com/docs/core/listen-for-webhooks)

My preferred application design would be:

1. Verify the signature against the unmodified request body using the provider's supported verification library.
2. Insert the event into a durable inbox, with a unique constraint on its event ID.
3. Return success after that insert commits. If storage fails, return an error so delivery can retry.
4. Let a worker correlate the upload attempt, apply the state change, and mark the event processed in one transaction.
5. Reconcile attempts that remain unresolved beyond an expected processing window.

A unique event ID prevents the same message from being processed twice. It does not solve two different events describing overlapping changes. The worker still needs state-transition rules: an old creation event must not move a ready asset back to processing, and a late ready event must not restore a locally deleted video. The correlation should include the upload attempt, not just the parent video.

Those are application responsibilities. A good API makes the events understandable; it cannot choose the product's deletion and replacement rules.

## Where Video.js fits

Mux supplies the stream. Video.js supplies the web playback layer. An HLS manifest describes available renditions and their media segments, allowing playback to adapt as network conditions change. That is a useful distinction from serving one fixed MP4 file. [Playing Mux videos](https://www.mux.com/docs/guides/play-your-videos)

Version matters here. The current Mux guide uses Video.js 10 and the Mux-specific media and data packages. Older examples using the legacy Video.js kit have a different integration surface. I would pin the version in the application and use its matching documentation. [Current Video.js integration](https://www.mux.com/docs/guides/playback-videojs-with-mux)

A minimal HTML example, using the current CDN bundles and a **public** playback ID, looks like this:

```html
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@videojs/cdn@10/video.js"></script>
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@videojs/cdn@10/media/mux-video.js"></script>

<video-player>
  <video-skin style="display:block; aspect-ratio:16/9">
    <mux-video
      src="https://stream.mux.com/PLAYBACK_ID.m3u8"
      playsinline
      crossorigin="anonymous"
      preload="none">
    </mux-video>
  </video-skin>
</video-player>
```

This is a playback example, not a complete private-video implementation. A production component also needs an error presentation, captions when required, accessible controls, and a clear decision about when to load media. I would test navigation away from the page, source replacement, slow connections, and expired access alongside successful playback.

Using an open source player leaves more control over the interface. It also means the team owns integration testing across the browsers and devices it supports. Provider-specific source options, analytics, and token handling remain work to revisit if the video backend changes.

## A private page does not make a public stream private

With a public playback policy, anyone who obtains the media URL can access it. For restricted content, the application should check the viewer's entitlement and issue an expiring token for a signed playback ID. Keep the signing key on the server. Mux API credentials and playback signing keys have different purposes. [Signed playback](https://www.mux.com/docs/guides/secure-video-playback)

In the current Video.js Mux integration, stream, poster, and storyboard tokens go into separate source fields. Their JWT audiences are `v`, `t`, and `s` respectively. Supplying the video token alone does not authorize every associated image request. [Token fields](https://www.mux.com/docs/guides/playback-videojs-with-mux)

Token lifetime needs to fit the viewing experience. A token that expires midway through a long lesson can interrupt later media requests. A longer lifetime increases the window in which a copied token remains useful. I would explicitly choose a session duration or renewal strategy and test it with pausing and seeking. Signed URLs control access; they are not a promise that an authorized viewer cannot record the content.

## The bill follows the library and the viewing

For an on-demand product, I would model three quantities separately: minutes ingested, minutes retained, and minutes delivered. They answer different questions about how the product grows.

As checked on November 8, 2026, Mux advertises free Basic input, storage starting at **$0.0024 per minute per month**, and delivery starting at **$0.0008 per minute after the first 100,000 monthly minutes**. These are starting rates, not a flat price for every quality level and resolution. The pay-as-you-go plan also includes a $20 monthly usage credit. [Mux pricing](https://www.mux.com/pricing)

Here is a hypothetical monthly workload, in USD:

- 2,000 videos, averaging five minutes each: **10,000 stored minutes**.
- 100,000 viewing sessions, averaging three **delivered** minutes: **300,000 delivered minutes**.
- Basic quality, up to 720p, the whole library retained for the full month, and no additional paid features.

At the starting storage rate, the undiscounted library costs **$24**. The first 100,000 delivery minutes are free, leaving 200,000 at $0.0008, or **$160**. That gives **$184 before credits, storage discounts, and tax**, or $164 after the standard $20 credit if it is fully available for this workload. This is a worked estimate, not an invoice. Basic quality also has a one-month minimum storage charge, so deleting a short-lived upload immediately does not make its storage cost disappear. [Pricing assumptions](https://www.mux.com/pricing)

![A hypothetical library produces 10,000 stored minutes while viewing produces 300,000 delivered minutes. The two quantities change independently.](figure:mux-cost-model)

The current first delivery tier extends through 500,000 minutes. Within it, Basic/Plus delivery is $0.0008 at up to 720p, $0.001 at 1080p, and $0.0032 at 4K. If all 200,000 billable minutes were delivered at one of those respective resolutions, the delivery charges would be $160, $200, or $640. An adaptive stream normally produces a mix of delivered resolutions. Storage also varies by resolution. [Detailed rate tables](https://www.mux.com/docs/pricing/overview)

Cold storage changes the library side of that estimate. Mux starts new assets in Cold storage until first playback, then discounts assets again as they go unwatched: 40% after 30 days and 60% after 90 days. Static MP4 renditions have additional storage charges per rendition. Those details matter for an archive or a product that creates download copies by default. [Storage and rendition pricing](https://www.mux.com/docs/pricing/overview)

The concern I would raise is predictability. A business can charge a fixed subscription while its video usage varies substantially between customers. An account with a large archive costs money even in a quiet month. An account with a small library and frequent viewing can generate much more delivery. Counting uploaded files or paying customers alone hides both patterns.

Basic and Plus are also encoding choices, not just different resolutions. Basic uses a reduced adaptive bitrate ladder and a lower quality target with free input. Plus uses per-title encoding and charges for input. I would compare representative content before choosing: a talking-head clip and a detailed screen recording may need different treatment even when both are 1080p. [Video quality levels](https://www.mux.com/docs/guides/use-video-quality-levels)

## Player behavior is part of the cost model

Delivered minutes include buffered and preloaded media, even when the viewer never watches it. That is why the example uses delivered minutes rather than watch time. [Mux pricing FAQ](https://www.mux.com/pricing)

A feed that starts loading several offscreen videos can spend delivery before anyone chooses one. I would begin with posters and load the player when needed, then measure the startup-time tradeoff. `preload="none"` is useful, but preload is a browser hint rather than a hard billing limit. Reducing buffer length can reduce unused delivery while making playback more vulnerable to network interruptions. [Cost optimization guidance](https://www.mux.com/docs/pricing/optimizing-video-costs)

For a small preview, limiting available playback resolution can be reasonable. For a recording containing code or fine text, the same limit may make the content unusable. Resolution policy should follow the content and viewing surface. A delivery cap also does not retroactively lower the resolution stored for the source asset.

I would measure startup delay, rebuffering, and playback failures alongside delivered minutes per session. A cheaper configuration that makes lessons harder to watch is not necessarily an improvement. Mux Data provides playback monitoring when its extension is enabled; the minimal player above does not enable it. Billing usage needs its own reconciliation against the provider's usage reports. [Mux Data](https://videojs.org/docs/framework/html/guides/mux-data)

## What I would keep explicit

The provider removes a large amount of operational work, but the application still needs upload allowances, retention rules, permission checks, failure recovery, and a decision about whether downloadable files are necessary.

For a subscription product, I would model a typical account and a heavy-use account before setting a video allowance. I would also keep provider IDs behind application records and have a deliberate policy for retaining original media. Recreating a library elsewhere can involve moving files, rebuilding metadata, updating playback references, and paying for both systems during the transition. An open source player makes the browser layer easier to control; it does not make that migration free.

That is why I like Mux while still taking its pricing seriously. The API lets me spend more time on the actual video experience. To make that a sustainable product decision, I also need to understand how the library, the audience, and the player turn into usage.
