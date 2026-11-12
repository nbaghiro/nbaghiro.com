import fs from 'node:fs';
import { publish } from '/Users/naib/Documents/code/nbaghiro/scripts/ads-publish.mjs';
const technical=JSON.parse(fs.readFileSync(new URL('./technical-library.json',import.meta.url)));
// Do not print the publisher's private bucket access URL.
const log=console.log;
console.log=(...args)=>{if(!args.some(x=>String(x).includes('live:')))log(...args);};
try {await publish({project:{id:'technical-posts',name:'Technical posts',kind:'profile'},manifest:{technical},syncs:[{from:'/Users/naib/Documents/code/.scratchpad/technical-product-media/frames',to:'product-visuals/2026-11-11',include:['*.png']}]});} finally {console.log=log;}
