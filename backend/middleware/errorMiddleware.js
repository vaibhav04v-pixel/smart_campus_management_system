// middleware/errorMiddleware.js
// Centralised error handler for the Express app.
// Any error passed to next(error) inside a route handler lands here.
// Returns a consistent JSON error response instead of an HTML stack trace.

const errorHandler = (err, req, res, next) => {
  // If a status code was already set on the response use it,
  // otherwise fall back to 500 (Internal Server Error).
  let statusCode =
    err.statusCode ||
    err.status ||
    (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "An unexpected error occurred";

  // Handle Mongoose Validation Error (e.g. required field missing, minlength)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Handle Mongoose Duplicate Key Error (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `An account with this ${field} already exists`
      : "Duplicate field value entered";
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Not authorized — invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Not authorized — token has expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose the full stack trace during development
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

// Handles requests to routes that don't exist (404 Not Found)
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
