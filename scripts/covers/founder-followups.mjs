import fs from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { chromium } from "/Users/naib/Documents/code/galleo/node_modules/playwright/index.mjs";
const entries = JSON.parse(
    fs.readFileSync("scripts/editorial/founder-followups.json", "utf8")
);
function html(d) {
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${d.title}</title><link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400&family=Instrument+Sans:wght@400;500&family=JetBrains+Mono&display=swap" rel="stylesheet"><style>*{margin:0;box-sizing:border-box}body{background:#e9ecea}.sheet{position:relative;width:100vw;height:100vh;overflow:hidden}.sheet img{position:absolute;width:100%;height:100%;object-fit:cover;opacity:.21;filter:grayscale(1)}.wash{position:absolute;inset:0;background:linear-gradient(115deg,#e9eceaf0,#e9ecea55)}svg{position:absolute;inset:0;width:100%;height:100%}text{font-family:'Instrument Sans',sans-serif;fill:#283e37;font-size:18px}.serif{font-family:Newsreader,Georgia,serif}.mono{font-family:'JetBrains Mono',monospace;letter-spacing:1px;font-size:13px}.quiet{fill:#687d75}.line{stroke:#718a80;fill:none;stroke-width:1}.accent{stroke:#4e7872;fill:none;stroke-width:2}.box{fill:#f5f7f2a0;stroke:#82968c;stroke-width:1}</style></head><body><div class="sheet"><img src="ph-callers.jpg" alt=""><div class="wash"></div><svg id="plate"></svg></div><script>
const data=${JSON.stringify(d)};
const square=innerHeight>innerWidth*.7,svg=document.querySelector('svg');svg.setAttribute('viewBox',square?'0 0 1000 1000':'0 0 1600 615');
const left=square?80:100,rowY=square?350:255,cw=square?256:400,gap=square?36:70;
let out='<text class="mono quiet" x="'+left+'" y="85">'+data.product.toUpperCase()+' / ENGINEERING NOTES</text>';
data.coverTitle.forEach((line,i)=>{out+='<text class="serif" style="font-size:'+(square?58:54)+'px" x="'+left+'" y="'+(square?160+i*62:145+i*57)+'">'+line+'</text>'});
data.figures[0].cards.forEach((card,i)=>{const x=left+i*(cw+gap);out+='<rect class="box" x="'+x+'" y="'+rowY+'" width="'+cw+'" height="'+(square?260:155)+'" rx="4"/><text class="mono quiet" x="'+(x+22)+'" y="'+(rowY+31)+'">0'+(i+1)+'</text><text class="serif" style="font-size:'+(square?25:29)+'px" x="'+(x+22)+'" y="'+(rowY+76)+'">'+card[0]+'</text>';card.slice(1).forEach((t,j)=>{out+='<text class="quiet" style="font-size:'+(square?15:18)+'px" x="'+(x+22)+'" y="'+(rowY+(square?170:108)+j*25)+'">'+t+'</text>'})});
const y=square?695:465;out+='<path class="accent" d="M'+left+' '+(y-25)+'H'+(square?920:1500)+'"/>';
let lines=[''];for(const word of data.figures[0].note.split(' ')){let i=lines.length-1;if(lines[i].length+word.length>(square?65:120))lines.push(word);else lines[i]+=(lines[i]?' ':'')+word}lines.forEach((line,i)=>{out+='<text class="quiet" x="'+left+'" y="'+(y+10+i*29)+'">'+line+'</text>'});
out+='<text class="mono quiet" x="'+left+'" y="'+(square?905:555)+'">NBAGHIRO.COM</text><path class="line" d="M'+left+' 38h-20v20M'+(square?920:1500)+' 38h20v20M'+left+' '+(square?950:580)+'h-20v-20M'+(square?920:1500)+' '+(square?950:580)+'h20v-20"/>';svg.innerHTML=out;
</script></body></html>`;
}
const browser = await chromium.launch({ channel: "chrome" });
try {
    for (const d of entries) {
        const filename = "scripts/covers/" + d.slug + ".html";
        fs.writeFileSync(filename, html(d));
        const out = "client/public/img/posts/" + d.slug;
        for (const [width, height, kind] of [
            [2000, 769, "wide"],
            [1000, 1000, "card"],
        ]) {
            const page = await browser.newPage({
                viewport: { width, height },
                deviceScaleFactor: 1,
            });
            const errors = [];
            page.on("pageerror", (e) => errors.push(e.message));
            await page.goto(pathToFileURL(resolve(filename)).href);
            await page.evaluate(() => document.fonts.ready);
            if (errors.length) throw Error(errors.join(";"));
            await sharp(await page.screenshot())
                .webp({ quality: 94 })
                .toFile(out + "-" + kind + ".webp");
            if (kind === "wide") {
                await page.addStyleTag({ content: "svg{visibility:hidden}" });
                await sharp(await page.screenshot())
                    .webp({ quality: 92 })
                    .toFile(out + "-bg.webp");
                await page.addStyleTag({
                    content:
                        "svg{visibility:visible}html,body,.sheet{background:transparent}.sheet img,.wash{visibility:hidden}",
                });
                await sharp(await page.screenshot({ omitBackground: true }))
                    .webp({ quality: 95 })
                    .toFile(out + "-art.webp");
            }
            await page.close();
        }
        console.log(d.slug + " covers rendered");
    }
} finally {
    await browser.close();
}
