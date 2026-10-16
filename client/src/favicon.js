import { useEffect } from "react";

/**
 * Two faces. The site wears the photograph; /dark and the ad studios keep the original
 * drawn mark, so a row of pinned tabs says which one you are looking at.
 */
const ICONS = {
    photo: { href: "/favicon-32.png", type: "image/png" },
    mark: { href: "/favicon.svg", type: "image/svg+xml" },
};

export function useFavicon(kind) {
    useEffect(() => {
        const icon = ICONS[kind] ?? ICONS.photo;
        const links = document.head.querySelectorAll('link[rel="icon"]');
        // keep one and point it at this face; the extra sizes only confuse the swap
        links.forEach((link, i) => {
            if (i === 0) {
                link.type = icon.type;
                link.removeAttribute("sizes");
                link.href = icon.href;
            } else {
                link.remove();
            }
        });
    }, [kind]);
}
