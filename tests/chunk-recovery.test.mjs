import test from 'node:test';
import assert from 'node:assert/strict';
import {installChunkRecovery} from '../client/src/chunk-recovery.mjs';

test('stale chunks reload once across page loads, then allow the error fallback', () => {
    const storage = new Map();
    let reloads=0, prevented=0, handler, time=100000;
    const browser={navigator:{onLine:true},sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},location:{reload:()=>reloads++},addEventListener:(_,f)=>handler=f,removeEventListener(){}};
    const event={preventDefault:()=>prevented++};
    installChunkRecovery(browser,()=>time);handler(event);
    installChunkRecovery(browser,()=>time);handler(event);
    assert.equal(reloads,1);assert.equal(prevented,1);
    time+=60001;handler(event);assert.equal(reloads,2);
    browser.navigator.onLine=false;time+=60001;handler(event);assert.equal(reloads,2);
    browser.navigator.onLine=true;browser.sessionStorage.getItem=()=>{throw Error('blocked')};handler(event);assert.equal(reloads,2);
});

test('production routes distinguish missing assets from HTML and revalidate entry pages', async () => {
    process.env.NODE_ENV='production';
    const {default:app}=await import('../server/src/app.js');
    const server=app.listen(0,'127.0.0.1');
    await new Promise(resolve=>server.once('listening',resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    try {
        for(const path of ['/assets/missing.js','/assets/missing.css']){
            const res=await fetch(base+path);assert.equal(res.status,404);assert.match(res.headers.get('content-type'),/^text\/plain/);assert.equal(res.headers.get('cache-control'),'no-store');
        }
        for(const path of ['/','/index.html','/projects','/blogs/setting-up-a-new-mac-with-claude']){
            const res=await fetch(base+path);assert.equal(res.status,200);assert.match(res.headers.get('content-type'),/^text\/html/);assert.equal(res.headers.get('cache-control'),'no-cache');
        }
    }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
