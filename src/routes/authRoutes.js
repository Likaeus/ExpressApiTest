const express = require("express");
const { rateLimit } = require("express-rate-limit");
const controller = require("../controllers/authController");
const asyncHandler = require("../middleware/asyncHandler");
const authenticate = require("../middleware/authenticate");
const { validateCredentials, validateRegistration } = require("../middleware/validateAuth");
const rateLimitKey = require("../middleware/rateLimitKey");

const router = express.Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  message: { error: { code: "TOO_MANY_ATTEMPTS", message: "Try again later" } },
});

router.post("/register", authLimiter, validateRegistration, asyncHandler(controller.register));
router.post("/login", authLimiter, validateCredentials, asyncHandler(controller.login));
router.get("/me", authenticate, controller.me);

module.exports = router;
