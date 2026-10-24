import { useEffect, useRef, useState } from "react";
import { saveBlob } from "./actions";

// Records the voice-clone sample in the browser and hands the file straight back. Nothing is
// uploaded and nothing is stored: a take lives in this tab until it is saved or the tab closes.
// That is deliberate. A clean two-minute read is exactly the artifact someone needs to clone
// the voice, so it does not belong on the public bucket the images use.
//
// Safari records audio/mp4 and Chrome audio/webm, so a take carries whichever it got and the
// file name follows it.
const MIMES = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
];
const pickMime = () =>
    (typeof MediaRecorder !== "undefined" &&
        MIMES.find((m) => MediaRecorder.isTypeSupported?.(m))) ||
    "";
const extOf = (m) =>
    m.includes("mp4") ? "m4a" : m.includes("ogg") ? "ogg" : "webm";
const clock = (ms) => {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
// the band the clone wants: under two minutes is thin, past three adds nothing
const LOW = 120_000;
const HIGH = 180_000;

export function Record({ manifest }) {
    const doc = manifest.record;
    const [err, setErr] = useState("");
    const [live, setLive] = useState(false);
    const [ms, setMs] = useState(0);
    const [level, setLevel] = useState(0);
    const [peaked, setPeaked] = useState(false);
    const [takes, setTakes] = useState([]);
    const [size, setSize] = useState(1);
    const gear = useRef({});
    // the browser keeps a blob alive until its object URL is revoked, and the unmount
    // cleanup must not depend on the takes state or it re-runs on every take
    const urls = useRef([]);

    useEffect(
        () => () => {
            stopEverything();
            urls.current.forEach(URL.revokeObjectURL);
        },
        []
    );

    if (!doc) return null;

    function stopEverything() {
        const g = gear.current;
        if (g.raf) cancelAnimationFrame(g.raf);
        if (g.timer) clearInterval(g.timer);
        g.stream?.getTracks().forEach((t) => t.stop());
        g.ctx?.close?.();
        gear.current = {};
    }

    async function start() {
        setErr("");
        const mime = pickMime();
        if (!navigator.mediaDevices?.getUserMedia || !mime) {
            setErr(
                "This browser cannot record audio. Safari and Chrome both can, over https."
            );
            return;
        }
        let stream;
        try {
            // the processing that makes a call sound clean also strips the character the
            // clone is learning, so ask for the raw signal
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                },
            });
        } catch (e) {
            setErr(
                e?.name === "NotAllowedError"
                    ? "Microphone permission was refused. Allow it for this site and try again."
                    : `Could not open the microphone: ${e?.message || e}`
            );
            return;
        }

        const rec = new MediaRecorder(stream, { mimeType: mime });
        const chunks = [];
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        rec.onstop = () => {
            const blob = new Blob(chunks, { type: mime });
            const url = URL.createObjectURL(blob);
            urls.current.push(url);
            setTakes((list) => [
                {
                    id: Date.now(),
                    blob,
                    url,
                    mime,
                    ms: Date.now() - gear.current.began,
                },
                ...list,
            ]);
            stopEverything();
            setLive(false);
            setLevel(0);
        };

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        const tick = () => {
            analyser.getByteTimeDomainData(buf);
            let sum = 0;
            let top = 0;
            for (const v of buf) {
                const d = (v - 128) / 128;
                sum += d * d;
                top = Math.max(top, Math.abs(d));
            }
            setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
            if (top > 0.98) setPeaked(true);
            gear.current.raf = requestAnimationFrame(tick);
        };

        const began = Date.now();
        gear.current = {
            stream,
            ctx,
            began,
            rec,
            timer: setInterval(() => setMs(Date.now() - began), 200),
        };
        setMs(0);
        setPeaked(false);
        setLive(true);
        tick();
        rec.start();
    }

    const stop = () => gear.current.rec?.stop();
    const inBand = ms >= LOW && ms <= HIGH;

    return (
        <>
            <p className="lede">{doc.lede}</p>

            <div className="rec-bar">
                <button
                    type="button"
                    className={`btn primary rec-go${live ? " on" : ""}`}
                    onClick={live ? stop : start}
                >
                    {live ? "Stop" : "Record"}
                </button>
                <span className={`rec-clock${inBand ? " good" : ""}`}>
                    {clock(ms)}
                </span>
                <span className="rec-target">target 2:00 to 3:00</span>
                <span className="rec-meter" aria-hidden="true">
                    <i style={{ transform: `scaleX(${level})` }} />
                </span>
                <span className="rec-size">
                    <button
                        type="button"
                        className="btn"
                        onClick={() => setSize((s) => Math.max(0.8, s - 0.15))}
                    >
                        A-
                    </button>
                    <button
                        type="button"
                        className="btn"
                        onClick={() => setSize((s) => Math.min(2, s + 0.15))}
                    >
                        A+
                    </button>
                </span>
            </div>
            {err && <p className="rec-err">{err}</p>}
            {peaked && (
                <p className="rec-warn">
                    That peaked. Move back a little, or the clone learns the
                    clipping.
                </p>
            )}

            {takes.length > 0 && (
                <div className="rec-takes">
                    {takes.map((t, i) => (
                        <div className="rec-take" key={t.id}>
                            <span className="rec-take-name">
                                Take {takes.length - i} · {clock(t.ms)}
                            </span>
                            <audio controls src={t.url} preload="none" />
                            <button
                                type="button"
                                className="btn primary"
                                onClick={() =>
                                    saveBlob(
                                        t.blob,
                                        `naib-voice-${takes.length - i}.${extOf(t.mime)}`
                                    )
                                }
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => {
                                    URL.revokeObjectURL(t.url);
                                    urls.current = urls.current.filter(
                                        (u) => u !== t.url
                                    );
                                    setTakes((l) =>
                                        l.filter((x) => x.id !== t.id)
                                    );
                                }}
                            >
                                Discard
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="rec-setup">
                {doc.setup.map((s) => (
                    <div key={s.label}>
                        <span className="lib-label">{s.label}</span>
                        <p>{s.text}</p>
                    </div>
                ))}
            </div>

            <div className="rec-script" style={{ fontSize: `${size}rem` }}>
                {doc.parts.map((p) => (
                    <section key={p.id}>
                        <h2>
                            Part {p.label.toLowerCase()}
                            <small>{p.note}</small>
                        </h2>
                        {p.lines.map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </section>
                ))}
            </div>
        </>
    );
}
