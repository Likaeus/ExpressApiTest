const BODYLESS_STATUS_CODES = new Set([204, 205, 304]);

function normalizeLambdaResponse(response) {
  if (!BODYLESS_STATUS_CODES.has(response?.statusCode)) return response;
  return { ...response, body: null, isBase64Encoded: false };
}

module.exports = { normalizeLambdaResponse };
