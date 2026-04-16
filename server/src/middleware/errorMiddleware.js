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
  const statusCode = err.statusCode || 500;

  // Log all errors server-side with context
  console.error(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path}`, {
    message: err.message,
    statusCode,
    ...(isDev && { stack: err.stack })
  });

  // Don't leak internal error details unless operational or in dev
  const message = err.isOperational ? err.message : (isDev ? err.message : "An unexpected error occurred");

  res.status(statusCode).json({
    error: {
      message,
      requestId,
      ...(isDev && !err.isOperational && { stack: err.stack })
    }
  });
};
