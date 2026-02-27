import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as policyController from "../controllers/policy.controller";
import { applyPolicySchema } from "../controllers/policy.controller";

const router = Router();

router.use(authenticate);

router.get("/readiness", policyController.checkReadiness);
router.post("/apply", validate(applyPolicySchema), policyController.applyForPolicy);
router.get("/", policyController.getUserPolicies);
router.get("/:policyId", policyController.getPolicyDetails);
router.post("/:policyId/mint", policyController.mintPolicyNFT);
router.get("/:policyId/premium", policyController.calculateCurrentPremium);
router.get("/:policyId/history", policyController.getPolicyUpdateHistory);

export default router;

