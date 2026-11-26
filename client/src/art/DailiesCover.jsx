export default function DailiesCover({ post, w, h, words }) {
    const id = `dailies-${w}-${h}`;
    return (
        <svg
            className="ph-cover"
            data-cover-kind="vector"
            viewBox={`0 0 ${w} ${h}`}
            role="img"
            aria-label={post.title}
        >
            <defs>
                <radialGradient id={`${id}-bg`}>
                    <stop stopColor="#365952" />
                    <stop offset="1" stopColor="#122e2c" />
                </radialGradient>
                <pattern
                    id={`${id}-grid`}
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M40 0H0V40"
                        fill="none"
                        stroke="#b8ccc0"
                        strokeOpacity=".08"
                    />
                </pattern>
                <filter
                    id={`${id}-shadow`}
                    x="-30%"
                    y="-40%"
                    width="170%"
                    height="200%"
                >
                    <feDropShadow
                        dx="0"
                        dy="13"
                        stdDeviation="16"
                        floodColor="#071a18"
                        floodOpacity=".45"
                    />
                </filter>
            </defs>
            <rect width={w} height={h} fill={`url(#${id}-bg)`} />
            <svg
                width={w}
                height={h}
                viewBox="0 0 1200 800"
                preserveAspectRatio="xMidYMid slice"
            >
                <rect width="1200" height="800" fill={`url(#${id}-grid)`} />
                <g fill="none" stroke="#93b4a7" opacity=".24">
                    {[0, 1, 2, 3].map((i) => (
                        <path
                            key={i}
                            d={`M-80 ${640 + i * 34}C210 ${390 + i * 34} 730 ${830 + i * 34} 1300 ${400 + i * 34}`}
                        />
                    ))}
                </g>
                <g
                    transform="translate(125 267) rotate(-8 95 135)"
                    filter={`url(#${id}-shadow)`}
                >
                    <rect width="178" height="270" rx="25" fill="#e3e9dc" />
                    <rect
                        x="9"
                        y="10"
                        width="160"
                        height="250"
                        rx="19"
                        fill="#aec7bb"
                    />
                    <rect
                        x="65"
                        y="18"
                        width="50"
                        height="8"
                        rx="4"
                        fill="#324e47"
                    />
                    <rect
                        x="22"
                        y="51"
                        width="134"
                        height="70"
                        rx="5"
                        fill="#365e52"
                    />
                    <circle cx="89" cy="87" r="18" fill="#e3e9dc" />
                    <path d="m84 78 14 9-14 9z" fill="#365e52" />
                    {[140, 177, 214].map((y, i) => (
                        <g key={y}>
                            <rect
                                x="23"
                                y={y}
                                width="25"
                                height="25"
                                rx="4"
                                fill={["#cf946e", "#e1cf9a", "#8ca9bb"][i]}
                            />
                            <path
                                d={`M60 ${y + 7}h77m-77 10h52`}
                                stroke="#446259"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </g>
                    ))}
                </g>
                <g
                    transform="translate(335 290) rotate(5 330 105)"
                    filter={`url(#${id}-shadow)`}
                >
                    <rect width="700" height="222" rx="5" fill="#e9e4d5" />
                    {Array.from({ length: 24 }, (_, i) => (
                        <g key={i}>
                            <rect
                                x={12 + i * 29}
                                y="8"
                                width="15"
                                height="8"
                                rx="2"
                                fill="#51685e"
                            />
                            <rect
                                x={12 + i * 29}
                                y="205"
                                width="15"
                                height="8"
                                rx="2"
                                fill="#51685e"
                            />
                        </g>
                    ))}
                    {["#829eab", "#c09376", "#91ad9c"].map((c, i) => (
                        <g key={c} transform={`translate(${19 + i * 227} 27)`}>
                            <rect width="211" height="164" rx="2" fill={c} />
                            <text
                                x="12"
                                y="22"
                                fill="#203a35"
                                style={{
                                    fontFamily: "monospace",
                                    fontSize: 12,
                                }}
                            >
                                0{i + 1}
                            </text>
                            {i === 0 ? (
                                <g fill="#e4e8df">
                                    <rect
                                        x="68"
                                        y="31"
                                        width="78"
                                        height="104"
                                        rx="8"
                                    />
                                    <rect
                                        x="78"
                                        y="46"
                                        width="58"
                                        height="32"
                                        rx="3"
                                        fill="#31544a"
                                    />
                                    <path
                                        d="M79 94h55m-55 13h42m-42 13h47"
                                        stroke="#829eab"
                                        strokeWidth="4"
                                    />
                                </g>
                            ) : i === 1 ? (
                                <g fill="none" stroke="#f3ead9" strokeWidth="2">
                                    <circle cx="107" cy="84" r="47" />
                                    <circle cx="107" cy="84" r="30" />
                                    <path
                                        d="m97 64 28 20-28 20z"
                                        fill="#f3ead9"
                                    />
                                    {[0, 1, 2, 3].map((n) => (
                                        <path
                                            key={n}
                                            d={`M${27 + n * 48} 145v${-10 - (n % 2) * 10}`}
                                        />
                                    ))}
                                </g>
                            ) : (
                                <g>
                                    <path
                                        d="M39 127V48h134"
                                        fill="none"
                                        stroke="#355b50"
                                    />
                                    <path
                                        d="m51 110 29-20 30 7 27-38 30 10"
                                        fill="none"
                                        stroke="#f2edda"
                                        strokeWidth="4"
                                    />
                                    <circle
                                        cx="167"
                                        cy="69"
                                        r="5"
                                        fill="#f2edda"
                                    />
                                </g>
                            )}
                        </g>
                    ))}
                </g>
                <g fill="none" stroke="#c1d1bd" strokeWidth="1.5" opacity=".8">
                    <path d="M302 375h20m-6-5 6 5-6 5M1063 406c60 0 60 155-40 155H440m7-5-7 5 7 5" />
                    <circle cx="1055" cy="405" r="5" />
                </g>
                <text
                    x="335"
                    y="251"
                    fill="#d4dfd3"
                    style={{
                        fontFamily: "monospace",
                        fontSize: 16,
                        letterSpacing: 7,
                    }}
                >
                    DAILIES / A PRODUCT PLAN
                </text>
                <text
                    x="573"
                    y="591"
                    fill="#b4ccbc"
                    style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        letterSpacing: 3,
                    }}
                >
                    MAKE · REVIEW · LEARN
                </text>
            </svg>
            {words && (
                <text
                    x={w * 0.065}
                    y={h * 0.91}
                    fill="#f1eee3"
                    style={{
                        fontFamily: "ui-monospace,monospace",
                        fontSize: w * 0.028,
                    }}
                >
                    from the product to the next brief
                </text>
            )}
        </svg>
    );
}
