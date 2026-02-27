import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as healthController from "../controllers/health.controller";
import { createMetricSchema } from "../controllers/health.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/metrics", healthController.getHealthMetrics);
router.post("/metrics", validate(createMetricSchema), healthController.createHealthMetric);
router.get("/score", healthController.getCurrentHealthScore);
router.get("/score/history", healthController.getHealthScoreHistory);
router.get("/summary", healthController.getHealthSummary);

export default router;

