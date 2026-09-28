import { PROJECTS } from "../data/projects";

/**
 * Around the home portrait: tiny paper planes, one per project in its color,
 * flying nose-first around a faint orbit, like messengers the agent sends out.
 * The orbit turns clockwise, so each plane points along the clockwise tangent.
 */
function AgentHalo() {
    return (
        <div className="agent-halo" aria-hidden="true">
            <span className="agent-pulse" />
            <span className="agent-pulse agent-pulse-late" />
            <svg className="agent-orbit" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 4" opacity="0.5" />
                {PROJECTS.map((p, i) => {
                    const a = (i / PROJECTS.length) * Math.PI * 2 - Math.PI / 2;
                    const x = 100 + Math.cos(a) * 92;
                    const y = 100 + Math.sin(a) * 92;
                    const heading = (a * 180) / Math.PI + 90;
                    return (
                        <g key={p.id} transform={`translate(${x} ${y}) rotate(${heading}) scale(0.34) translate(-17 -10)`}>
                            <path
                                d="M2 3 L32 10 L2 17 L9 10 Z"
                                fill="#0b0b0b"
                                stroke={p.color}
                                strokeWidth="1.3"
                                strokeLinejoin="round"
                                vectorEffect="non-scaling-stroke"
                            />
                            <path d="M9 10 L32 10" stroke={p.color} strokeWidth="1" opacity="0.7" vectorEffect="non-scaling-stroke" />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default AgentHalo;
