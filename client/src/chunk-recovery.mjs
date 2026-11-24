const KEY = "site.chunk-reload-at";
const COOLDOWN = 60_000;

// Vite emits this for failed lazy imports. Reload the current route once to get the new
// entry bundle; a persistent failure falls through to the React error boundary.
export function installChunkRecovery(browser, now = Date.now) {
    const handler = (event) => {
        if (browser.navigator.onLine === false) return;
        try {
            const time = now();
            const previous = Number(browser.sessionStorage.getItem(KEY));
            if (previous && time - previous < COOLDOWN) return;
            browser.sessionStorage.setItem(KEY, String(time));
        } catch {
            // Without persistent storage we cannot safely guard against reload loops.
            return;
        }
        event.preventDefault();
        browser.location.reload();
    };
    browser.addEventListener("vite:preloadError", handler);
    return () => browser.removeEventListener("vite:preloadError", handler);
}
