import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

// Exercise the production HTML and static routes. No API endpoints are called.
test('every article exposes a fetchable JPEG preview without JavaScript', async () => {
    process.env.NODE_ENV = 'production';
    const { default: app } = await import('../server/src/app.js');
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    try {
        const posts = JSON.parse(readFileSync(new URL('../client/dist/posts.json', import.meta.url)));
        assert.ok(posts.length > 0);
        for (const post of posts) {
            const res = await fetch(`${base}/blogs/${post.slug}`, {headers: {'User-Agent': 'LinkedInBot/1.0'}});
            assert.equal(res.status, 200, post.slug);
            const html = await res.text();
            const images = [...html.matchAll(/property="og:image" content="([^"]+)"/g)];
            assert.equal(images.length, 1, `${post.slug}: exactly one preview image`);
            const imageURL = new URL(images[0][1]);
            assert.equal(imageURL.protocol, 'https:');
            assert.ok(html.includes('name="twitter:image"'));
            const image = await fetch(base + imageURL.pathname);
            assert.equal(image.status, 200, post.slug);
            assert.match(image.headers.get('content-type'), /^image\/jpeg/, post.slug);
            const metadata = await sharp(Buffer.from(await image.arrayBuffer())).metadata();
            assert.equal(metadata.width, 1200, post.slug);
            assert.equal(metadata.height, 627, post.slug);
        }
        const missing = await fetch(`${base}/img/posts/missing-preview-test.jpg`);
        assert.equal(missing.status, 404);
    } finally {
        server.closeAllConnections();
        await new Promise(resolve => server.close(resolve));
    }
});
