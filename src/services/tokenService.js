const jwt = require("jsonwebtoken");
const config = require("../config");

function createAccessToken(user) {
  return jwt.sign(
    { role: user.role },
    config.jwtSecret,
    {
      algorithm: "HS256",
      subject: user.id,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
      expiresIn: config.jwtExpiresIn,
    }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret, {
    algorithms: ["HS256"],
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
  });
}

module.exports = { createAccessToken, verifyAccessToken };
