import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import healthRoutes from "./routes/health.routes";
import wearableRoutes from "./routes/wearables.routes";
import policyRoutes from "./routes/policies.routes";
import vendorRoutes from "./routes/vendor.routes";
import templateRoutes from "./routes/template.routes";
import questionnaireRoutes from "./routes/questionnaire.routes";
import applicationRoutes from "./routes/applications.routes";

const app = express();
const PORT = process.env.PORT || 3001;

// --------------- Global middleware ---------------
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Rate limiting – 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/", limiter);

// --------------- Routes ---------------
app.get("/api/health-check", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// User routes
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/wearables", wearableRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/questionnaire", questionnaireRoutes);

// Vendor routes
app.use("/api/vendors", vendorRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/vendor/applications", applicationRoutes);

// --------------- Error handler ---------------
app.use(errorHandler);

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`HealthChain API running on http://localhost:${PORT}`);
});

export default app;
