// Bring the photographs into the site's palette.
//
// The grounds are searched in the right register but arrive in their own colour, and a run of
// fifty-five covers in fifty-five different hues does not read as one site. This pulls most of
// the saturation out and tints what is left toward --water, the green the interface already
// uses, so a photograph sits beside a botanical plate without either looking borrowed.
//
// The originals are kept: this writes beside them, so a different treatment is one re-run away.
//
//   node scripts/photos/tone.mjs
import { readdirSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const SRC = "client/public/img/photo";
const OUT = `${SRC}/toned`;
mkdirSync(OUT, { recursive: true });

// desaturate hard, tint toward --water (#4e7872), then take the last of the haze off the ends
const TREATMENT = ["-modulate", "102,18", "-fill", "#4e7872", "-colorize", "28%", "-level", "3%,97%"];

const files = readdirSync(SRC).filter((f) => f.endsWith(".webp"));
for (const f of files) {
    execFileSync("magick", [`${SRC}/${f}`, ...TREATMENT, "-quality", "82", `${OUT}/${f}`]);
}
console.log(`${files.length} toned`);
