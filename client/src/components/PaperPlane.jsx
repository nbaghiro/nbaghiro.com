import { useEffect, useRef } from "react";
import { STAGE } from "../data/projects";

/**
 * A few paper planes drifting through the background at different depths.
 * Each follows one continuous Catmull-Rom spline through waypoints it picks ahead
 * of itself, always within a gentle cone of its heading, so the path never kinks
 * or stops. Nearer planes are larger, brighter and faster; farther ones are
 * smaller, fainter and slower, which gives the scene some depth. Everything is
 * in stage coordinates and kept inside the stage, clear of the top bar.
 */

const MARGIN = 70;
const TRAIL = 42;
const TURN_CONE = (60 * Math.PI) / 180; // widest bend between successive waypoints

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const inStage = (p) => ({ x: clamp(p.x, MARGIN, STAGE.width - MARGIN), y: clamp(p.y, MARGIN, STAGE.height - MARGIN) });
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Uniform Catmull-Rom through p1..p2, with p0 and p3 as neighbours
function spline(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
    return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}

function splineVelocity(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const f = (a, b, c, d) => 0.5 * (-a + c + 2 * (2 * a - 5 * b + 4 * c - d) * t + 3 * (-a + 3 * b - 3 * c + d) * t2);
    return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
}

// The next waypoint: ahead of the last leg, within the cone, sometimes drawn toward an island
function nextWaypoint(prev, last, islands) {
    const heading = Math.atan2(last.y - prev.y, last.x - prev.x);
    for (let attempt = 0; attempt < 12; attempt++) {
        let angle = heading + (Math.random() * 2 - 1) * TURN_CONE;
        const dist = 220 + Math.random() * 260;
        if (Math.random() < 0.3 && islands.length) {
            // Fly past an island that is roughly ahead: aim beside it, not at the avatar
            const island = islands[Math.floor(Math.random() * islands.length)];
            const side = Math.random() < 0.5 ? -1 : 1;
            const toIsland = Math.atan2(island.y - last.y, island.x - last.x);
            const beside = { x: island.x + Math.cos(toIsland + (side * Math.PI) / 2) * 130, y: island.y + Math.sin(toIsland + (side * Math.PI) / 2) * 130 };
            const toBeside = Math.atan2(beside.y - last.y, beside.x - last.x);
            if (Math.abs(wrap(toBeside - heading)) < TURN_CONE) angle = toBeside;
        }
        const p = { x: last.x + Math.cos(angle) * dist, y: last.y + Math.sin(angle) * dist };
        if (p.x > MARGIN && p.x < STAGE.width - MARGIN && p.y > MARGIN && p.y < STAGE.height - MARGIN) return p;
    }
    // Near an edge: turn gently back toward the middle
    const toCenter = Math.atan2(STAGE.height / 2 - last.y, STAGE.width / 2 - last.x);
    const angle = heading + clamp(wrap(toCenter - heading), -TURN_CONE, TURN_CONE);
    return inStage({ x: last.x + Math.cos(angle) * 240, y: last.y + Math.sin(angle) * 240 });
}

function makePlane(depth, islands) {
    const start = { x: MARGIN + Math.random() * (STAGE.width - 2 * MARGIN), y: MARGIN + Math.random() * (STAGE.height - 2 * MARGIN) };
    const angle = Math.random() * Math.PI * 2;
    const back = inStage({ x: start.x - Math.cos(angle) * 240, y: start.y - Math.sin(angle) * 240 });
    const points = [back, start];
    while (points.length < 4) points.push(nextWaypoint(points[points.length - 2], points[points.length - 1], islands));
    return {
        depth,
        points,
        t: Math.random(),
        speed: 16 + depth * 26, // stage units per second
        scale: 0.55 + depth * 0.45,
        opacity: 0.16 + depth * 0.24,
        heading: angle,
        bank: 0,
        trail: [],
    };
}

function PaperPlanes({ places, count = 4 }) {
    const planeRefs = useRef([]);
    const trailRefs = useRef([]);

    useEffect(() => {
        const islands = places.map((p) => inStage({ x: p.x, y: p.y + 20 }));
        // Spread depths so there is always a near, a middle and a far plane
        const planes = Array.from({ length: count }, (_, i) => makePlane(0.25 + (0.75 * i) / Math.max(1, count - 1), islands));
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const draw = (plane, i, p) => {
            const el = planeRefs.current[i];
            if (!el) return;
            el.style.left = `${(p.x / STAGE.width) * 100}%`;
            el.style.top = `${(p.y / STAGE.height) * 100}%`;
            el.style.opacity = plane.opacity;
            el.style.transform = `translate(-50%, -50%) rotate(${plane.heading}rad) scale(${plane.scale}, ${plane.scale * (1 - Math.abs(plane.bank) * 0.2)})`;
        };

        if (reduced) {
            planes.forEach((plane, i) => draw(plane, i, spline(...plane.points, plane.t)));
            return undefined;
        }

        let prevTime = 0;
        let raf = 0;
        const frame = (now) => {
            const dt = prevTime ? Math.min(0.05, (now - prevTime) / 1000) : 0;
            prevTime = now;

            planes.forEach((plane, i) => {
                // Advance a fixed distance along the curve, so the pace is even
                const v = splineVelocity(...plane.points, plane.t);
                plane.t += (plane.speed * dt) / (Math.hypot(v.x, v.y) || 1);
                while (plane.t >= 1) {
                    plane.t -= 1;
                    plane.points.shift();
                    plane.points.push(nextWaypoint(plane.points[1], plane.points[2], islands));
                }
                const p = spline(...plane.points, plane.t);
                const vel = splineVelocity(...plane.points, plane.t);

                // The spline's tangent is already smooth; ease toward it anyway and bank on the turn rate
                const target = Math.atan2(vel.y, vel.x);
                const turn = wrap(target - plane.heading) * Math.min(1, dt * 3);
                plane.heading = wrap(plane.heading + turn);
                plane.bank += (clamp(turn / Math.max(dt, 0.001), -1, 1) - plane.bank) * Math.min(1, dt * 1.5);

                draw(plane, i, p);

                plane.trail.push(p);
                if (plane.trail.length > TRAIL) plane.trail.shift();
                trailRefs.current[i]?.setAttribute("points", plane.trail.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" "));
            });

            raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, [places, count]);

    return (
        <>
            <svg className="plane-trail" viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} preserveAspectRatio="none" aria-hidden="true">
                {Array.from({ length: count }, (_, i) => (
                    <polyline
                        key={i}
                        ref={(el) => (trailRefs.current[i] = el)}
                        vectorEffect="non-scaling-stroke"
                        opacity={0.35 + (0.65 * i) / Math.max(1, count - 1)}
                    />
                ))}
            </svg>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="plane" ref={(el) => (planeRefs.current[i] = el)} aria-hidden="true">
                    <svg width="34" height="20" viewBox="0 0 34 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
                        <path d="M2 3 L32 10 L2 17 L9 10 Z" />
                        <path d="M9 10 L32 10" />
                    </svg>
                </div>
            ))}
        </>
    );
}

export default PaperPlanes;
