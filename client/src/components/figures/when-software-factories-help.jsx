import { frame, Plate, useNarrow, useReveal, WIDE, NARROW } from "./plate";
import { factoryScene } from "./factory-ascii.mjs";
import "./factory-ascii.css";

function renderScene(kind, narrow, host, shown) {
    const scene = factoryScene(kind, narrow);
    const w = narrow ? NARROW : WIDE;
    const cell = narrow ? 8.3 : 8.7;
    const pitch = narrow ? 18 : 20;
    const h = 90 + scene.lines.length * pitch + (narrow ? 100 : 85);
    const foot = narrow
        ? {
              fit: ["Choose for the task.", "More machinery is not a goal."],
              incident: [
                  "Example flow. A hypothesis does not",
                  "authorize a production change.",
              ],
              review: ["Illustrative rates;", "not production measurements."],
          }[kind]
        : [scene.footer];
    return (
        <svg
            ref={host}
            className={`fig factory-ascii ${shown ? "is-shown" : ""}`}
            viewBox={frame(w, h)}
            role="img"
            aria-labelledby={`factory-${kind}-title factory-${kind}-desc`}
        >
            <title id={`factory-${kind}-title`}>{scene.title}</title>
            <desc id={`factory-${kind}-desc`}>{scene.description}</desc>
            <Plate w={w} h={h} ground={[]}>
                <text
                    className="fig-title"
                    x="14"
                    y="32"
                    style={{ fontSize: narrow ? 17 : 19 }}
                >
                    {scene.title}
                </text>
                <text className="fig-sub" x="14" y="55">
                    {kind === "review"
                        ? "A queue needs a limit and an owner."
                        : kind === "incident"
                          ? "One record, with separate responsibilities."
                          : "Three choices for different kinds of work."}
                </text>
                {scene.lines.map(
                    (line, i) =>
                        line && (
                            <text
                                key={i}
                                className={`factory-ascii-row ${line.includes("->") || line.trim() === "v" ? "factory-ascii-flow" : ""}`}
                                x="14"
                                y={92 + i * pitch}
                                textLength={line.length * cell}
                                lengthAdjust="spacingAndGlyphs"
                                xmlSpace="preserve"
                                style={{
                                    fontSize: cell / 0.6,
                                    "--flow-delay": `${Math.min(i * 0.045, 1)}s`,
                                }}
                                aria-hidden="true"
                            >
                                {line}
                            </text>
                        )
                )}
                {foot.map((line, i) => (
                    <text
                        key={line}
                        className="fig-sub"
                        x="14"
                        y={h - 52 + i * 18}
                    >
                        {line}
                    </text>
                ))}
            </Plate>
        </svg>
    );
}
function TaskFit() {
    const n = useNarrow(),
        [host, shown] = useReveal();
    return renderScene("fit", n, host, shown);
}
function IncidentFlow() {
    const n = useNarrow(),
        [host, shown] = useReveal();
    return renderScene("incident", n, host, shown);
}
function ReviewCapacity() {
    const n = useNarrow(),
        [host, shown] = useReveal();
    return renderScene("review", n, host, shown);
}
export const FACTORY_ASCII_FIGURES = {
    "factory-task-fit": TaskFit,
    "factory-incident-flow": IncidentFlow,
    "factory-review-capacity": ReviewCapacity,
};
