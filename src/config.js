const port = Number.parseInt(process.env.PORT || "8000", 10);
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET environment variable must contain at least 32 characters");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

module.exports = {
  port,
  databaseUrl,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  jwtIssuer: "heroes-api",
  jwtAudience: "heroes-web",
  userDatabaseName: process.env.USER_DATABASE_NAME || "Users",
  userCollectionName: process.env.USER_COLLECTION_NAME || "User_Info",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  maxImageSize: 5 * 1024 * 1024,
};
