/**
 * The small Markdown subset the written pieces use, rendered as React elements rather than
 * injected as HTML: headings, paragraphs, bullet and numbered lists, blockquotes, fenced code,
 * `code`, **bold**, *italic* and links.
 */
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;

function inline(text, key) {
    return text.split(INLINE).map((part, i) => {
        const k = `${key}-${i}`;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
            return <code key={k}>{part.slice(1, -1)}</code>;
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return <strong key={k}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return <em key={k}>{part.slice(1, -1)}</em>;
        }
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link && /^https?:\/\//.test(link[2])) {
            return (
                <a key={k} href={link[2]} target="_blank" rel="noreferrer">
                    {link[1]}
                </a>
            );
        }
        return part;
    });
}

function Prose({ text }) {
    const out = [];
    const lines = text.split("\n");
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) {
            i += 1;
        } else if (line.startsWith("```")) {
            const code = [];
            i += 1;
            while (i < lines.length && !lines[i].startsWith("```")) {
                code.push(lines[i]);
                i += 1;
            }
            i += 1;
            out.push(
                <pre key={out.length}>
                    <code>{code.join("\n")}</code>
                </pre>
            );
        } else if (/^#{1,3} /.test(line)) {
            // the piece's title is the page's h1, so a heading in the body starts at h2
            const level = line.indexOf(" ");
            const Tag = level <= 2 ? "h2" : "h3";
            const body = line.slice(level + 1);
            out.push(<Tag key={out.length}>{inline(body, out.length)}</Tag>);
            i += 1;
        } else if (line.startsWith("> ")) {
            const quote = [];
            while (i < lines.length && lines[i].startsWith("> ")) {
                quote.push(lines[i].slice(2));
                i += 1;
            }
            out.push(
                <blockquote key={out.length}>
                    {inline(quote.join(" "), out.length)}
                </blockquote>
            );
        } else if (/^[-*] |^\d+\. /.test(line)) {
            const ordered = /^\d+\. /.test(line);
            const items = [];
            while (i < lines.length && /^[-*] |^\d+\. /.test(lines[i])) {
                items.push(lines[i].replace(/^([-*] |\d+\. )/, ""));
                i += 1;
            }
            const List = ordered ? "ol" : "ul";
            out.push(
                <List key={out.length}>
                    {items.map((item, n) => (
                        <li key={n}>{inline(item, `${out.length}-${n}`)}</li>
                    ))}
                </List>
            );
        } else {
            const para = [];
            while (
                i < lines.length &&
                lines[i].trim() &&
                !/^(#{1,3} |> |```|[-*] |\d+\. )/.test(lines[i])
            ) {
                para.push(lines[i]);
                i += 1;
            }
            out.push(
                <p key={out.length}>{inline(para.join(" "), out.length)}</p>
            );
        }
    }
    return <div className="prose">{out}</div>;
}

export default Prose;
