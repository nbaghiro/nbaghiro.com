// LinkedIn's profile header at its own proportions: the cover, the photo overlapping its lower
// left, and the name block under it. Combos uses it to judge a pair before either is uploaded;
// a profile kit uses it to show the pair it has settled on.
export function ProfileHeader({ cover, avatar, name, headline, meta }) {
    return (
        <div className="mock">
            <img
                crossOrigin="anonymous"
                className="mock-cover"
                src={cover.url}
                alt={cover.label ?? "Cover"}
            />
            <img
                crossOrigin="anonymous"
                className="mock-avatar"
                src={avatar.url}
                alt={avatar.label ?? "Profile photo"}
            />
            <div className="mock-body">
                {name && <h3 className="mock-name">{name}</h3>}
                {headline && <p className="mock-headline">{headline}</p>}
                {meta && <p className="mock-meta">{meta}</p>}
                <div className="mock-buttons">
                    <span className="mock-btn solid">Follow</span>
                    <span className="mock-btn">Message</span>
                    <span className="mock-btn">More</span>
                </div>
            </div>
        </div>
    );
}
