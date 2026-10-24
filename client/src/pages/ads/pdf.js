// A PDF built in the browser from the slides on screen, in the order they are on screen.
//
// The published PDF is a fixed file bound at publish time, so it cannot honour an order or
// an exclusion made here. Hiding the button when a post is rearranged left no way to export
// at all, which is worse: rearranging is what you do *before* exporting. So an arranged post
// builds its own.
//
// Each page is one image, drawn to a canvas and re-encoded as JPEG so it can be embedded with
// /DCTDecode. That is the one filter a PDF reader must support for which a browser can
// produce the bytes directly; embedding the PNG itself would mean deflating raw pixels here.

const enc = new TextEncoder();

async function jpegOf(url, quality) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    // a JPEG has no alpha, so anything transparent would come out black without this
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) throw new Error("could not encode a page");
    return { bytes: new Uint8Array(await blob.arrayBuffer()), w: canvas.width, h: canvas.height };
}

/**
 * Build a PDF, one page per url, each page the size of its own image.
 * @param {string[]} urls
 * @param {number} quality JPEG quality, 0 to 1
 * @returns {Promise<Blob>}
 */
export async function pdfFromImages(urls, quality = 0.92) {
    const pages = [];
    for (const u of urls) pages.push(await jpegOf(u, quality));

    const chunks = [];
    let length = 0;
    const offsets = [0];
    const push = (data) => {
        const bytes = typeof data === "string" ? enc.encode(data) : data;
        chunks.push(bytes);
        length += bytes.length;
    };
    // every object's byte offset is recorded as it is written, because the xref table at the
    // end has to point at each one exactly
    const obj = (n, body) => {
        offsets[n] = length;
        push(`${n} 0 obj\n`);
        if (typeof body === "string") push(body);
        else body();
        push("\nendobj\n");
    };

    const count = pages.length;
    const pageId = (i) => 3 + i * 3;
    const contentId = (i) => 4 + i * 3;
    const imageId = (i) => 5 + i * 3;

    push("%PDF-1.4\n");
    obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
    obj(
        2,
        `<< /Type /Pages /Count ${count} /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(" ")}] >>`
    );

    pages.forEach((p, i) => {
        obj(
            pageId(i),
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.w} ${p.h}]` +
                ` /Resources << /XObject << /Im0 ${imageId(i)} 0 R >> >>` +
                ` /Contents ${contentId(i)} 0 R >>`
        );
        const draw = `q ${p.w} 0 0 ${p.h} 0 0 cm /Im0 Do Q`;
        obj(contentId(i), `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`);
        obj(imageId(i), () => {
            push(
                `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h}` +
                    ` /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode` +
                    ` /Length ${p.bytes.length} >>\nstream\n`
            );
            push(p.bytes);
            push("\nendstream");
        });
    });

    const total = 3 + count * 3;
    const xref = length;
    push(`xref\n0 ${total}\n0000000000 65535 f \n`);
    for (let n = 1; n < total; n++) push(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
    push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

    return new Blob(chunks, { type: "application/pdf" });
}
