const IMAGE_ROUTE = /\/api\/v1\/heroes\/([0-9a-fA-F]{24})\/image\/?$/;
const STREAM_CHUNK_SIZE = 64 * 1024;

function imageIdFromPath(pathname) {
  return pathname.match(IMAGE_ROUTE)?.[1] || null;
}

function corsHeaders(requestOrigin, configuredOrigin) {
  const allowedOrigin = configuredOrigin === "*" ? "*" : configuredOrigin;
  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };

  // Do not reflect arbitrary origins. A mismatched origin receives the configured
  // value and the browser rejects it, matching the behavior of the Express CORS middleware.
  if (configuredOrigin !== "*" && requestOrigin !== configuredOrigin) {
    headers["Access-Control-Allow-Origin"] = configuredOrigin;
  }

  return headers;
}

function imageBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value?.buffer instanceof ArrayBuffer) {
    return Buffer.from(value.buffer, value.byteOffset || 0, value.byteLength);
  }
  if (value?.buffer) return Buffer.from(value.buffer);
  return Buffer.from(value);
}

function bufferStream(buffer, chunkSize = STREAM_CHUNK_SIZE) {
  let offset = 0;

  return new ReadableStream({
    pull(controller) {
      if (offset >= buffer.length) {
        controller.close();
        return;
      }

      const end = Math.min(offset + chunkSize, buffer.length);
      controller.enqueue(new Uint8Array(buffer.buffer, buffer.byteOffset + offset, end - offset));
      offset = end;
    },
  });
}

module.exports = { imageIdFromPath, corsHeaders, imageBuffer, bufferStream };
