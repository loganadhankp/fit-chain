import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as authController from "../controllers/auth.controller";
import { registerSchema, loginSchema, connectWalletSchema, updateProfileSchema } from "../controllers/auth.controller";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.getMe);
router.put("/profile", authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post("/connect-wallet", authenticate, validate(connectWalletSchema), authController.connectWallet);

export default router;

