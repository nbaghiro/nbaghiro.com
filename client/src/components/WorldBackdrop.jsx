/**
 * Decoration behind the overworld: topographic contours, orbit rings around
 * home, stars and sparkles. Everything is drawn in the same thin, fading
 * strokes as the mark, and kept faint so the islands stay in front.
 */

import { HOME, STAGE } from "../data/projects";

// Deterministic pseudo-random numbers, so the sky is the same on every visit
function seeded(seed) {
    let s = seed;
    return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
}

// Hills sit in the empty parts of the stage, away from the islands
const HILLS = [
    { x: 40, y: 800, rings: 7, inner: 50, step: 34, seed: 3 },
    { x: 1410, y: 50, rings: 6, inner: 40, step: 32, seed: 11 },
    { x: 440, y: 330, rings: 4, inner: 22, step: 20, seed: 7 },
    { x: 1330, y: 800, rings: 4, inner: 30, step: 24, seed: 19 },
    { x: 60, y: 60, rings: 3, inner: 26, step: 22, seed: 23 },
];

function contour(hill, ring) {
    const rand = seeded(hill.seed);
    const phases = [rand(), rand(), rand()].map((p) => p * Math.PI * 2 + ring * 0.18);
    const radius = hill.inner + ring * hill.step;
    const points = [];
    for (let i = 0; i < 72; i++) {
        const t = (i / 72) * Math.PI * 2;
        const wobble =
            1 + 0.09 * Math.sin(3 * t + phases[0]) + 0.05 * Math.sin(5 * t + phases[1]) + 0.03 * Math.sin(7 * t + phases[2]);
        points.push(`${(hill.x + Math.cos(t) * radius * wobble).toFixed(1)},${(hill.y + Math.sin(t) * radius * wobble * 0.8).toFixed(1)}`);
    }
    return `M${points.join(" L")} Z`;
}

const CONTOURS = HILLS.flatMap((hill) =>
    Array.from({ length: hill.rings }, (_, ring) => ({
        d: contour(hill, ring),
        // Inner rings strongest, fading outward like the mark's layers
        opacity: 0.16 - (ring / hill.rings) * 0.12,
    }))
);

const STARS = (() => {
    const rand = seeded(42);
    return Array.from({ length: 46 }, () => ({
        x: rand() * STAGE.width,
        y: rand() * STAGE.height,
        r: 0.6 + rand() * 1.3,
        delay: -rand() * 6,
        duration: 4 + rand() * 4,
    }));
})();

const SPARKLES = [
    [360, 120, 1],
    [1010, 230, 0.8],
    [150, 360, 0.7],
    [1300, 330, 1],
    [640, 760, 0.8],
    [1080, 720, 0.7],
];

const ORBITS = [180, 250, 330, 420];

function WorldBackdrop() {
    return (
        <div className="backdrop" aria-hidden="true">
            <svg className="backdrop-art" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} preserveAspectRatio="xMidYMid slice">
                <g className="contours">
                    {CONTOURS.map((c, i) => (
                        <path key={i} d={c.d} opacity={c.opacity.toFixed(3)} />
                    ))}
                </g>

                <g className="orbits">
                    {ORBITS.map((r, i) => (
                        <circle
                            key={r}
                            cx={HOME.x}
                            cy={HOME.y}
                            r={r}
                            opacity={0.2 - i * 0.04}
                            className={i % 2 ? "orbit orbit-reverse" : "orbit"}
                            style={{ animationDuration: `${140 + i * 50}s` }}
                        />
                    ))}
                </g>

                <g className="sky">
                    {STARS.map((s, i) => (
                        <circle
                            key={i}
                            cx={s.x}
                            cy={s.y}
                            r={s.r}
                            style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }}
                        />
                    ))}
                </g>

                <g className="sparkles">
                    {SPARKLES.map(([x, y, scale], i) => (
                        <path
                            key={i}
                            d={`M${x} ${y - 7 * scale} L${x} ${y + 7 * scale} M${x - 7 * scale} ${y} L${x + 7 * scale} ${y}`}
                            style={{ animationDelay: `${-i * 1.3}s` }}
                        />
                    ))}
                </g>
            </svg>

            <span className="shooting-star" />
            <span className="shooting-star shooting-star-late" />
        </div>
    );
}

export default WorldBackdrop;
