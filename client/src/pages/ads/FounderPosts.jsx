import { Field } from "./actions";

export const FOUNDER_POSTS = [
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
                Personal posts about building Clientbridge and Galleo.
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
