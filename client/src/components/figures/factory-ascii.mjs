// Original character-grid drawings. Shared by the article and its generated cover.
function canvas(columns) {
    const rows = [];
    const put = (x, y, value) => {
        rows[y] ??= Array(columns).fill(" ");
        [...value].forEach((c, i) => {
            if (x + i >= columns)
                throw new Error(`ASCII row exceeds ${columns} columns`);
            rows[y][x + i] = c;
        });
    };
    const box = (x, y, width, title, a, b) => {
        const inside = width - 2;
        put(x + 2, y, "_".repeat(inside));
        put(x + 1, y + 1, "/" + " ".repeat(inside) + "/|");
        put(x, y + 2, "+" + "-".repeat(inside) + "+ |");
        [title, a, b].forEach((s, i) => {
            if (s.length > inside - 2)
                throw new Error(`ASCII label too long: ${s}`);
            put(x, y + 3 + i, "| " + s.padEnd(inside - 1) + "| |");
        });
        put(x, y + 6, "+" + "-".repeat(inside) + "+/");
    };
    const down = (x, y, n = 2) => {
        for (let i = 0; i < n - 1; i++) put(x, y + i, "|");
        put(x, y + n - 1, "v");
    };
    return {
        put,
        box,
        down,
        lines: () =>
            Array.from({ length: rows.length }, (_, i) =>
                (rows[i] || []).join("").trimEnd()
            ),
    };
}

export function factoryScene(kind, narrow = false) {
    const c = canvas(narrow ? 36 : 88);
    const { put, box, down } = c;
    let title, description, footer;
    if (kind === "fit") {
        title = "Match the machinery to the task";
        description =
            "Three alternatives: a script for known steps, an agent for bounded investigation, and a durable workflow for coordination across time. These are not maturity levels.";
        footer = "Choose for the task. More machinery is not a goal.";
        const options = [
            [
                "01 / SCRIPT",
                "Known steps",
                "Collect queue stats",
                "input -> run -> result",
            ],
            [
                "02 / AGENT",
                "Bounded investigation",
                "Explain a failure",
                "evidence -> hypothesis",
            ],
            [
                "03 / WORKFLOW",
                "Work across time",
                "Wait, retry, hand off",
                "job -> wait -> resume",
            ],
        ];
        options.forEach(([name, a, b, note], i) => {
            const x = narrow ? 1 : i * 30,
                y = narrow ? i * 11 : 0;
            box(x, y, narrow ? 31 : 25, name, a, b);
            put(x + 1, y + 8, note);
            if (!narrow)
                put(
                    x + 1,
                    y + 10,
                    ["one execution", "one question", "persistent state"][i]
                );
        });
    } else if (kind === "incident") {
        title = "Prepare evidence before action";
        description =
            "Signals are collected into one incident record. An investigator separates observations from hypotheses. A responder selects mitigation, then the workflow observes user-facing recovery. A permanent repair can proceed separately.";
        footer = "Example flow. A hypothesis does not authorize a change.";
        if (narrow) {
            const steps = [
                [
                    "01 / INCIDENT RECORD",
                    "Alerts + support + traces",
                    "Bounded, dated evidence",
                ],
                [
                    "02 / INVESTIGATE",
                    "Observation or hypothesis?",
                    "Reproduce; keep unknowns",
                ],
                [
                    "03 / RESPONDER DECIDES",
                    "Choose known mitigation",
                    "Check scope + preconditions",
                ],
                [
                    "04 / OBSERVE",
                    "Queue age + delivery time",
                    "Recovered or still pending?",
                ],
            ];
            steps.forEach(([t, a, b], i) => {
                box(1, i * 10, 32, t, a, b);
                if (i < 3) down(17, i * 10 + 7, 3);
            });
            put(2, 39, "Repair proceeds separately:");
            put(2, 41, "test -> patch -> review");
        } else {
            box(
                0,
                0,
                25,
                "COLLECT",
                "Alerts, support, logs",
                "Bound the queries"
            );
            box(
                30,
                0,
                25,
                "INCIDENT RECORD",
                "Group related signals",
                "Date the observations"
            );
            box(
                60,
                0,
                25,
                "INVESTIGATE",
                "Test a hypothesis",
                "Keep unknowns visible"
            );
            put(26, 4, "-->");
            put(56, 4, "-->");
            put(72, 7, "|");
            put(12, 8, "+" + "-".repeat(59) + "+");
            down(12, 9, 2);
            box(
                0,
                11,
                25,
                "RESPONDER",
                "Own the decision",
                "Confirm the scope"
            );
            box(
                30,
                11,
                25,
                "MITIGATE",
                "Established action",
                "Check preconditions"
            );
            box(
                60,
                11,
                25,
                "OBSERVE",
                "Queue age, latency",
                "Recovered or pending?"
            );
            put(26, 15, "-->");
            put(56, 15, "-->");
            put(
                1,
                21,
                "Separate repair:  reproduce -> patch -> review -> release"
            );
        }
    } else if (kind === "review") {
        title = "Review capacity limits throughput";
        description =
            "Illustrative daily rates: twelve proposals arrive and four are reviewed, leaving eight more waiting each day, before closures or rework. Pause new maintenance investigations when review capacity is full.";
        footer = "Illustrative rates; not production measurements.";
        if (narrow) {
            put(1, 0, "PER WORKING DAY");
            put(1, 2, "arrive    [############] 12");
            put(1, 4, "review    [####........]  4");
            put(1, 6, "remaining [########....]  8");
            box(
                1,
                10,
                32,
                "REVIEW QUEUE",
                "8 more waiting each day",
                "Before closures or rework"
            );
            down(17, 17, 3);
            box(
                1,
                20,
                32,
                "LIMIT NEW WORK",
                "Pause maintenance intake",
                "Keep incident capacity"
            );
        } else {
            put(
                1,
                0,
                "PER WORKING DAY                    OUTSTANDING PROPOSALS"
            );
            put(
                1,
                3,
                "arrive    [############] 12         +----+ +----+ +----+ +----+"
            );
            put(
                1,
                4,
                "                                   | 01 | | 02 | | 03 | | 04 |"
            );
            put(
                1,
                5,
                "review    [####........]  4         +----+ +----+ +----+ +----+"
            );
            put(
                1,
                7,
                "remaining [########....]  8         +----+ +----+ +----+ +----+"
            );
            put(
                1,
                8,
                "                                   | 05 | | 06 | | 07 | | 08 |"
            );
            put(
                1,
                9,
                "                                   +----+ +----+ +----+ +----+"
            );
            put(
                1,
                12,
                "+-- intake control --------------------------------------------------------+"
            );
            put(
                1,
                13,
                "| Pause new maintenance jobs when review is full. Keep incident capacity.  |"
            );
            put(
                1,
                14,
                "+-------------------------------------------------------------------------+"
            );
            put(
                1,
                17,
                "Eight more waiting per day, before closures or rework."
            );
        }
    } else throw new Error(`Unknown scene ${kind}`);
    return {
        title,
        description,
        footer,
        lines: c.lines(),
        columns: narrow ? 36 : 88,
    };
}
