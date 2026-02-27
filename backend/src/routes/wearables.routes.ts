import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as wearableController from "../controllers/wearable.controller";

const router = Router();

router.use(authenticate);

router.get("/auth-url/:provider", wearableController.getAuthUrl);
router.post("/callback/:provider", wearableController.handleOAuthCallback);
router.get("/connected", wearableController.getConnectedWearables);
router.post("/sync/:provider", wearableController.manualSync);
router.delete("/:provider", wearableController.disconnectWearable);
router.get("/status/:provider", wearableController.getConnectionStatus);

export default router;

