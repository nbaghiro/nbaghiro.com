import { Field } from "./actions";

export const FOUNDER_POSTS = [
    {
        id: "stock-movements-and-repeated-events",
        title: "Keeping stock correct when events repeat",
        text: "A repeated payment notification should not subtract the same products from stock twice.\n\nIn Clientbridge, each stock movement is keyed by the sale line and its reason. Selling two bottles records a quantity of -2 with reason “sale”. A full refund can record +2 with reason “refund”. A unique database index prevents a second movement with the same pair.\n\nThe code inserts the movement with ON CONFLICT DO NOTHING and only updates the count if the insert returns a new ID. Both writes belong to the same transaction, so a rollback removes both.\n\nThere is a separate concurrency problem when two different sales affect the same item. Both movements are valid. A row lock makes their count updates wait for each other, so one cannot overwrite the other's subtraction.\n\nThe product rules still need care. Pending online checkouts hold stock before payment finishes. Partial refunds leave stock out. Full refunds restore it, which is a limitation when the goods are damaged or never returned. The current model also assumes whole units.\n\nI wrote about those decisions, the tests, and where the approach would need to change for a more detailed returns system:\nhttps://nbaghiro.com/blogs/stock-movements-and-repeated-events",
        url: "https://nbaghiro.com/blogs/stock-movements-and-repeated-events",
        linkLabel: "Read the article",
    },
    {
        id: "invoice-arithmetic-down-to-the-cent",
        title: "Keeping invoice arithmetic consistent down to the cent",
        text: "In Clientbridge, an invoice needs to show the same amount on its lines, payment page, and receipt, even after a business changes its settings.\n\nWe store money in integer cents, but that only solves part of the problem. A rate of 9.975% needs more precision than whole basis points. The backend keeps the decimal rate and uses rational arithmetic for the calculation, then rounds each tax component on each line.\n\nThe rounding point matters. Two five-cent lines at an illustrative 10% rate produce one cent of tax each. Combining the lines before rounding produces one cent in total. The invoice needs to follow one policy throughout its lines, payment page, and receipt.\n\nDiscounts need an allocation rule too. A one-cent discount across three equal lines cannot be divided evenly in cents. We allocate the whole-cent shares, then distribute the remainder in a stable order before calculating tax.\n\nOnce an invoice is issued, its stored line tax is used in later views. Changing a business setting should not change what that invoice says the client owes. Drafts and open estimates have different rules, and repricing checks again after acquiring a lock so it can notice a payment that started while it waited.\n\nThere is still a tradeoff in the current model: we store each line's tax total and reconstruct its jurisdiction breakdown from historical rates. Storing the full calculation at issue time would make that history more independent of later rate-table changes.\n\nI wrote about the arithmetic, document states, and tests here:\nhttps://nbaghiro.com/blogs/invoice-arithmetic-down-to-the-cent",
        url: "https://nbaghiro.com/blogs/invoice-arithmetic-down-to-the-cent",
        linkLabel: "Read the article",
    },
    {
        id: "serving-pages-on-customer-domains",
        title: "Serving pages on customer domains",
        text: "Adding custom domains to Tondo meant deciding which parts of the application should exist on someone else's hostname.\n\nA request to maya.example.com can show that person's page, follow its tracked links, and load public photos. It cannot reach /app, /login, account APIs, or another person's page.\n\nThe hostname check runs before the application router. New application endpoints stay unavailable on customer domains unless we explicitly allow them there.\n\nOwnership is a separate check. Pointing DNS at shared hosting does not tell us which account owns the domain. We ask for a TXT value tied to the page ID and hostname, then check the hosting provider before marking the domain verified.\n\nThe database allows several pending requests for one domain, but a partial unique index permits only one verified holder. Asking first does not reserve a name.\n\nThere are tradeoffs. A verified domain still needs a published page and an eligible plan. Cached data can delay changes reaching another server process. DNS can break after verification. Transferring a domain also crosses DNS, hosting, and database state, so a successful first check does not settle every failure case.\n\nI wrote more about the request flow, ownership checks, caching, and the parts that need separate operational testing:\nhttps://nbaghiro.com/blogs/serving-pages-on-customer-domains",
        url: "https://nbaghiro.com/blogs/serving-pages-on-customer-domains",
        linkLabel: "Read the article",
    },
    {
        id: "sharing-datasets-between-backtests",
        title: "Sharing datasets between backtests",
        text: "Two backtests can use different strategies and still need exactly the same historical prices. I added a preparation layer in LlamaTrade so those runs can reuse the input data.\n\nThe cache key includes the symbols, interval, warm-up start, end date, price adjustment, and a version for recent data. Symbol order does not matter. A longer warm-up period or a different adjustment does.\n\nOn a cache miss, a worker can acquire a Redis lease and prepare the dataset while other workers wait. It writes compressed Parquet to a temporary file, then replaces the final path once the write is complete. Readers do not need to open a file that is still being written.\n\nThere are important limits. Workers need access to the same storage; sharing Redis does not make their local disks shared. The lease can expire, and a waiting worker eventually prepares its own copy, so duplicate work is possible.\n\nThe key also describes the requested data, not the bytes returned by the provider. Historical revisions mean that repeatable research needs a record of the exact snapshot used, beyond a cache key and freshness policy.\n\nI wrote about the implementation, the failure cases, and what I would change before relying on it across more workers:\nhttps://nbaghiro.com/blogs/sharing-datasets-between-backtests",
        url: "https://nbaghiro.com/blogs/sharing-datasets-between-backtests",
        linkLabel: "Read the article",
    },
    {
        id: "mux-videojs",
        title: "Mux, Video.js, and the cost of video",
        text: "Mux is one of the best APIs I’ve worked with. It makes a fairly involved video pipeline easy to reason about.\n\nThe backend creates an upload URL, the browser sends the file directly to Mux, and a webhook tells the application when the asset is ready. Video.js handles playback in the browser. The application server never needs to carry the video bytes.\n\nThe details still matter. Upload complete does not mean playback ready. Webhooks can arrive more than once, so processing needs to be safe to repeat. A public playback ID is accessible outside your app; private content needs signed playback tied to your own permission checks.\n\nThe pricing tradeoff is less obvious from the integration code. You pay for the library you retain and the video you deliver, with rates that vary by resolution and quality. Buffered video counts as delivery even if the viewer leaves before watching it.\n\nFor example, 100,000 sessions averaging three delivered minutes produce 300,000 minutes of delivery. At the current Basic rate up to 720p, that is $160 in delivery after the first 100,000 free minutes, before credits and storage. If those billable minutes were all delivered at 4K, it would be $640.\n\nThat makes player behavior part of the product economics. Loading offscreen videos, keeping unnecessary MP4 copies, or allowing every preview to stream at full resolution can add costs. Loading less in advance can save delivery, but also makes startup slower.\n\nI still think the managed pipeline is a strong tradeoff. I would just model viewing and storage alongside the subscription price, then check the real usage as the product grows.\n\nI wrote about the upload flow, Video.js integration, signed playback, and a worked cost example here:\nhttps://nbaghiro.com/blogs/mux-videojs-and-the-cost-of-video",
        url: "https://nbaghiro.com/blogs/mux-videojs-and-the-cost-of-video",
        linkLabel: "Read the article",
    },
    {
        id: "stripe-subscriptions",
        title: "Making Stripe subscriptions repeatable",
        text: "Adding Stripe subscriptions to a new product usually brings back the same work: plans, prices, checkout, renewals, cancellations, and keeping access in sync with billing.\n\nI’ve automated much of that repeated work and am shaping it into standalone billing tooling, separate from the individual product repositories.\n\nThe setup script reads a product’s plan catalog and configures Stripe products, prices, the customer portal, and the webhook endpoint. It can preview changes and check for differences without writing anything.\n\nThe application handles another part of the repetition. Retrying a checkout can reuse the same purchase attempt. Webhook receipts are saved in the same transaction as their billing changes. Credits are granted once per paid period, even when several events report it.\n\nThere are limits to what should carry over unchanged. Moving a lookup key to a new price does not migrate existing subscribers. Grace periods, upgrade timing, and cancellation rules still need to fit each product.\n\nThe goal is for each product to supply its configuration and use the shared tooling for the repeated work. The existing implementations give me a tested starting point. I wrote about the setup, the failure cases, and the parts that still need product-specific decisions:\nhttps://nbaghiro.com/blogs/making-stripe-subscriptions-repeatable",
        url: "https://nbaghiro.com/blogs/making-stripe-subscriptions-repeatable",
        linkLabel: "Read the article",
    },
    {
        id: "terraform-pulumi",
        title: "Terraform and Pulumi across three projects",
        text: "I use Terraform for LlamaTrade and Pulumi for Clientbridge and FlowMaestro. Working with both has made me pay more attention to how the infrastructure settings and application settings are checked together.\n\nOne example is database connections. The database needs enough capacity for the application’s connection pools, including the overlap when old and new instances run during a deployment.\n\nIn Clientbridge, the Pulumi code and a Python test use shared settings to check that total. In LlamaTrade, Terraform and the Kubernetes configuration are separate, so checking the same requirement needs values from both.\n\nBoth tools can support that check. The difference in these projects is how the configuration is organized and what tests are in place.\n\nI wrote about those examples, along with secrets, providers, and deployment previews:\nhttps://nbaghiro.com/blogs/terraform-and-pulumi",
        url: "https://nbaghiro.com/blogs/terraform-and-pulumi",
        linkLabel: "Read the article",
    },
    {
        id: "switching-cost",
        title: "The cost of switching",
        text: "One challenge with building Clientbridge (clientbridge.ca) is that a business can like the product and still have good reasons not to switch.\n\nThe setup looks different from one business to the next. It might be Clover for payments, a separate booking tool, and spreadsheets or messages to keep track of the rest. Much of the process is manual, but it’s familiar and they know how to manage it. Switching means changing those routines while keeping the business running.\n\nI also see something encouraging in that. These are important, recurring needs. Once a business trusts you with its daily work, there is an opportunity to help with more of it, from booking through to payment, without making them manage everything in separate tools.\n\nThat gives me confidence in the direction. The part we still have to earn is making the move worthwhile and continuing to deliver value afterwards.\n\nI wrote more about this here:\nhttps://nbaghiro.com/blogs/the-cost-of-switching",
        url: "https://nbaghiro.com/blogs/the-cost-of-switching",
        linkLabel: "Read the article",
    },
    {
        id: "galleo",
        title: "Where presentation tools fit now",
        text: "I’m finding it harder to see why most people would need a separate AI presentation tool.\n\nYou can already give ChatGPT or Claude your notes, a document, or an outline and ask it to generate a slide deck right inside the app. You can work through the content and ask for revisions in the same conversation, without moving everything into another tool.\n\nThere’s still a place for dedicated presentation software, especially when you need precise design control or a team’s established workflow. But for someone who just needs a clear presentation, the AI app they already use can handle more of that work now. A separate product has to offer enough to justify the extra step and subscription.\n\nThat has changed how I think about Galleo, which I built to turn the same content into a presentation, document, or website.\n\nI’m making the code available for anyone who wants to fork it, build on it, or reuse parts they find useful. The live version will stay running at galleo.app.\n\nCode: https://github.com/nbaghiro/galleo",
        url: "https://github.com/nbaghiro/galleo",
        linkLabel: "Open the repository",
        note: "Before publishing: Galleo’s repository is public but has no license yet. Add a license that permits the reuse described in this draft.",
    },
];

export function FounderPosts() {
    return (
        <>
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
