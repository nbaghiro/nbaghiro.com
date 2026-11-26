title: Planning Dailies, from product footage to ad campaigns
date: 2026-11-26
about: Dailies
cover: /img/posts/dailies-from-product-demo-to-ad-campaign-wide.webp
card: /img/posts/dailies-from-product-demo-to-ad-campaign-card.webp
summary: The product plan for Dailies: real product recordings, generated video, creative review, ad-platform integrations and a useful record of what each marketing experiment teaches us.

I have plenty of products to show and much less experience explaining them well.

That became clear while making demos and trying different AI creative tools. I could generate another video, but I still needed to decide what it should communicate, find accurate footage, fix the parts that looked wrong, prepare it for a channel and remember what happened after publishing.

Dailies is an idea for bringing that work together. I want to start with a product and a specific message, turn them into a few pieces of creative worth reviewing, and carry the decisions through to publishing and measurement.

This is a product plan. The current prototype has six areas: Studio, Library, Campaigns, Performance, Schedule and Channels. Brief edits and review decisions persist. A job queue runs placeholder generation steps. The displayed campaigns, accounts and results are demonstration data. No video models or ad platforms are connected.

The plan below starts from that prototype and extends it, particularly around recording real products, editing clips and handling external accounts. Those additions are proposed work. I’m writing them down because the useful parts of this product live in the connections between those tasks.

![The proposed Dailies loop: brief, source material, creative review, distribution and learning.](figure:dailies-loop)

## Start with a message someone can understand

The product would be the main workspace. Each product would have its own audience, brand assets, destination links, accounts and history of experiments.

Within that workspace, a brief would describe one attempt to explain something. It would hold the intended audience, the problem, the main claim, the evidence we can show, the desired next action and the constraints on tone or imagery.

For example, a Clientbridge brief might focus on a client booking an appointment from their phone. The useful evidence is the actual booking flow and the appointment appearing in the business schedule. The video doesn’t need to explain every feature in Clientbridge to make that one idea clear.

I’d want to version that brief before creating anything. Changing the opening line tomorrow should not change our record of what we asked for today. A generated prompt, a recording plan and a finished clip should all lead back to the same saved brief version.

An assistant could suggest angles and scripts, but it would need a reliable set of product facts. I’d separate confirmed capabilities from planned features and unsupported claims. If the brief asks for a claim that the product record cannot support, it should come back as a question before it becomes an ad.

## Give real product footage a first-class place

For software, the strongest source material is often already on the screen. I want Dailies to make that material easier to use.

The first capture path should be straightforward: import a screen recording, phone recording or existing demo. Keep the original, choose useful segments, and attach notes about what each segment shows. Someone who already has good footage should be able to use it without waiting for a model integration.

A later browser-capture path could turn a shot list into repeatable recordings. A capture recipe would specify the demo environment, viewport, starting state, actions and expected result. Before recording, it would reset seeded data and confirm that the starting screen is ready. During the run, it would wait for meaningful UI states rather than assuming an arbitrary delay means a screen has loaded.

For the booking example, the shot list could be: choose a service, choose an available time, confirm the booking, then show it in the owner’s schedule. The recipe would use a demo business and stop if the expected confirmation never appears.

Physical phone footage needs a different workflow. Dailies could provide a shot list and accept uploaded clips, while a person handles framing, lighting and recording. Native app capture would need its own device or simulator runner. I wouldn’t treat a browser recording as evidence that the mobile app behaves the same way.

Every asset would carry a source, capture date, product version and permission record where relevant. Recordings would use controlled demo data. Private customer details, notifications and credentials should be kept out of the source material, with a review before anything leaves the workspace.

![A shot plan connects to imported footage, repeatable browser capture or generated scenes. All paths produce source assets for review.](figure:dailies-sources)

## Use generation where the brief calls for it

Generated video would be another source of material. It could help with an opening scene, an illustration or a variation we cannot easily record. I want the person creating the ad to choose where it belongs.

I would preserve real interface recordings for any shot demonstrating a product action. Asking a video model to invent an interface can produce a convincing screen that shows something the app never does. A generated scene could surround a real recording, but the boundary needs to remain clear in the asset history.

The current implementation plan starts smaller than a full video editor: one brief produces a vertical clip, followed by a poster frame and a library entry. I’d connect one provider end to end before adding a model selector with choices that behave differently.

Each adapter would describe what it supports: reference images, duration, aspect ratio, audio, submission, status lookup and cancellation. Unsupported options should be unavailable in the brief. The adapter would also record the provider’s job identifier, requested settings and model version when available.

Before a run, Dailies would show an estimate, the number of variations and the spending limit being authorised. Generated presenters or voices would need appropriate usage rights and a clear place to record disclosures. They should never be presented as real customers giving testimonials they did not give.

The generation budget would need an atomic reservation before dispatch, so concurrent jobs cannot each spend the same remaining allowance. A successful job would settle its recorded cost; a failed or cancelled job would release only the unused amount. An uncertain provider charge would stay reserved until reconciled. Where a provider cannot give a firm price bound, the estimate would be labelled accordingly.

## Assemble a take, then review the actual export

Dailies calls a piece of creative a take. I’d like a take to retain its brief, source material, edits, output file and review history.

The first version can store a single generated clip or an imported recording. A later composition layer could add timed cuts, captions, voiceover, a music track and a closing card. These are extensions to the current plan, not features already implemented in the prototype.

A composition would be structured data: source asset IDs, time ranges, crop instructions, text and audio levels. A renderer would turn that description into a file. The review screen should play the exported file itself, so the reviewer sees the output that will actually be uploaded.

A square version would be a separate layout decision, not an automatic promise that cropping a vertical video preserves everything important. Captions, interface details and calls to action need enough space for the destination’s controls and overlays. I’d begin with one format and add others when there is a concrete use for them.

The prototype already has keep and cut decisions. I’d extend those with practical reasons: the product is hard to read, the opening takes too long, the claim is inaccurate, or the voice doesn’t fit. Those notes would make the next brief more useful than a simple rejection count.

Approval would attach to a particular revision. Changing its footage, copy or destination afterward would require another review. A take could be approved for export while still awaiting a separate decision to publish or spend money.

![A proposed take combines an opening, a real product demonstration and a next action, then exports the exact revision for approval.](figure:dailies-edit)

## Make long-running generation recoverable

A video job may outlive a browser tab or a server deployment. The current queue gives the plan a useful starting point: jobs live in Postgres, completed steps have saved outputs, and waiting work can release a worker until it is ready to continue.

The proposed real recipe is compact: plan the take, submit the provider request, check until it completes, create a poster and save the result. A run with several takes would have one job per take, so one failure would not require regenerating the rest.

I’d store media in object storage and pass asset references between steps. Job records would hold paths, checksums and metadata rather than video bytes. Rendered files would become available only after validation and a successful storage write.

There is an important limit to the step cache: it does not make an external request happen exactly once. A provider can accept a job just before our worker crashes, before the returned ID reaches our database.

Where supported, a stable provider idempotency key would identify the submission. Otherwise, Dailies would need to reconcile an uncertain request using the provider’s lookup facilities or hold it for review. Blindly resubmitting could buy the same generation twice. A lease token would also prevent an old worker from committing results after another worker has taken over the job.

![Generation separates submission, waiting and collection. An uncertain submission is reconciled before a retry.](figure:dailies-jobs)

Stopping a run needs similarly precise language. Holding queued takes is different from cancelling a job already accepted by a provider. The interface should say which work has stopped, which is still running and which costs are already committed.

## Connect accounts before offering a launch button

The prototype imagines Meta and TikTok for paid campaigns, with organic publishing alongside them. The integration work would start with one platform and an explicit record of what each connection can do.

A connection would store the workspace, platform, authorised account IDs, granted permissions, token expiry information and most recent successful check. Credentials would be encrypted on the server and kept out of prompts and client-side state. Product membership would govern who can prepare creative; permission to connect an account or launch a campaign would be a separate decision.

“Connected” is too broad a state for the whole interface. An account might allow reports to be read while lacking permission to create ads. A connection can also lose access after setup. I’d show reporting, upload, publishing and campaign-management capabilities independently, and check the relevant ones again when executing work.

Meta’s API represents campaigns, ad sets, creatives and ads as separate objects. TikTok’s Campaign Management API also exposes campaigns, ad groups and ads. Dailies would need platform adapters that preserve those relationships while presenting a smaller, understandable campaign brief. [Meta Marketing API reference](https://developers.facebook.com/docs/marketing-api/reference/v27.0/) and [TikTok Campaign Management](https://business-api.tiktok.com/portal/docs/campaign-management/v1.3).

I would keep a capability matrix for each adapter: supported objective, destination, placement, budget mode, media format and required account assets. If a combination is unsupported, the product should explain the missing piece before uploading a video.

Meta also applies rate limits by business use case and access tier. The connector therefore needs request pacing, backoff and visibility into delayed work. Platform access and review would be part of the implementation work, not an assumption made by the campaign screen. [Meta rate-limit documentation](https://developers.facebook.com/docs/graph-api/overview/rate-limiting/).

## Treat launching as a sequence with partial results

The proposed launch flow would start with a preview of the exact creative revision, account, objective, destination, audience, schedule and budget. The person approving it should be able to see what will be created and where money may be spent.

After approval, Dailies would upload the media, wait for processing, create the required platform objects in a paused state where supported, then read them back. Activation would happen only when the objects match the approved plan and the final launch decision is still valid.

These operations will not succeed as one database transaction. A video upload can succeed while ad creation fails. A timeout can leave us unsure whether an ad exists. Each step needs its own local operation record and the remote IDs it creates. Retries should resume from confirmed results, with uncertain writes reconciled before another creation attempt.

![A campaign progresses from approved plan through upload, paused objects and activation. Platform review and delivery remain external states.](figure:dailies-launch)

The screen would distinguish prepared, submitted, in review, rejected, paused and delivering states. A successful API response does not establish that an ad is being shown. Dailies would preserve the platform’s reported status and time of the last sync, with events and periodic reconciliation keeping the local view current.

Changes made directly in Ads Manager would matter too. If someone pauses an ad there, Dailies should read that change and surface it rather than silently reactivating the ad from an old desired state.

## Organic publishing is a separate integration

A kept take could also become an organic post, with channel-specific copy and a scheduled time. That does not mean paid access automatically grants posting access, or that every platform allows the same publishing experience.

TikTok is a concrete example. Its Direct Post guidelines restrict unaudited clients to private visibility and say that clients should be intended for a broad audience, rather than being an internal utility for accounts a team manages. That affects the early Dailies plan directly: testing it on our own products would not establish eligibility for public Direct Post access. [TikTok Content Sharing Guidelines](https://developers.tiktok.com/docs/en/content-sharing-guidelines).

The initial organic path could therefore be an export package: the video, caption, poster and a record of the intended account. A person could publish it in the platform and attach the resulting link. Direct posting would be added only where the product and its integration meet the platform’s requirements.

For an authorised scheduler, I’d store the intended local time, time zone and resolved execution time. Expired access would hold the post with a clear reason. Reconnecting would not immediately publish a backlog of stale posts; overdue items would return for a decision.

An accepted upload would also need a completion check. TikTok, for example, exposes a post-status endpoint. Dailies should display a completed publication only after confirmation, preserving any remote publication ID for later reconciliation. [TikTok post-status API](https://developers.tiktok.com/docs/en/content-posting-api-reference-get-video-status).

## Keep the creative connected to its results

The Performance area is where the idea becomes more useful to me. I want to recognise the video on a row and understand which version ran, where it ran, what it cost and what happened afterward.

That requires a more detailed model than one spend figure on a take. The same take could run in several accounts, placements and experiments. I’d connect a take revision to its exports, each export to its platform media and ad IDs, and each ad to report rows with an explicit reporting period.

Those rows would retain the platform, account, currency, time zone, objective, attribution settings, metric definitions and retrieval time. TikTok supports reports at advertiser, campaign, ad-group and ad levels; Meta exposes insights with breakdowns and attribution-window parameters. Those settings belong with the data. [TikTok basic reports](https://business-api.tiktok.com/portal/docs/basic-reports/v1.3) and [Meta Insights reference](https://developers.facebook.com/docs/graph-api/reference/adaccount/insights/).

![The record connects a brief to a take revision, export, platform ad and report. Creative identity stays separate from measured outcomes.](figure:dailies-lineage)

I wouldn’t add two platforms’ reported conversions together and label the total unique customers. Their attribution can overlap. I’d keep platform reports separate from first-party product events such as a completed signup or a first useful action, collected with the appropriate permissions. Link parameters can help connect a visit to a campaign, but they don’t resolve every attribution question.

Metrics also need sensible aggregation. Cost per result should be calculated from compatible total spend and total results, not by averaging row-level ratios. Unique reach is not generally additive. Missing data should remain missing, and amounts in different currencies should stay separate unless a visible conversion method is applied.

Generation and rendering costs would be recorded separately from media spend. That lets us understand the cost of making a set of variations as well as distributing them. An approval to generate a clip would not authorise an advertising budget.

Platform reports can arrive late or change. I’d refresh a recent reporting window, upsert rows at a known grain and show freshness. A local spending rule could request a pause when a limit is approached, but delayed reporting and delivery mean it cannot promise an exact stop at a precise amount. The approved platform budget remains an important control.

## Turn results into a better next question

I’d start with small experiments: change the opening, the demonstration or the closing action while keeping the other important choices reasonably stable. Each experiment would record what we were trying to learn before it ran.

A lower cost per click might suggest that an opening attracted attention. It would not establish that those people found the product useful. I want the review to include downstream actions where we can observe them, alongside audience, placement, spend and the amount of evidence available.

An assistant could summarise the results and suggest the next brief. That proposal should link to the report rows it used, explain what changed, and acknowledge thin or conflicting evidence. A small sample should lead to a tentative suggestion.

I would keep budget changes and launches outside that automatic feedback step. Early on, the value is helping me make a better decision, with enough context to disagree.

## Build one complete path first

The broader plan is substantial. I’d stage it around useful outcomes rather than trying to connect every tool at once.

First, I want a versioned brief, imported real footage and a reviewable export with its source history intact. Then one genuine generation provider can join the same library, with estimates, recoverable jobs and recorded costs.

Next would come one paid-platform connector: explicit account permissions, a small approved campaign, reliable status reconciliation and report data mapped back to the creative. Organic export would remain useful while direct-posting eligibility is worked through. Additional platforms, formats and automated capture would follow when the first workflow is dependable.

Finally, the performance history could support proposals for the next experiment. The test would be whether I can explain why we made a particular video, find exactly where it ran, and use the results to make a better next attempt.

I’m interested in Dailies because we have real products and plenty of material to work with. I don’t yet know whether the broader product will earn a place beyond our own process. Making that process clearer, more reliable and easier to learn from is a concrete place to begin.
