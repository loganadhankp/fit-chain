import { Router } from "express";
import { authenticateVendor } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as vendorController from "../controllers/vendor.controller";

const router = Router();

// Public
router.post("/register", validate(vendorController.vendorRegisterSchema), vendorController.registerVendor);
router.post("/login", validate(vendorController.vendorLoginSchema), vendorController.loginVendor);

// Authenticated vendor
router.get("/me", authenticateVendor, vendorController.getVendorProfile);
router.put("/profile", authenticateVendor, validate(vendorController.vendorUpdateSchema), vendorController.updateVendorProfile);

export default router;

