const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function validateCredentials(req, res, next) {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!EMAIL_PATTERN.test(email) || !password || password.length > 128) {
    return res.status(422).json({
      error: { code: "VALIDATION_ERROR", message: "Valid email and password are required" },
    });
  }

  req.credentials = { email, password };
  next();
}

function validateRegistration(req, res, next) {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const errors = [];

  if (name.length < 2 || name.length > 100) errors.push("name must contain 2 to 100 characters");
  if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.push("email is invalid");
  if (password.length < 12 || password.length > 128) errors.push("password must contain 12 to 128 characters");
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    errors.push("password must include uppercase, lowercase and number characters");
  }

  if (errors.length) {
    return res.status(422).json({
      error: { code: "VALIDATION_ERROR", message: errors.join("; ") },
    });
  }

  req.registration = { name, email, password };
  next();
}

module.exports = { normalizeEmail, validateCredentials, validateRegistration };
