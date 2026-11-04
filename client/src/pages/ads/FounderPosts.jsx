import { Field } from "./actions";

export const FOUNDER_POSTS = [
    {
        id: "switching-cost",
        title: "The cost of switching",
        text: "One challenge with building Clientbridge (clientbridge.ca) is that a business can like the product and still have good reasons not to switch.\n\nTheir clients, upcoming bookings, payments, and staff routines are already tied to another system. Moving all of that takes time, and the business has to keep running through the change.\n\nI also see something encouraging in that. These are important, recurring needs. Once a business trusts you with its daily work, there is an opportunity to help with more of it, from booking through to payment, without making them manage everything in separate tools.\n\nThat gives me confidence in the direction. The part we still have to earn is making the move worthwhile and continuing to deliver value afterwards.\n\nI wrote more about this here:\nhttps://nbaghiro.com/blogs/the-cost-of-switching",
        url: "https://nbaghiro.com/blogs/the-cost-of-switching",
        linkLabel: "Read the article",
    },
    {
        id: "galleo",
        title: "Presentation tools are dead",
        text: "Presentation tools are dead. At least the ones whose main value is helping you arrange text in boxes.\n\nWhen an agent can turn the same material into a deck, document, or working website, a separate subscription just to make slides becomes a harder sell. Adding a prompt box doesn’t change that.\n\nI built Galleo around that idea: one piece of content, presented in different formats. I’m opening up the code so anyone can fork it, build on it, or reuse whatever parts they find useful.\n\nThe live version will stay running at galleo.app.\n\nCode: https://github.com/nbaghiro/galleo",
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
