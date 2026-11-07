import { Field } from "./actions";

export const FOUNDER_POSTS = [
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
