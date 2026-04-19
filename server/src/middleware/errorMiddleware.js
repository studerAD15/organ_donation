import { v4 as uuidv4 } from "uuid";

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, _next) => {
  const requestId = uuidv4();
  const isDev = process.env.NODE_ENV !== "production";
  let statusCode = err.statusCode || 500;
  let message = err.isOperational ? err.message : (isDev ? err.message : "An unexpected error occurred");

  if (err?.name === "MongoServerError" && err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    if (field === "phone") {
      message = "Phone number already registered";
    } else {
      message = `${field} already exists`;
    }
  } else if (err?.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors || {})[0]?.message || "Validation failed";
  } else if (err?.name === "CastError") {
    statusCode = 400;
    message = "Invalid request data";
  } else if (err?.name === "MongooseServerSelectionError") {
    statusCode = 503;
    message = "Database unavailable. Please try again shortly.";
  } else if (err?.message === "Not allowed by CORS") {
    statusCode = 403;
    message = "Request origin is not allowed by server CORS policy";
  }

  // Log all errors server-side with context
  console.error(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path}`, {
    message: err.message,
    statusCode,
    ...(isDev && { stack: err.stack })
  });

  res.status(statusCode).json({
    error: {
      message,
      requestId,
      ...(isDev && !err.isOperational && { stack: err.stack })
    }
  });
};
