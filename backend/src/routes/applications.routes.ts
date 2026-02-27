import { Router } from "express";
import { authenticateVendor, requireVerifiedVendor } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as appController from "../controllers/applications.controller";

const router = Router();

// All routes require authenticated + verified vendor
router.use(authenticateVendor, requireVerifiedVendor);

router.get("/", appController.listApplications);
router.get("/:id", appController.getApplicationDetail);
router.post("/:id/approve", validate(appController.approveSchema), appController.approveApplication);
router.post("/:id/reject", validate(appController.rejectSchema), appController.rejectApplication);

export default router;

