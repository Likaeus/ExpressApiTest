const User = require("../models/User");
const { verifyAccessToken } = require("../services/tokenService");

async function authenticate(req, res, next) {
  const authorization = req.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: { code: "AUTHENTICATION_REQUIRED", message: "A valid bearer token is required" },
    });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("name email role isActive passwordChangedAt");
    if (!user?.isActive) throw new Error("Inactive user");

    if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new Error("Password changed after token creation");
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "The access token is invalid or expired" },
    });
  }
}

module.exports = authenticate;
