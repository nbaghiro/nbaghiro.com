import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";

// Instagram's app picks only from Photos. A `download` link on iOS lands in Files, so the
// share sheet ("Save Image", "Save 5 Images", "Save Video") is the one route in, and Safari
// exposes it on HTTPS alone. Where there is no share API these buttons do not render and the
// download links beside them stand in.
const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({
        files: [new File([""], "a.png", { type: "image/png" })],
    });

const MIME = {
    mp4: "video/mp4",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    pdf: "application/pdf",
    png: "image/png",
};

function mimeOf(name) {
    return (
        MIME[name.split(".").pop().toLowerCase()] ?? "application/octet-stream"
    );
}

export async function fetchFile(url, name) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} fetching ${name}`);
    return new File([await r.blob()], name, { type: mimeOf(name) });
}

export function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// A `download` attribute is ignored on a cross-origin URL: the browser navigates to the file
// and leaves the studio behind, so on a phone what was a button becomes a long press on a bare
// image. Fetching the bytes and saving from a blob the page owns keeps the download and the name.
export function DownloadButton({ url, name, label = "File" }) {
    const [busy, setBusy] = useState(false);
    const go = async () => {
        setBusy(true);
        try {
            saveBlob(await fetchFile(url, name), name);
        } catch (e) {
            console.error(e);
        }
        setBusy(false);
    };
    return (
        <button type="button" className="btn" disabled={busy} onClick={go}>
            {busy ? "Saving…" : label}
        </button>
    );
}

// `items` is called at tap time so it can read the current theme and format.
export function ShareButton({
    items,
    label,
    deskLabel = "Share",
    primary = true,
}) {
    const [state, setState] = useState("idle");
    const held = useRef({ key: "", files: [] });
    if (!canShareFiles) return null;

    const go = async () => {
        const list = items();
        const key = list.map((i) => i.url).join("|");
        if (state !== "ready" || key !== held.current.key) {
            setState("busy");
            try {
                const files = await Promise.all(
                    list.map((i) => fetchFile(i.url, i.name))
                );
                held.current = { key, files };
            } catch (e) {
                console.error(e);
                setState("idle");
                return;
            }
        }
        try {
            await navigator.share({ files: held.current.files });
            setState("idle");
        } catch (e) {
            // Safari lets the tap's activation lapse while a large file downloads and then
            // refuses the sheet; the files are held, so the next tap shares at once.
            setState(e && e.name === "NotAllowedError" ? "ready" : "idle");
        }
    };

    // a desktop browser can share files too (macOS Chrome opens the system sheet), but
    // "to Photos" is a phone's promise, so the label is plain there
    const idle = matchMedia("(pointer: coarse)").matches ? label : deskLabel;
    const text =
        { busy: "Preparing…", ready: "Tap again to save" }[state] ?? idle;
    return (
        <button
            type="button"
            className={primary ? "btn primary" : "btn"}
            disabled={state === "busy"}
            onClick={go}
        >
            {text}
        </button>
    );
}

export function CopyButton({ text, label = "Copy", primary = false }) {
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (!done) return undefined;
        const t = setTimeout(() => setDone(false), 1600);
        return () => clearTimeout(t);
    }, [done]);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setDone(true);
        } catch {
            // the clipboard needs HTTPS; the text is on the page to select instead
            window.prompt("Select and copy:", text);
        }
    };
    return (
        <button
            type="button"
            className={primary ? "btn primary" : "btn"}
            onClick={copy}
            disabled={!text}
        >
            {done ? "Copied" : label}
        </button>
    );
}

// The whole post as one file for a desktop: every slide in the picked theme, the caption
// and the alt text, so what is unzipped is what is uploaded.
export function ZipButton({ name, files, texts = {}, label = "Download zip" }) {
    const [busy, setBusy] = useState(false);
    const go = async () => {
        setBusy(true);
        try {
            const zip = new JSZip();
            for (const f of files())
                zip.file(
                    f.path,
                    await fetchFile(f.url, f.path.split("/").pop())
                );
            for (const [path, text] of Object.entries(texts))
                if (text) zip.file(path, text);
            saveBlob(await zip.generateAsync({ type: "blob" }), `${name}.zip`);
        } catch (e) {
            console.error(e);
        }
        setBusy(false);
    };
    return (
        <button type="button" className="btn" disabled={busy} onClick={go}>
            {busy ? "Zipping…" : label}
        </button>
    );
}

// A piece of text with its own copy button: a document title, a post, a first comment.
export function Field({ label, note, text, count = false }) {
    if (!text) return null;
    return (
        <div className="field">
            <div className="row">
                <h3>{label}</h3>
                {count && (
                    <span className="char-count">
                        {text.length.toLocaleString()} characters
                    </span>
                )}
                <CopyButton text={text} label="Copy" />
            </div>
            {note && <p className="note">{note}</p>}
            <pre className="text">{text}</pre>
        </div>
    );
}

// Profile or page fields with the options written for them, each a tap to copy.
export function Fields({ fields }) {
    if (!fields?.length) return null;
    return fields.map((f) => (
        <div key={f.label} className="field">
            <div className="row">
                <h3>{f.label}</h3>
            </div>
            {f.note && <p className="note">{f.note}</p>}
            <div className="options">
                {(f.options || []).map((o) => (
                    <div key={o}>
                        <span>{o}</span>
                        <CopyButton text={o} label="Copy" />
                    </div>
                ))}
            </div>
        </div>
    ));
}
