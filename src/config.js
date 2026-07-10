const port = Number.parseInt(process.env.PORT || "8000", 10);
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const corsOrigin = (process.env.CORS_ORIGIN || "*").trim().replace(/\/+$/, "");
const isServerlessRuntime = Boolean(
  process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY || process.env.NETLIFY_DEV
);

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
  campaignDatabaseName: process.env.CAMPAIGN_DATABASE_NAME || "Campaign",
  campaignCollectionName: process.env.CAMPAIGN_COLLECTION_NAME || "Campaigns",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin,
  trustProxy: isServerlessRuntime ? 1 : false,
  maxImageSize: 5 * 1024 * 1024,
  maxMapSize: 4 * 1024 * 1024,
  maxMapUploadSize: Math.floor(4.25 * 1024 * 1024),
};
