import fs from 'node:fs';
// Use the publishing account configured in the primary checkout.
import { amend } from '/Users/naib/Documents/code/nbaghiro/scripts/ads-publish.mjs';
const items=JSON.parse(fs.readFileSync(new URL('./clientbridge-2026-11-11.json',import.meta.url)));
await amend({id:'clientbridge-profile',patch:{campaigns:{items:items.map(({screens,subtitle,...item})=>item)}},syncs:[{from:'/Users/naib/Documents/code/.scratchpad/clientbridge-campaigns-2026-11-11',to:'campaigns/2026-11-11',include:['*.png']}]});
