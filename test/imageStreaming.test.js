const test = require("node:test");
const assert = require("node:assert/strict");

const {
  imageIdFromPath,
  corsHeaders,
  imageBuffer,
  bufferStream,
} = require("../src/netlify/imageStreaming");

test("recognizes image routes behind the direct Netlify function URL", () => {
  const id = "6a504fe66d4f5e6e92798389";
  assert.equal(imageIdFromPath(`/.netlify/functions/api/api/v1/heroes/${id}/image`), id);
  assert.equal(imageIdFromPath(`/api/v1/heroes/${id}/image`), id);
  assert.equal(imageIdFromPath(`/api/v1/heroes/not-an-id/image`), null);
});

test("CORS never reflects an untrusted origin", () => {
  const headers = corsHeaders("https://attacker.example", "https://epicenclave.netlify.app");
  assert.equal(headers["Access-Control-Allow-Origin"], "https://epicenclave.netlify.app");
});

test("streams a buffer in bounded chunks without changing its bytes", async () => {
  const source = Buffer.alloc(150_000);
  source.forEach((_, index) => { source[index] = index % 251; });

  const chunks = [];
  for await (const chunk of bufferStream(imageBuffer(source))) chunks.push(Buffer.from(chunk));

  assert.equal(chunks.length, 3);
  assert.deepEqual(Buffer.concat(chunks), source);
});
