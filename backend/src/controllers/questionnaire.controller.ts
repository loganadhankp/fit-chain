import { Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../types";

// --------------- Validation Schemas ---------------

export const questionnaireSchema = z.object({
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  smoker: z.boolean().default(false),
  alcoholFrequency: z.enum(["never", "occasional", "regular"]).optional(),
  exerciseFrequency: z.enum(["sedentary", "light", "moderate", "active"]).optional(),
  preExistingConditions: z.array(z.string()).default([]),
  familyHistory: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
});

// --------------- Helpers ---------------

function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

// --------------- Handlers ---------------

/**
 * POST /api/questionnaire — Submit health questionnaire
 */
export async function submitQuestionnaire(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Check if user already has a questionnaire
    const existing = await prisma.healthQuestionnaire.findFirst({
      where: { userId: req.user.id },
    });

    if (existing) {
      res.status(409).json({ error: "Questionnaire already submitted. Use PUT to update." });
      return;
    }

    const {
      heightCm,
      weightKg,
      smoker,
      alcoholFrequency,
      exerciseFrequency,
      preExistingConditions,
      familyHistory,
      medications,
    } = req.body;

    const bmi = heightCm && weightKg ? calculateBMI(heightCm, weightKg) : null;

    const questionnaire = await prisma.healthQuestionnaire.create({
      data: {
        userId: req.user.id,
        heightCm,
        weightKg,
        bmi,
        smoker,
        alcoholFrequency,
        exerciseFrequency,
        preExistingConditions,
        familyHistory,
        medications,
      },
    });

    res.status(201).json({ questionnaire });
  } catch (error) {
    console.error("submitQuestionnaire error:", error);
    res.status(500).json({ error: "Failed to submit questionnaire" });
  }
}

/**
 * GET /api/questionnaire — Get user's questionnaire
 */
export async function getQuestionnaire(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const questionnaire = await prisma.healthQuestionnaire.findFirst({
      where: { userId: req.user.id },
      orderBy: { submittedAt: "desc" },
    });

    if (!questionnaire) {
      res.status(404).json({ error: "No questionnaire found. Please submit one first." });
      return;
    }

    res.json({ questionnaire });
  } catch (error) {
    console.error("getQuestionnaire error:", error);
    res.status(500).json({ error: "Failed to fetch questionnaire" });
  }
}

/**
 * PUT /api/questionnaire — Update questionnaire
 */
export async function updateQuestionnaire(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const existing = await prisma.healthQuestionnaire.findFirst({
      where: { userId: req.user.id },
      orderBy: { submittedAt: "desc" },
    });

    if (!existing) {
      res.status(404).json({ error: "No questionnaire found. Please submit one first." });
      return;
    }

    const {
      heightCm,
      weightKg,
      smoker,
      alcoholFrequency,
      exerciseFrequency,
      preExistingConditions,
      familyHistory,
      medications,
    } = req.body;

    const h = heightCm ?? Number(existing.heightCm);
    const w = weightKg ?? Number(existing.weightKg);
    const bmi = h && w ? calculateBMI(h, w) : existing.bmi;

    const questionnaire = await prisma.healthQuestionnaire.update({
      where: { id: existing.id },
      data: {
        heightCm: heightCm ?? existing.heightCm,
        weightKg: weightKg ?? existing.weightKg,
        bmi,
        smoker: smoker ?? existing.smoker,
        alcoholFrequency: alcoholFrequency ?? existing.alcoholFrequency,
        exerciseFrequency: exerciseFrequency ?? existing.exerciseFrequency,
        preExistingConditions: preExistingConditions ?? existing.preExistingConditions,
        familyHistory: familyHistory ?? existing.familyHistory,
        medications: medications ?? existing.medications,
      },
    });

    res.json({ questionnaire });
  } catch (error) {
    console.error("updateQuestionnaire error:", error);
    res.status(500).json({ error: "Failed to update questionnaire" });
  }
}

