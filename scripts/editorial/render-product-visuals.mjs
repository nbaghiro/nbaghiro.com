import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from '/Users/naib/Documents/code/galleo/node_modules/playwright/index.mjs';
import {visuals} from './product-visuals.mjs';
const base='/Users/naib/Documents/code';
const out=base+'/.scratchpad/technical-product-media/frames';fs.mkdirSync(out,{recursive:true});
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const url=s=>'/'+s.split('/').map(encodeURIComponent).join('/');
const server=http.createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html>');}const file=path.resolve(base,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(base+'/'))return res.writeHead(403).end();if(!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();res.setHeader('Content-Type',({'.png':'image/png','.css':'text/css','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
await new Promise(r=>server.listen(8694,'127.0.0.1',r));
const browser=await chromium.launch({channel:'chrome'});
try{
const page=await browser.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:2});
await page.goto('http://127.0.0.1:8694/');
for(const v of visuals){
 if(process.argv.length>2&&!process.argv.slice(2).includes(v.id))continue;
 const screens=v.screens.map(([src,label])=>{const b=fs.readFileSync(path.join(base,src));return {src,label,w:b.readUInt32BE(16),h:b.readUInt32BE(20)};});
 const portrait=screens.every(s=>s.h/s.w>1.3);
 const mixed=!portrait&&screens.some(s=>s.h/s.w>1.3);
 const layout=v.id==='one-layout-engine'?'formats':v.id==='terraform-and-pulumi'?'mosaic':portrait?'phones':mixed?'mixed':screens.length>1?'stack':'single';
 const fontroot='/galleo/.local/founder/galleo-engine/';
 const html=`<!doctype html><html><head><link rel="stylesheet" href="${fontroot}fonts.css"><style>
 @font-face{font-family:Andika;src:url('/lumischool/node_modules/@fontsource/andika/files/andika-latin-400-normal.woff2')}
 @font-face{font-family:Shantell;src:url('/lumischool/node_modules/@fontsource-variable/shantell-sans/files/shantell-sans-latin-full-normal.woff2')}
 *{box-sizing:border-box}body{margin:0}#post{position:relative;width:1200px;height:1200px;padding:72px 76px 48px;overflow:hidden;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font-family:Jost,sans-serif;--bg:#0c0c0c;--ink:#f2efea;--muted:#b5b0a6;--accent:#c0a875}
 #post>*{z-index:1}header{flex:none}.brand{font:18px 'Geist Mono',monospace;letter-spacing:3px;text-transform:uppercase;color:var(--accent)}h1{font:600 74px/1.04 'Cormorant Garamond',serif;letter-spacing:-1px;margin:28px 0 18px;max-width:1000px}.sub{font-size:27px;line-height:1.45;margin:0;max-width:980px;color:var(--muted)}
 .screens{display:flex;gap:28px;flex:1;min-height:0;margin-top:40px;align-items:center;justify-content:center}.item{margin:0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:14px}.plate{overflow:hidden;border:1px solid color-mix(in srgb,var(--accent) 25%,transparent);border-radius:9px;box-shadow:0 20px 45px #0003;background:var(--bg)}img{display:block;width:100%}figcaption{font:15px 'Geist Mono',monospace;color:var(--muted);letter-spacing:1px;text-transform:uppercase}
 .formats,.mosaic{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:24px}.formats .item:first-child,.mosaic .item:last-child{grid-column:1 / -1}.formats .item,.mosaic .item{width:100%;height:100%;min-height:0}.formats .plate,.mosaic .plate{width:100%;height:calc(100% - 32px)}.formats .plate img,.mosaic .plate img{width:100%;height:100%;object-fit:cover;object-position:top}.stack{flex-direction:column;gap:22px}.stack .item{width:100%}.stack .plate{width:100%}.phones .plate{border-radius:23px;border:2px solid #ffffff88}.foot{display:flex;justify-content:space-between;gap:25px;margin-top:28px;font:14px 'Geist Mono',monospace;color:var(--muted)}
 .clientbridge{--bg:#2f4259!important;--ink:white!important;--accent:#a9bed2!important;--muted:#c9d3df!important;background-image:repeating-radial-gradient(ellipse at -20% 30%,transparent 0 62px,#ffffff10 63px 64px)!important}.clientbridge:before{content:'C';position:absolute;font:900 670px/1 sans-serif;right:-80px;top:-100px;color:#ffffff0b}.clientbridge h1{font-family:Jost,sans-serif;font-weight:600;font-size:64px}
 .lumi{--bg:#eff4eb!important;--ink:#25392c!important;--accent:#506b48!important;--muted:#526250!important;font-family:Andika,sans-serif!important;background-image:linear-gradient(#526b4512 1px,transparent 1px),linear-gradient(90deg,#526b4512 1px,transparent 1px)!important;background-size:28px 28px!important}.lumi .map{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.28;z-index:0!important}.lumi header{position:relative;background:#fffffff2;padding:28px 32px;box-shadow:0 6px 24px #344c2418;transform:rotate(-.5deg)}.lumi header:before,.lumi header:after{content:'';position:absolute;width:100px;height:27px;background:#edd886aa;top:-10px;left:-20px;transform:rotate(-7deg)}.lumi header:after{left:auto;right:-20px;transform:rotate(7deg)}.lumi h1{font:650 52px/1.15 Shantell,sans-serif;margin:16px 0}.lumi .sub{font-size:24px}.lumi .plate{border:6px solid white;box-shadow:0 15px 30px #314b3428}.lumi figcaption{color:#25392c;background:#fff9;padding:6px 10px}
 .tondo{--bg:#fffaf8!important;--ink:#3b1726!important;--accent:#ac285b!important;--muted:#765562!important;background:radial-gradient(ellipse at 90% 80%,#efcfda,transparent 55%),radial-gradient(ellipse at 20% 70%,#f5e6d6,transparent 50%),#fffaf8!important}.tondo h1{font-family:Georgia,serif;font-size:65px}.tondo .plate{border:2px solid #e4d7dd;border-radius:22px}
 .flow{--bg:#0b0b0e!important;--ink:#fafafa!important;--accent:#a9a7ff!important;--muted:#c6c6cc!important;background-image:radial-gradient(#ffffff21 1px,transparent 1.4px)!important;background-size:18px 18px!important}.flow h1{font-family:Jost,sans-serif;font-size:65px}.llama{--bg:#fbf8f1!important;--ink:#0d0d0d!important;--muted:#59574f!important;--accent:#ff4d1c!important}.llama h1{font-family:Georgia,serif;font-size:64px}.llama .plate{border:1px solid #d4d0c6}
 </style></head><body><main id="post" class="${v.brand}">${v.background?`<img class="map" src="${url(v.background)}" alt="">`:''}<header><div class="brand">${({galleo:'Galleo',lumi:'LumiSchool',clientbridge:'Clientbridge',flow:'FlowMaestro',llama:'LlamaTrade',tondo:'Tondo'})[v.brand]}</div><h1>${esc(v.head)}</h1><p class="sub">${esc(v.sub)}</p></header><section class="screens ${layout}">${screens.map(s=>`<figure class="item"><div class="plate"><img src="${url(s.src)}"></div><figcaption>${esc(s.label)}</figcaption></figure>`).join('')}</section><footer class="foot"><span>${esc(v.note||'Product views · Engineering notes')}</span><span>${({galleo:'galleo.app',lumi:'lumischool.ai',clientbridge:'clientbridge.ca',flow:'FlowMaestro',llama:'llamatrade.ai',tondo:'tondo.page'})[v.brand]}</span></footer></main></body></html>`;
 await page.setContent(html);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
 await page.evaluate(({screens,layout})=>{const area=document.querySelector('.screens'),r=area.getBoundingClientRect(),items=[...document.querySelectorAll('.item')];
 if(layout==='formats'||layout==='mosaic')return;
 if(layout==='stack'){const h=(r.height-22*(items.length-1))/items.length-36;items.forEach((el,i)=>{const s=screens[i],w=Math.min(r.width,h*s.w/s.h);el.querySelector('.plate').style.width=w+'px';});}
 else {const available=r.width-28*(items.length-1);const h=Math.min(r.height-42,available/screens.reduce((sum,s)=>sum+s.w/s.h,0));items.forEach((el,i)=>{el.querySelector('.plate').style.width=h*screens[i].w/screens[i].h+'px';});}
 },{screens,layout});
 const overflow=await page.evaluate(()=>[...document.querySelectorAll('header,.screens,.foot')].some(e=>e.getBoundingClientRect().bottom>1200));if(overflow)throw Error('Overflow '+v.id);
 await page.locator('#post').screenshot({path:out+'/'+v.id+'.png'});console.log(v.id);
}
}finally{await browser.close();server.close();}
