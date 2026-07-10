const { ipKeyGenerator } = require("express-rate-limit");

function rateLimitKey(req) {
  const forwardedFor = req.headers?.["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]?.trim();
  const clientIp = forwardedIp || req.ip || req.socket?.remoteAddress || "unknown-client";

  return ipKeyGenerator(String(clientIp));
}

module.exports = rateLimitKey;
