/**
 * Line-art portrait mark: the site logo, the home avatar and, in variants,
 * the character for each project. Layers of thin strokes fade outward.
 */

function Mark({ size = 200, ink = "#EDEAE2", disc = "#141414", variant = "base", talking = false, label }) {
    const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
    return (
        <svg
            width={size}
            height={typeof size === "number" ? size : undefined}
            viewBox="0 0 200 200"
            {...a11y}
            style={{ display: "block", aspectRatio: "1" }}
        >
            <circle cx="100" cy="100" r="95" fill={disc} />
            <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
                <g strokeWidth="1" opacity="0.2">
                    <ellipse cx="100" cy="105" rx="55" ry="65" />
                    <path d="M45 85 Q45 35 100 30 Q155 35 155 85" />
                </g>
                <g strokeWidth="1.2" opacity="0.35">
                    <ellipse cx="100" cy="102" rx="50" ry="60" />
                    <path d="M50 82 Q50 38 100 33 Q150 38 150 82" />
                    <path d="M65 80 Q80 72 95 80" />
                    <path d="M105 80 Q120 72 135 80" />
                </g>
                <g strokeWidth="1.5" opacity="0.5">
                    <ellipse cx="100" cy="100" rx="45" ry="55" />
                    <path d="M55 80 Q55 42 100 38 Q145 42 145 80" />
                    <ellipse cx="78" cy="92" rx="10" ry="9" />
                    <ellipse cx="122" cy="92" rx="10" ry="9" />
                </g>
                <g strokeWidth="1.8" opacity="0.7">
                    <ellipse cx="100" cy="98" rx="40" ry="50" />
                    <path d="M60 78 Q60 45 100 42 Q140 45 140 78" />
                    <path d="M68 82 Q80 76 92 82" />
                    <path d="M108 82 Q120 76 132 82" />
                    <ellipse cx="80" cy="94" rx="8" ry="7" />
                    <ellipse cx="120" cy="94" rx="8" ry="7" />
                    <path d="M100 88 L97 108 Q100 114 103 108" />
                </g>
                <g strokeWidth="2">
                    <path d="M65 80 Q80 74 95 80" strokeWidth="2.5" />
                    <path d="M105 80 Q120 74 135 80" strokeWidth="2.5" />
                    <circle cx="80" cy="95" r="5" />
                    <circle cx="120" cy="95" r="5" />
                    <circle cx="80" cy="95" r="2" fill={ink} />
                    <circle cx="120" cy="95" r="2" fill={ink} />
                    {talking ? (
                        <ellipse cx="100" cy="126" rx="9" ry="7" />
                    ) : (
                        <>
                            <path d="M82 120 Q100 128 118 120" />
                            <path d="M88 135 Q100 142 112 135" />
                        </>
                    )}
                </g>
                {variant === "lens" && (
                    <g strokeWidth="2">
                        <circle cx="80" cy="95" r="14" />
                        <circle cx="120" cy="95" r="14" />
                        <path d="M94 94 Q100 90 106 94" />
                        <path d="M66 92 L52 86" opacity="0.5" />
                        <path d="M134 92 L148 86" opacity="0.5" />
                    </g>
                )}
                {variant === "sound" && (
                    <g>
                        <path d="M42 104 Q40 26 100 22 Q160 26 158 104" strokeWidth="3" />
                        <path d="M38 104 Q34 20 100 16 Q166 20 162 104" strokeWidth="1" opacity="0.35" />
                        <rect x="30" y="92" width="16" height="32" rx="7" strokeWidth="2.5" />
                        <rect x="154" y="92" width="16" height="32" rx="7" strokeWidth="2.5" />
                    </g>
                )}
                {variant === "cap" && (
                    <g>
                        <path d="M54 70 Q56 22 100 20 Q144 22 146 70" strokeWidth="3" />
                        <path d="M52 72 L148 72" strokeWidth="3" />
                        <path d="M52 64 L148 64" strokeWidth="1.2" opacity="0.4" />
                        <circle cx="100" cy="14" r="7" strokeWidth="2" />
                    </g>
                )}
                {variant === "orbit" && (
                    <g>
                        <ellipse cx="100" cy="100" rx="92" ry="26" transform="rotate(-18 100 100)" strokeWidth="2" />
                        <ellipse cx="100" cy="100" rx="96" ry="30" transform="rotate(-18 100 100)" strokeWidth="1" opacity="0.35" />
                        <circle cx="182" cy="74" r="5" fill={ink} />
                    </g>
                )}
                {variant === "spark" && (
                    <g strokeWidth="2">
                        <path d="M158 38 L158 58 M148 48 L168 48" />
                        <path d="M172 70 L172 80 M167 75 L177 75" opacity="0.6" />
                        <path d="M36 44 L36 52 M32 48 L40 48" opacity="0.35" />
                    </g>
                )}
                <path d="M60 125 Q52 155 80 175 Q100 185 120 175 Q148 155 140 125" strokeWidth="1" opacity="0.2" />
                <path d="M65 122 Q58 150 82 168 Q100 178 118 168 Q142 150 135 122" strokeWidth="1" opacity="0.3" />
                <path d="M70 120 Q65 145 85 162 Q100 170 115 162 Q135 145 130 120" strokeWidth="1" opacity="0.4" />
            </g>
        </svg>
    );
}

export default Mark;
