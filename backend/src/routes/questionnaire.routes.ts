import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as questionnaireController from "../controllers/questionnaire.controller";

const router = Router();

router.use(authenticate);

router.post("/", validate(questionnaireController.questionnaireSchema), questionnaireController.submitQuestionnaire);
router.get("/", questionnaireController.getQuestionnaire);
router.put("/", validate(questionnaireController.questionnaireSchema), questionnaireController.updateQuestionnaire);

export default router;

