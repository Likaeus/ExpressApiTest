const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fileUpload = require("express-fileupload");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const rateLimitKey = require("./middleware/rateLimitKey");
const config = require("./config");
const heroRoutes = require("./routes/heroRoutes");
const authRoutes = require("./routes/authRoutes");
const legacyRoutes = require("../routes/routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", config.trustProxy);
app.use(helmet());
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(
  fileUpload({
    abortOnLimit: true,
    limits: { fileSize: config.maxImageSize },
    safeFileNames: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: rateLimitKey,

    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests",
      },
    },
  }),
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/heroes", heroRoutes);
app.use("/api", legacyRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
