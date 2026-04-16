import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import fileUpload from "express-fileupload";
import config from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import mapRoutes from "./routes/mapRoutes.js";
import { errorHandler } from "./middleware/errorMiddleware.js";
import { getDependencyHealth } from "./services/healthService.js";
import { globalLimiter, requestCreateLimiter } from "./middleware/rateLimitMiddleware.js";

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(fileUpload({ useTempFiles: false }));

// Global rate limiter — applies to all API routes (skip health check)
app.use("/api", globalLimiter);

app.use("/api/auth", authRoutes); // auth routes handle their own rate limiting
app.use("/api/donors", donorRoutes);
app.use("/api/requests", requestCreateLimiter, requestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/map", mapRoutes);

app.get("/api/health", async (req, res) => {
  const dependencies = await getDependencyHealth();
  res.json({ ok: true, message: "Blood & Organ Donation API running", dependencies });
});

app.use(errorHandler);

export default app;
