import { Router } from "express";
import { authenticateVendor, requireVerifiedVendor } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as templateController from "../controllers/template.controller";

const router = Router();

// Public browse (user-facing, no auth required)
router.get("/browse", templateController.browseTemplates);

// Vendor-only CRUD (requires verified vendor)
router.post(
  "/",
  authenticateVendor,
  requireVerifiedVendor,
  validate(templateController.createTemplateSchema),
  templateController.createTemplate
);
router.get("/", authenticateVendor, templateController.getVendorTemplates);
router.put(
  "/:id",
  authenticateVendor,
  requireVerifiedVendor,
  validate(templateController.updateTemplateSchema),
  templateController.updateTemplate
);
router.delete("/:id", authenticateVendor, requireVerifiedVendor, templateController.deleteTemplate);

export default router;

