// The kit's own written strategy, kept beside the posts it governs rather than in a document
// somewhere else. A section's body is a list of blocks: a string is a paragraph, { list } a
// bullet list, { table } a table with a head row. No markdown, because the manifest is the
// source and a parser here would be a second place for the copy to drift.
export function Strategy({ manifest }) {
    const doc = manifest.notes;
    if (!doc?.sections?.length) return null;
    return (
        <>
            {doc.lede && <p className="lede">{doc.lede}</p>}
            <article className="strategy">
                {doc.sections.map((section) => (
                    <section key={section.heading}>
                        <h2>{section.heading}</h2>
                        {section.body.map((block, i) =>
                            typeof block === "string" ? (
                                <p key={i}>{block}</p>
                            ) : block.list ? (
                                <ul key={i}>
                                    {block.list.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            ) : block.table ? (
                                <div className="scroller" key={i}>
                                    <table>
                                        <thead>
                                            <tr>
                                                {block.table.head.map((cell) => (
                                                    <th key={cell} scope="col">
                                                        {cell}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {block.table.rows.map((row) => (
                                                <tr key={row[0]}>
                                                    {row.map((cell, c) =>
                                                        c === 0 ? (
                                                            <th key={c} scope="row">
                                                                {cell}
                                                            </th>
                                                        ) : (
                                                            <td key={c}>{cell}</td>
                                                        )
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : null
                        )}
                    </section>
                ))}
            </article>
        </>
    );
}
