// Run against a production build served by Express; TEST_ORIGIN overrides localhost:5398.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const b=await chromium.launch({channel:'chrome'});
try {
for(const persistent of [false,true]){
const ctx=await b.newContext(),p=await ctx.newPage();let attempts=0,documents=0;
p.on('request',req=>{if(req.isNavigationRequest()&&req.frame()===p.mainFrame())documents++});
await p.route('**/assets/Projects-*.js',route=>{
 attempts++;
 if(persistent||documents===1)return route.fulfill({status:404,contentType:'text/plain',body:'Asset not found'});
 return route.continue();
});
await p.goto(process.env.TEST_ORIGIN || 'http://127.0.0.1:5398/',{waitUntil:'networkidle'});
await p.getByRole('navigation',{name:'Primary'}).getByRole('link',{name:'Projects',exact:true}).click();
if(persistent){await p.getByRole('heading',{name:'This page couldn’t load'}).waitFor();await p.waitForTimeout(1200);assert.equal(documents,2);assert.ok(await p.getByRole('link',{name:'Reload this page'}).count());}
else {await p.getByRole('heading',{name:'Projects',exact:true,level:1}).waitFor();assert.equal(documents,2);assert.equal(new URL(p.url()).pathname,'/projects');}
console.log(persistent?'Persistent failure: one reload, visible fallback, no loop.':'Missing chunk: reload recovered Projects at the intended URL.');await ctx.close();
}
}finally{await b.close()}
