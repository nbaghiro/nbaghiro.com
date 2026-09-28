/**
 * A mini version of the Art Deco draft in lineart/ (v3-geometric-d), drawn for
 * small sizes: fewer strokes, all held at 1px, with glowing diamond eyes.
 * Used as the agent's face on the "Ask my agent" button.
 */
function AgentBadge() {
    return (
        <svg className="agent-badge" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="95" fill="#141414" />
            <g fill="none" stroke="#EDEAE2" strokeLinejoin="miter" vectorEffect="non-scaling-stroke">
                <polygon points="100,15 50,45 35,100 50,155 100,185 150,155 165,100 150,45" opacity="0.35" vectorEffect="non-scaling-stroke" />
                <path d="M55,80 L100,35 L145,80" vectorEffect="non-scaling-stroke" />
                <path d="M55,80 L52,105 L55,130 L70,150 L100,165 L130,150 L145,130 L148,105 L145,80" vectorEffect="non-scaling-stroke" />
                <polyline points="88,135 100,142 112,135" vectorEffect="non-scaling-stroke" />
            </g>
            <g fill="#FFD64A">
                <polygon points="80,84 91,92 80,101 69,92" />
                <polygon points="120,84 131,92 120,101 109,92" />
            </g>
        </svg>
    );
}

export default AgentBadge;
