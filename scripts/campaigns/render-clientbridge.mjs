import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from '/Users/naib/Documents/code/galleo/node_modules/playwright/index.mjs';
const base='/Users/naib/Documents/code';
const social=base+'/clientbridge/.scratchpad/social';
const kit=base+'/galleo/.local/founder/cb-shots';
const tablet=base+'/galleo/.local/founder/cb-tablet/m';
const out=base+'/.scratchpad/clientbridge-campaigns-2026-11-11';
fs.mkdirSync(out,{recursive:true});
const items=JSON.parse(fs.readFileSync(new URL('./clientbridge-2026-11-11.json',import.meta.url)));
const server=http.createServer((req,res)=>{
 const rel=decodeURIComponent(req.url.split('?')[0]);
 const roots=rel.startsWith('/tablet/')?[tablet]:[kit,social];
 for(const root of roots){const f=path.join(root,rel.replace(/^\/tablet\//,''));if(fs.existsSync(f)&&fs.statSync(f).isFile()){res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.png':'image/png','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream');return fs.createReadStream(f).pipe(res);}}
 res.writeHead(404).end();
});
await new Promise(r=>server.listen(8693,'127.0.0.1',r));
const b=await chromium.launch({channel:'chrome'});
try {
 const p=await b.newPage({viewport:{width:1200,height:1200},deviceScaleFactor:2});
 for(const item of items){
  if(process.argv.length > 2 && !process.argv.slice(2).includes(item.id)) continue;
  const plates=item.screens.map(([name,cap])=>{const tab=name.startsWith('tablet:');const src=tab?tablet+'/'+name.slice(7)+'.png':social+'/m/'+name+'.png';const buf=fs.readFileSync(src);const w=buf.readUInt32BE(16),h=buf.readUInt32BE(20);return {src:tab?'/tablet/'+name.slice(7)+'.png':'/m/'+name+'.png',base:w,w,h,x:0,y:0,phone:!tab&&/phone|ios\//.test(name),cap};});
  const plan={kind:'doc',shape:'row',eyebrow:'Clientbridge',head:item.title,sub:item.subtitle,plates};
  await p.goto('http://127.0.0.1:8693/shot.html?plan='+encodeURIComponent(JSON.stringify(plan)));
  await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  if(plates.some(c=>!c.phone)) await p.evaluate(plates=>{
   const area=document.querySelector('.area'); const rect=area.getBoundingClientRect();
   const h=Math.min(rect.height-40,(rect.width-40)/plates.reduce((sum,c)=>sum+c.w/c.h,0));area.style.gap='20px';
   document.querySelectorAll('.cell').forEach((el,i)=>{const c=plates[i],k=h/c.h,pl=el.querySelector('.plate'),im=el.querySelector('img');pl.style.width=c.w*k+'px';pl.style.height=h+'px';pl.style.borderRadius=c.phone?'20px':'7px';im.style.width=c.w*k+'px';});
  },plates);
  await p.locator('#post').screenshot({path:out+'/'+item.id+'.png'});
  console.log(item.id);
 }
} finally {await b.close();server.close();}
