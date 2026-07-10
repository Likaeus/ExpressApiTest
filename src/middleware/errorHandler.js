const mongoose = require("mongoose");

function notFound(req, res) {
  res.status(404).json({
    error: { code: "ROUTE_NOT_FOUND", message: "Route not found" },
  });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.status || 500;
  let code = error.code || "INTERNAL_ERROR";
  let message = error.message || "Internal server error";

  if (error instanceof mongoose.Error.CastError) {
    status = 400;
    code = "INVALID_ID";
    message = "The supplied resource id is invalid";
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 422;
    code = "VALIDATION_ERROR";
  }

  if (status >= 500) console.error(error);
  res.status(status).json({ error: { code, message } });
}

module.exports = { notFound, errorHandler };
