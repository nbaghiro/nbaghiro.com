/**
 * Renders the small Markdown subset the chat answers use (paragraphs,
 * bullet and numbered lists, code blocks, `code`, **bold**, and links) as
 * React elements, so model output is never injected as HTML.
 */

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;

function safeHref(url) {
    return /^https:\/\/github\.com\//.test(url) ? url : null;
}

function inline(text, keyPrefix) {
    return text.split(INLINE).map((part, i) => {
        const key = `${keyPrefix}-${i}`;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
            return <code key={key}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return <strong key={key}>{part.slice(2, -2)}</strong>;
        }
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link) {
            const href = safeHref(link[2]);
            return href ? (
                <a key={key} href={href} target="_blank" rel="noreferrer">
                    {link[1]}
                </a>
            ) : (
                link[1]
            );
        }
        return part;
    });
}

function AnswerText({ text }) {
    const blocks = [];
    const parts = text.split(/```[^\n]*\n?/);
    // Outside code blocks, show Markdown headings as a bold line of their own
    for (let i = 0; i < parts.length; i += 2) {
        parts[i] = parts[i].replace(/^#{1,6}\s+(.+)$/gm, "\n**$1**\n");
    }
    parts.forEach((part, i) => {
        if (i % 2 === 1) {
            blocks.push(<pre key={`code-${i}`}>{part.replace(/\n$/, "")}</pre>);
            return;
        }
        part.split(/\n{2,}/).forEach((para, j) => {
            const lines = para.split("\n").filter((l) => l.trim());
            if (lines.length === 0) return;
            const key = `p-${i}-${j}`;
            if (lines.every((l) => /^\s*[-*] /.test(l))) {
                blocks.push(
                    <ul key={key}>
                        {lines.map((l, k) => (
                            <li key={k}>{inline(l.replace(/^\s*[-*] /, ""), `${key}-${k}`)}</li>
                        ))}
                    </ul>
                );
            } else if (lines.every((l) => /^\s*\d+\. /.test(l))) {
                blocks.push(
                    <ol key={key}>
                        {lines.map((l, k) => (
                            <li key={k}>{inline(l.replace(/^\s*\d+\. /, ""), `${key}-${k}`)}</li>
                        ))}
                    </ol>
                );
            } else {
                blocks.push(<p key={key}>{inline(lines.join(" "), key)}</p>);
            }
        });
    });
    return <div className="answer-text">{blocks}</div>;
}

export default AnswerText;
