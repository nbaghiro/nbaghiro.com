import assert from 'node:assert/strict';
import test from 'node:test';
import { rootFromLocation, DEFAULT_BASE } from '../client/src/pages/ads/store.js';

test('project anchors never replace the saved library address', () => {
    for (const hash of ['#stripe-subscriptions', '#terraform-pulumi', '#galleo', '#switching-cost', '#profile', '#post-1', '#https%3A%2F%2Fexample.com%2Flibrary']) {
        assert.equal(rootFromLocation({pathname:'/ads/clientbridge-profile',hash}), '');
    }
});
test('landing-page library links still accept keys and full URLs', () => {
    assert.equal(rootFromLocation({pathname:'/ads',hash:'#example-key'}), `${DEFAULT_BASE}/example-key`);
    assert.equal(rootFromLocation({pathname:'/ads/',hash:'#https%3A%2F%2Fexample.com%2Flibrary'}), 'https://example.com/library');
});
test('empty and malformed fragments do not replace the library', () => {
    for (const hash of ['', '#', '#%E0%A4%A']) assert.equal(rootFromLocation({pathname:'/ads',hash}), '');
});
