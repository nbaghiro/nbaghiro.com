import { Link } from "react-router-dom";
import { Field } from "./actions";

export const FOUNDER_POSTS = [
    {
        id: "when-software-factories-help",
        title: "Where software factories are useful",
        text: "Software factories can help when a growing team keeps repeating the same operational work. Early product development is less predictable, so we would start with a specific recurring task before building a larger automation system.\n\nGumloop’s article describes one approach to this. Their system investigates engineering problems and prepares changes for human review. The part we would start with is gathering the evidence people repeatedly need.\n\nFor example, suppose bookings are succeeding but confirmation emails are delayed. A workflow could collect queue age, recent deployments, failed job traces, and related support reports into one incident record. An agent could then investigate the cause and prepare a reproduction.\n\nThat does not mean it should also decide to change production. Restoring service, preparing a permanent fix, and checking whether customers are receiving confirmations again are separate steps.\n\nThe extra machinery has costs too. It needs permissions, retry rules, recovery when a worker stops, and someone responsible for its output. If it prepares twelve patches a day and the team can review four, it has created another queue.\n\nWe would start with one recurring task and measure whether it reduces the team's work. As usage and repetition grow, more coordination may become worthwhile.\n\nThe article covers the incident flow, the operational costs, and where we would stop automating:\nhttps://nbaghiro.com/blogs/when-software-factories-help",
        url: "https://nbaghiro.com/blogs/when-software-factories-help",
        linkLabel: "Read the article",
    },
    {
        id: "resuming-an-ai-response",
        title: "Resuming an AI response after a disconnect",
        text: "In FlowMaestro, we save events from an AI run so the browser can reconnect and continue receiving the response after a disconnect.\n\nIn FlowMaestro, the agent execution route reads from a Redis Stream. The worker appends events as it runs, and the API sends each entry with its Redis ID as the SSE event ID.\n\nIf the browser receives event 7 and disconnects while 8, 9, and 10 are produced, it can reconnect with Last-Event-ID set to 7. The server reads the retained entries after that position, then keeps following the same log. Replay and live delivery use the same cursor.\n\nFresh connections need another rule. We keep a marker for the latest user message so a new connection can start at the current turn without replaying earlier turns. If the execution has finished and its event log is gone, the route can recover the final answer from the stored execution state.\n\nThere are limits. Retention bounds how far back replay works. An append failure can leave a gap because the worker continues even if event logging fails. An SSE cursor also says what the browser received, not whether the interface successfully applied it.\n\nThe frontend needs to distinguish a temporary connection error from a terminal error sent by the application. Closing EventSource on every network interruption would prevent its automatic reconnect.\n\nThe article covers the cursor flow, turn markers, terminal recovery, and the failure cases we would test before making stronger delivery guarantees:\nhttps://nbaghiro.com/blogs/resuming-an-ai-response",
        url: "https://nbaghiro.com/blogs/resuming-an-ai-response",
        linkLabel: "Read the article",
    },
    {
        id: "recovering-ai-credit-reservations",
        title: "Recovering AI credit reservations after a crash",
        text: "In Galleo, we reserve credits before an AI task starts and return any unused credits when it finishes. The harder part is handling a crash, when the task stops before it can report its final usage or release the reservation.\n\nA workspace with 100 credits might reserve 30, leaving 70 available during the run. If the run uses 8, we return the remaining 22, leaving a balance of 92.\n\nWhile a run is active, it renews a database lease and saves its recorded usage every 30 seconds. Recovery finds expired operations and settles them using the last saved checkpoint, without repeating the AI request.\n\nThat checkpoint has limits. The provider may have done more work than the application managed to record. An expired lease can also mean the database was temporarily unreachable, rather than the worker having stopped.\n\nDatabase locks ensure each operation can settle only once. If recovery settles it first, a worker returning later cannot charge again. We also mark recovered operations so they can be distinguished from runs that finished normally.\n\nThis prevents duplicate settlement and releases unused reservations. It does not guarantee that the last checkpoint captures the full provider cost.\n\nThe article covers the implementation, recovery races, and how to handle underestimated usage:\nhttps://nbaghiro.com/blogs/recovering-ai-credit-reservations",
        url: "https://nbaghiro.com/blogs/recovering-ai-credit-reservations",
        linkLabel: "Read the article",
    },
    {
        id: "tenant-isolation-in-postgresql",
        title: "Tenant isolation in PostgreSQL",
        text: "In LumiSchool, a tutor can work with several families. We use PostgreSQL row-level security to keep each family’s records separate, including when an application query misses a family filter.\n\nThe database layer uses PostgreSQL row-level security for that boundary. Request queries run through a restricted role, inside a transaction that sets the current family and user with set_config(..., true).\n\nThe true argument makes those settings local to the transaction. Once it commits or rolls back, the next request sets its own context, even if the pool gives it the same connection.\n\nThe policies check existing rows with USING and proposed rows with WITH CHECK. Composite foreign keys also prevent a record in one family from referring to a child in another. Shared catalog rows have a separate read policy, without shared write access.\n\nThere are limits. The server still has to authenticate the caller and choose the right family. A shared application role can set its own context, so this does not protect against arbitrary SQL execution under that role. Tutor permissions within a family also need their own checks.\n\nThe test suite checks the migrated schema against the policy definitions, then exercises queries without family filters and connection reuse. Those answer different questions: whether the policies are present, and whether the tested queries behave as intended.\n\nThe article covers the implementation and its limits here:\nhttps://nbaghiro.com/blogs/tenant-isolation-in-postgresql",
        url: "https://nbaghiro.com/blogs/tenant-isolation-in-postgresql",
        linkLabel: "Read the article",
    },
    {
        id: "ordering-collaborative-edits",
        title: "Keeping collaborative edits in order",
        text: "In Galleo, we save edits from people working on the same document in a defined order. We also keep track of completed writes so a lost connection does not cause the same edit to be applied twice.\n\nIn Galleo, a room queues incoming socket edits one at a time. Each write locks the document row, applies the change, and commits a new sequence number. The sender gets an acknowledgement; the other people get the operations.\n\nThe unit of change matters. If one person changes a title's colour while another changes its text, those edits touch separate data keys and both survive. If we change the same key, the later applied value wins. Structural changes from an outdated revision can be refused instead of overwriting a document the person never saw.\n\nThe less obvious part is a lost acknowledgement. A change may already be saved when the socket drops. The browser retries it over HTTP with the same mutation ID, and a receipt stored with the original write returns its result without applying the change again.\n\nThere are limits. Editing leases help people avoid typing in the same element, but they do not enforce content writes. There is no character-level text merge. Rooms and their recent history live in one process, so a restart needs a document reload, and adding another server requires more coordination.\n\nThe article covers the queue, database boundary, save handover, and the cases this design still needs to handle:\nhttps://nbaghiro.com/blogs/ordering-collaborative-edits",
        url: "https://nbaghiro.com/blogs/ordering-collaborative-edits",
        linkLabel: "Read the article",
    },
    {
        id: "fetching-user-provided-urls",
        title: "Fetching a URL someone else controls",
        text: "In Tondo, we fetch website content when someone pastes a link for the assistant to read. We also download images from supplied URLs. Both paths need to check where the server is connecting before fetching anything.\n\nBoth use the same HTTP wrapper. The DNS check happens as the connection is established.\n\nResolving a hostname, checking its address, and then passing the URL to an HTTP client can leave a gap. The client may resolve the name again and receive a different answer.\n\nTondo puts the check in the lookup function used to establish the connection. It inspects every returned address and rejects the result if any address matches the blocked ranges. A response containing both public and private addresses fails the check.\n\nRedirects repeat the process. A public first URL does not make its next destination acceptable. The wrapper follows at most three redirects and keeps one 15-second deadline across that chain.\n\nThe limits need careful wording too. The current page limit returns at most 2 MB, but oversized responses are truncated without a flag. That bounds the returned content, not every temporary allocation. Image download limits also do not bound decoded image memory.\n\nThe article covers the connection checks, IPv6 cases, redirect handling, and the parts we would tighten next. The focused tests cover policy decisions; they are not a full verification of the network boundary.\n\nhttps://nbaghiro.com/blogs/fetching-user-provided-urls",
        url: "https://nbaghiro.com/blogs/fetching-user-provided-urls",
        linkLabel: "Read the article",
    },
    {
        id: "permissions-before-cached-exports",
        title: "Checking permissions before serving a cached export",
        text: "When serving a cached export, we still need to check whether the person requesting it has access. The file may be unchanged even though their permissions have changed.\n\nImagine a report exported on Monday. The PDF is saved so the next request does not have to render it again. On Tuesday, a team member is removed from the workspace but requests that same export.\n\nThe cache lookup should come after checking whether they can export that report now. The same permission check needs to cover both a cache hit and a request that starts new work.\n\nThe cache key solves a different problem: identifying the bytes. It needs the document revision, output format, and any settings that change the result. Redaction and personalized watermarks matter here too. Two people can share a cached file only when they are allowed to receive the same content.\n\nBackground jobs add another timing issue. Permission can change while a file is being generated. We would keep the completed file private and check access again when the client requests a download.\n\nSigned URLs also have a tradeoff. They make delivery efficient, but a URL already issued can remain usable until it expires. Removing someone from a workspace does not automatically revoke that link.\n\nThe article walks through a design covering authorization, cache identity, background work, and download lifetimes:\nhttps://nbaghiro.com/blogs/permissions-before-cached-exports",
        url: "https://nbaghiro.com/blogs/permissions-before-cached-exports",
        linkLabel: "Read the article",
    },
    {
        id: "calendar-membership-and-incremental-sync",
        title: "Calendar membership and incremental sync",
        text: "When syncing a calendar, we need to track both the appointments that belong there and the changes since the last sync. Those are different sets of records.\n\nSuppose appointments A, B, and C are already copied to a staff member's calendar. Only B changes. The next delta contains B, but A and C still belong there. Treating everything absent from that response as deleted would remove valid appointments.\n\nThe opposite problem happens with cancellations. If the source query only returns active appointments, a canceled event can disappear from the query while its old copy stays on the calendar. The integration needs explicit removals or a complete reconciliation of the records it manages.\n\nPagination matters too. A failed second page cannot be treated as the end of the calendar. We would stage a full membership pass and only use it for cleanup after all pages succeed. Incremental cursors should advance after changes are safely recorded, with remote delivery tracked separately when it cannot share the database transaction.\n\nMoving date windows add another case: an appointment can enter the window without being edited. A modified-since query alone will not find that change.\n\nThe article covers those cases using a fictional appointment service, including cursor scope, retries, permission changes, and the difference between a completed sync and a recent attempt:\nhttps://nbaghiro.com/blogs/calendar-membership-and-incremental-sync",
        url: "https://nbaghiro.com/blogs/calendar-membership-and-incremental-sync",
        linkLabel: "Read the article",
    },
    {
        id: "stock-movements-and-repeated-events",
        title: "Keeping stock correct when events repeat",
        text: "In Clientbridge, we record stock changes against individual sale lines. That lets us recognise a repeated payment notification without subtracting the same products again.\n\nIn Clientbridge, each stock movement is keyed by the sale line and its reason. Selling two bottles records a quantity of -2 with reason “sale”. A full refund can record +2 with reason “refund”. A unique database index prevents a second movement with the same pair.\n\nThe code inserts the movement with ON CONFLICT DO NOTHING and only updates the count if the insert returns a new ID. Both writes belong to the same transaction, so a rollback removes both.\n\nThere is a separate concurrency problem when two different sales affect the same item. Both movements are valid. A row lock makes their count updates wait for each other, so one cannot overwrite the other's subtraction.\n\nThe product rules still need care. Pending online checkouts hold stock before payment finishes. Partial refunds leave stock out. Full refunds restore it, which is a limitation when the goods are damaged or never returned. The current model also assumes whole units.\n\nThe article covers those decisions, the tests, and where the approach would need to change for a more detailed returns system:\nhttps://nbaghiro.com/blogs/stock-movements-and-repeated-events",
        url: "https://nbaghiro.com/blogs/stock-movements-and-repeated-events",
        linkLabel: "Read the article",
    },
    {
        id: "invoice-arithmetic-down-to-the-cent",
        title: "Keeping invoice arithmetic consistent down to the cent",
        text: "In Clientbridge, we keep invoice amounts consistent across the invoice, payment page, and receipt. That includes preserving the issued amounts after a business changes its settings.\n\nWe store money in integer cents, but that only solves part of the problem. A rate of 9.975% needs more precision than whole basis points. The backend keeps the decimal rate and uses rational arithmetic for the calculation, then rounds each tax component on each line.\n\nThe rounding point matters. Two five-cent lines at an illustrative 10% rate produce one cent of tax each. Combining the lines before rounding produces one cent in total. The invoice needs to follow one policy throughout its lines, payment page, and receipt.\n\nDiscounts need an allocation rule too. A one-cent discount across three equal lines cannot be divided evenly in cents. We allocate the whole-cent shares, then distribute the remainder in a stable order before calculating tax.\n\nOnce an invoice is issued, its stored line tax is used in later views. Changing a business setting should not change what that invoice says the client owes. Drafts and open estimates have different rules, and repricing checks again after acquiring a lock so it can notice a payment that started while it waited.\n\nThere is still a tradeoff in the current model: we store each line's tax total and reconstruct its jurisdiction breakdown from historical rates. Storing the full calculation at issue time would make that history more independent of later rate-table changes.\n\nThe article covers the arithmetic, document states, and tests here:\nhttps://nbaghiro.com/blogs/invoice-arithmetic-down-to-the-cent",
        url: "https://nbaghiro.com/blogs/invoice-arithmetic-down-to-the-cent",
        linkLabel: "Read the article",
    },
    {
        id: "serving-pages-on-customer-domains",
        title: "Serving pages on customer domains",
        text: "In Tondo, we let people publish a page on their own domain. Those domains serve public page content, while the editor, login, and account APIs stay on the application’s own domain.\n\nA request to maya.example.com can show that person's page, follow its tracked links, and load public photos. It cannot reach /app, /login, account APIs, or another person's page.\n\nThe hostname check runs before the application router. New application endpoints stay unavailable on customer domains unless we explicitly allow them there.\n\nOwnership is a separate check. Pointing DNS at shared hosting does not tell us which account owns the domain. We ask for a TXT value tied to the page ID and hostname, then check the hosting provider before marking the domain verified.\n\nThe database allows several pending requests for one domain, but a partial unique index permits only one verified holder. Asking first does not reserve a name.\n\nThere are tradeoffs. A verified domain still needs a published page and an eligible plan. Cached data can delay changes reaching another server process. DNS can break after verification. Transferring a domain also crosses DNS, hosting, and database state, so a successful first check does not settle every failure case.\n\nThe article covers the request flow, ownership checks, caching, and the parts that need separate operational testing:\nhttps://nbaghiro.com/blogs/serving-pages-on-customer-domains",
        url: "https://nbaghiro.com/blogs/serving-pages-on-customer-domains",
        linkLabel: "Read the article",
    },
    {
        id: "sharing-datasets-between-backtests",
        title: "Sharing datasets between backtests",
        text: "In LlamaTrade, we prepare and cache historical price data so backtests using different strategies can share the same inputs. The cache needs to distinguish requests that look similar but need different data.\n\nThe cache key includes the symbols, interval, warm-up start, end date, price adjustment, and a version for recent data. Symbol order does not matter. A longer warm-up period or a different adjustment does.\n\nOn a cache miss, a worker can acquire a Redis lease and prepare the dataset while other workers wait. It writes compressed Parquet to a temporary file, then replaces the final path once the write is complete. Readers do not need to open a file that is still being written.\n\nThere are important limits. Workers need access to the same storage; sharing Redis does not make their local disks shared. The lease can expire, and a waiting worker eventually prepares its own copy, so duplicate work is possible.\n\nThe key also describes the requested data, not the bytes returned by the provider. Historical revisions mean that repeatable research needs a record of the exact snapshot used, beyond a cache key and freshness policy.\n\nThe article covers the implementation, the failure cases, and what we would change before relying on it across more workers:\nhttps://nbaghiro.com/blogs/sharing-datasets-between-backtests",
        url: "https://nbaghiro.com/blogs/sharing-datasets-between-backtests",
        linkLabel: "Read the article",
    },
    {
        id: "mux-videojs",
        title: "Mux, Video.js, and the cost of video",
        text: "Mux has been one of the easier video APIs for us to work with. It handles uploads, processing, and delivery, while Video.js handles playback in the browser. The integration is straightforward, but usage and pricing still need attention.\n\nThe backend creates an upload URL, the browser sends the file directly to Mux, and a webhook tells the application when the asset is ready. Video.js handles playback in the browser. The application server never needs to carry the video bytes.\n\nThe details still matter. Upload complete does not mean playback ready. Webhooks can arrive more than once, so processing needs to be safe to repeat. A public playback ID is accessible outside your app; private content needs signed playback tied to your own permission checks.\n\nThe pricing tradeoff is less obvious from the integration code. You pay for the library you retain and the video you deliver, with rates that vary by resolution and quality. Buffered video counts as delivery even if the viewer leaves before watching it.\n\nFor example, 100,000 sessions averaging three delivered minutes produce 300,000 minutes of delivery. At the current Basic rate up to 720p, that is $160 in delivery after the first 100,000 free minutes, before credits and storage. If those billable minutes were all delivered at 4K, it would be $640.\n\nThat makes player behavior part of the product economics. Loading offscreen videos, keeping unnecessary MP4 copies, or allowing every preview to stream at full resolution can add costs. Loading less in advance can save delivery, but also makes startup slower.\n\nThe managed pipeline saves us work. We would still model viewing and storage alongside the subscription price, then check the real usage as the product grows.\n\nThe article covers the upload flow, Video.js integration, signed playback, and a worked cost example here:\nhttps://nbaghiro.com/blogs/mux-videojs-and-the-cost-of-video",
        url: "https://nbaghiro.com/blogs/mux-videojs-and-the-cost-of-video",
        linkLabel: "Read the article",
    },
    {
        id: "stripe-subscriptions",
        title: "Making Stripe subscriptions repeatable",
        text: "When we add Stripe subscriptions to a product, much of the setup is familiar: plans, prices, checkout, renewals, cancellations, and keeping access in sync with billing.\n\nWe’ve automated much of that repeated work and are shaping it into standalone billing tooling, separate from the individual product repositories.\n\nThe setup script reads a product’s plan catalog and configures Stripe products, prices, the customer portal, and the webhook endpoint. It can preview changes and check for differences without writing anything.\n\nThe application handles another part of the repetition. Retrying a checkout can reuse the same purchase attempt. Webhook receipts are saved in the same transaction as their billing changes. Credits are granted once per paid period, even when several events report it.\n\nThere are limits to what should carry over unchanged. Moving a lookup key to a new price does not migrate existing subscribers. Grace periods, upgrade timing, and cancellation rules still need to fit each product.\n\nThe goal is for each product to supply its configuration and use the shared tooling for the repeated work. The existing implementations give us a tested starting point. The article covers the setup, the failure cases, and the parts that still need product-specific decisions:\nhttps://nbaghiro.com/blogs/making-stripe-subscriptions-repeatable",
        url: "https://nbaghiro.com/blogs/making-stripe-subscriptions-repeatable",
        linkLabel: "Read the article",
    },
    {
        id: "terraform-pulumi",
        title: "Terraform and Pulumi across three projects",
        text: "We use Terraform for LlamaTrade and Pulumi for Clientbridge and FlowMaestro. One useful comparison is how each setup lets us check infrastructure settings alongside the application settings that depend on them.\n\nOne example is database connections. The database needs enough capacity for the application’s connection pools, including the overlap when old and new instances run during a deployment.\n\nIn Clientbridge, the Pulumi code and a Python test use shared settings to check that total. In LlamaTrade, Terraform and the Kubernetes configuration are separate, so checking the same requirement needs values from both.\n\nBoth tools can support that check. The difference in these projects is how the configuration is organized and what tests are in place.\n\nThe article covers those examples, along with secrets, providers, and deployment previews:\nhttps://nbaghiro.com/blogs/terraform-and-pulumi",
        url: "https://nbaghiro.com/blogs/terraform-and-pulumi",
        linkLabel: "Read the article",
    },
    {
        id: "switching-cost",
        title: "The cost of switching",
        text: "When we talk about switching to Clientbridge (clientbridge.ca), the work involved matters as much as the features. A business may like the product and still need a practical way to move its records and routines.\n\nThe setup looks different from one business to the next. It might be Clover for payments, a separate booking tool, and spreadsheets or messages to keep track of the rest. Much of the process is manual, but it’s familiar and they know how to manage it. Switching means changing those routines while keeping the business running.\n\nThose recurring needs also give us a reason to keep building. Once a business trusts you with its daily work, there is an opportunity to help with more of it, from booking through to payment, without making them manage everything in separate tools.\n\nThat gives us confidence in the direction. The part we still have to earn is making the move worthwhile and continuing to deliver value afterwards.\n\nThe article looks more closely at switching costs and the sales process:\nhttps://nbaghiro.com/blogs/the-cost-of-switching",
        url: "https://nbaghiro.com/blogs/the-cost-of-switching",
        linkLabel: "Read the article",
    },
    {
        id: "galleo",
        title: "Where presentation tools fit now",
        text: "AI apps can now handle more of the work involved in making a presentation. That changes what a separate presentation tool needs to offer, and how we think about Galleo.\n\nYou can already give ChatGPT or Claude your notes, a document, or an outline and ask it to generate a slide deck right inside the app. You can work through the content and ask for revisions in the same conversation, without moving everything into another tool.\n\nThere’s still a place for dedicated presentation software, especially when you need precise design control or a team’s established workflow. But for someone who just needs a clear presentation, the AI app they already use can handle more of that work now. A separate product has to offer enough to justify the extra step and subscription.\n\nWe built Galleo to turn the same content into a presentation, document, or website.\n\nWe’re making the code available for anyone who wants to fork it, build on it, or reuse parts they find useful. The live version will stay running at galleo.app.\n\nCode: https://github.com/nbaghiro/galleo",
        url: "https://github.com/nbaghiro/galleo",
        linkLabel: "Open the repository",
        note: "Before publishing: Galleo’s repository is public but has no license yet. Add a license that permits the reuse described in this draft.",
    },
];

export function FounderPosts() {
    return (
        <>
            <p>
                <Link className="btn" to="/ads/technical-posts">
                    Open technical posts with visuals
                </Link>
            </p>
            <p className="lede">
                Personal posts about building products and the decisions behind
                them.
            </p>
            {FOUNDER_POSTS.map((post) => (
                <section className="post" id={post.id} key={post.id}>
                    <div className="post-head">
                        <h2>{post.title}</h2>
                        <p className="meta">Personal profile · Draft</p>
                    </div>
                    {post.note && <p className="lede">{post.note}</p>}
                    <Field label="Post copy" text={post.text} count />
                    <div className="actions">
                        <a
                            className="btn"
                            href={post.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {post.linkLabel}
                        </a>
                        {post.id === "galleo" && (
                            <a
                                className="btn"
                                href="https://galleo.app"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open Galleo
                            </a>
                        )}
                    </div>
                </section>
            ))}
        </>
    );
}
