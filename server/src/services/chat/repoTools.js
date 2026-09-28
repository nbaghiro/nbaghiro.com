/**
 * Repo Tools - the three read-only tools the project chat can call
 * All of them work on the in-memory snapshot; paths are looked up in the
 * snapshot's file map, so nothing on the server's filesystem is reachable.
 */

const MAX_LIST_ENTRIES = 300;
const MAX_READ_LINES = 400;
const MAX_SEARCH_HITS = 40;

export const TOOLS = [
    {
        name: "list_files",
        description:
            "List files and folders in the repository. Pass a folder path to list what is inside it, or an empty string for the repository root. Returns one entry per line; folders end with '/'.",
        eager_input_streaming: true,
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Folder path relative to the repo root, e.g. 'src/engine'. Empty string for the root." },
            },
            required: ["path"],
        },
    },
    {
        name: "read_file",
        description: `Read a text file from the repository with line numbers. Returns at most ${MAX_READ_LINES} lines; pass start_line to read further.`,
        eager_input_streaming: true,
        input_schema: {
            type: "object",
            properties: {
                path: { type: "string", description: "File path relative to the repo root." },
                start_line: { type: "integer", description: "1-based line to start from. Defaults to 1." },
            },
            required: ["path"],
        },
    },
    {
        name: "search_code",
        description: `Case-insensitive plain-text search across the repository. Returns up to ${MAX_SEARCH_HITS} matches as 'path:line: text'. Use a distinctive identifier or phrase.`,
        eager_input_streaming: true,
        input_schema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Text to search for (not a regex)." },
                path: { type: "string", description: "Optional folder to limit the search to." },
            },
            required: ["query"],
        },
    },
];

function normalize(path) {
    return String(path ?? "")
        .trim()
        .replace(/^\.?\/+/, "")
        .replace(/\/+$/, "");
}

function listFiles(snapshot, { path }) {
    const dir = normalize(path);
    const prefix = dir ? dir + "/" : "";
    const entries = new Set();
    for (const p of snapshot.paths) {
        if (!p.startsWith(prefix)) continue;
        const rest = p.slice(prefix.length);
        const slash = rest.indexOf("/");
        entries.add(slash === -1 ? rest : rest.slice(0, slash + 1));
    }
    if (entries.size === 0) return { error: `No folder named '${dir}'.` };
    const list = [...entries].sort();
    const shown = list.slice(0, MAX_LIST_ENTRIES).join("\n");
    return { text: list.length > MAX_LIST_ENTRIES ? `${shown}\n... ${list.length - MAX_LIST_ENTRIES} more` : shown };
}

function readFile(snapshot, { path, start_line }) {
    const file = normalize(path);
    const content = snapshot.files.get(file);
    if (content === undefined) {
        return { error: `No text file at '${file}'. It may not exist, or it may be binary, generated or larger than 200KB.` };
    }
    const lines = content.split("\n");
    const start = Math.max(1, Number.isInteger(start_line) ? start_line : 1);
    const end = Math.min(lines.length, start + MAX_READ_LINES - 1);
    const body = lines
        .slice(start - 1, end)
        .map((line, i) => `${start + i}\t${line}`)
        .join("\n");
    const more = end < lines.length ? `\n... file continues to line ${lines.length}` : "";
    return { text: `${file} (lines ${start}-${end} of ${lines.length})\n${body}${more}`, file };
}

function searchCode(snapshot, { query, path }) {
    const needle = String(query ?? "").toLowerCase();
    if (needle.length < 2) return { error: "Query must be at least 2 characters." };
    const dir = normalize(path);
    const prefix = dir ? dir + "/" : "";
    const hits = [];
    for (const p of snapshot.paths) {
        if (!p.startsWith(prefix)) continue;
        const lines = snapshot.files.get(p).split("\n");
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(needle)) {
                hits.push(`${p}:${i + 1}: ${lines[i].trim().slice(0, 200)}`);
                if (hits.length >= MAX_SEARCH_HITS) {
                    return { text: hits.join("\n") + "\n... more matches not shown; narrow the query or path" };
                }
            }
        }
    }
    return { text: hits.length ? hits.join("\n") : "No matches." };
}

/**
 * Validate a tool input and run the tool
 * Inputs stream eagerly, so they are not validated by the API first.
 * @returns {{text?: string, error?: string, file?: string}}
 */
export function runTool(snapshot, name, input) {
    const isObject = input !== null && typeof input === "object";
    if (name === "list_files" && isObject && typeof input.path === "string") {
        return listFiles(snapshot, input);
    }
    if (
        name === "read_file" &&
        isObject &&
        typeof input.path === "string" &&
        (input.start_line === undefined || Number.isInteger(input.start_line))
    ) {
        return readFile(snapshot, input);
    }
    if (
        name === "search_code" &&
        isObject &&
        typeof input.query === "string" &&
        (input.path === undefined || typeof input.path === "string")
    ) {
        return searchCode(snapshot, input);
    }
    return { error: `INVALID_INPUT for ${name}: ${JSON.stringify(input)}` };
}
