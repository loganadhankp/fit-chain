import { Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import redis from "../lib/redis";
import { AuthenticatedRequest } from "../types";
import { calculateHealthScore, determineTrend } from "../services/healthScore.service";
import { getAIScore, AIScoreInput } from "../services/aiScore.service";

// --------------- Validation ---------------

export const createMetricSchema = z.object({
  metricDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  steps: z.number().int().min(0).optional().default(0),
  activeMinutes: z.number().int().min(0).optional().default(0),
  sleepHours: z.number().min(0).max(24).optional().default(0),
  restingHeartRate: z.number().int().min(30).max(250).optional(),
  distanceKm: z.number().min(0).optional().default(0),
  caloriesBurned: z.number().int().min(0).optional().default(0),
  dataSource: z.string().optional(),
});

// --------------- Handlers ---------------

/**
 * GET /api/health/metrics?startDate=...&endDate=...
 */
export async function getHealthMetrics(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    const { startDate, endDate } = req.query;

    const where: Record<string, unknown> = { userId: req.user.id };
    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate as string);
      if (endDate) dateFilter.lte = new Date(endDate as string);
      where.metricDate = dateFilter;
    }

    const metrics = await prisma.healthMetric.findMany({
      where,
      orderBy: { metricDate: "desc" },
      take: 90,
    });

    res.json({ metrics });
  } catch (error) {
    console.error("getHealthMetrics error:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
}

/**
 * POST /api/health/metrics
 */
export async function createHealthMetric(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    const data = req.body;

    const metric = await prisma.healthMetric.upsert({
      where: {
        userId_metricDate: {
          userId: req.user.id,
          metricDate: new Date(data.metricDate),
        },
      },
      update: {
        steps: data.steps,
        activeMinutes: data.activeMinutes,
        sleepHours: data.sleepHours,
        restingHeartRate: data.restingHeartRate,
        distanceKm: data.distanceKm,
        caloriesBurned: data.caloriesBurned,
        dataSource: data.dataSource,
      },
      create: {
        userId: req.user.id,
        metricDate: new Date(data.metricDate),
        steps: data.steps,
        activeMinutes: data.activeMinutes,
        sleepHours: data.sleepHours,
        restingHeartRate: data.restingHeartRate,
        distanceKm: data.distanceKm,
        caloriesBurned: data.caloriesBurned,
        dataSource: data.dataSource,
      },
    });

    // Recalculate health score for that day
    await recalculateScore(req.user.id, data.metricDate);

    res.status(201).json({ metric });
  } catch (error) {
    console.error("createHealthMetric error:", error);
    res.status(500).json({ error: "Failed to save metric" });
  }
}

/**
 * GET /api/health/score
 */
export async function getCurrentHealthScore(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    // Try cache first
    const cached = await redis.get(`user:${req.user.id}:health_score`).catch(() => null);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const latestScore = await prisma.healthScore.findFirst({
      where: { userId: req.user.id },
      orderBy: { scoreDate: "desc" },
    });

    if (!latestScore) {
      res.json({
        overallScore: 0,
        stepsScore: 0,
        activityScore: 0,
        sleepScore: 0,
        heartScore: 0,
        trend: "stable",
        aiRiskScore: null,
        aiRiskCategory: null,
        aiConfidence: null,
      });
      return;
    }

    const result = {
      overallScore: latestScore.overallScore,
      stepsScore: latestScore.stepsScore,
      activityScore: latestScore.activityScore,
      sleepScore: latestScore.sleepScore,
      heartScore: latestScore.heartScore,
      trend: latestScore.trend,
      scoreDate: latestScore.scoreDate,
      syncedToBlockchain: latestScore.syncedToBlockchain,
      aiRiskScore: latestScore.aiRiskScore,
      aiRiskCategory: latestScore.aiRiskCategory,
      aiConfidence: latestScore.aiConfidence ? Number(latestScore.aiConfidence) : null,
    };

    // Cache for 24 hours
    await redis.setex(`user:${req.user.id}:health_score`, 86400, JSON.stringify(result)).catch(() => {});

    res.json(result);
  } catch (error) {
    console.error("getCurrentHealthScore error:", error);
    res.status(500).json({ error: "Failed to fetch health score" });
  }
}

/**
 * GET /api/health/score/history?days=30
 */
export async function getHealthScoreHistory(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const scores = await prisma.healthScore.findMany({
      where: {
        userId: req.user.id,
        scoreDate: { gte: startDate },
      },
      orderBy: { scoreDate: "asc" },
    });

    res.json({ scores });
  } catch (error) {
    console.error("getHealthScoreHistory error:", error);
    res.status(500).json({ error: "Failed to fetch score history" });
  }
}

/**
 * GET /api/health/summary
 */
export async function getHealthSummary(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const metrics = await prisma.healthMetric.findMany({
      where: {
        userId: req.user.id,
        metricDate: { gte: sevenDaysAgo },
      },
      orderBy: { metricDate: "desc" },
    });

    if (metrics.length === 0) {
      res.json({
        avgSteps: 0,
        avgActiveMinutes: 0,
        avgSleepHours: 0,
        avgHeartRate: 0,
        totalDays: 0,
      });
      return;
    }

    const avgSteps = Math.round(metrics.reduce((s, m) => s + (m.steps || 0), 0) / metrics.length);
    const avgActiveMinutes = Math.round(
      metrics.reduce((s, m) => s + (m.activeMinutes || 0), 0) / metrics.length
    );
    const avgSleepHours = Number(
      (metrics.reduce((s, m) => s + Number(m.sleepHours || 0), 0) / metrics.length).toFixed(1)
    );
    const heartRates = metrics.filter((m) => m.restingHeartRate).map((m) => m.restingHeartRate!);
    const avgHeartRate = heartRates.length > 0
      ? Math.round(heartRates.reduce((s, v) => s + v, 0) / heartRates.length)
      : 0;

    res.json({
      avgSteps,
      avgActiveMinutes,
      avgSleepHours,
      avgHeartRate,
      totalDays: metrics.length,
    });
  } catch (error) {
    console.error("getHealthSummary error:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
}

// --------------- Internal helper ---------------

async function recalculateScore(userId: string, dateStr: string) {
  const metric = await prisma.healthMetric.findUnique({
    where: { userId_metricDate: { userId, metricDate: new Date(dateStr) } },
  });

  if (!metric) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const age = user?.dateOfBirth
    ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 30; // default age

  // ── Rule-based score ──
  const breakdown = calculateHealthScore({
    steps: metric.steps || 0,
    activeMinutes: metric.activeMinutes || 0,
    sleepHours: Number(metric.sleepHours || 0),
    restingHeartRate: metric.restingHeartRate || 70,
    age,
  });

  // ── AI-based score (runs in parallel, non-blocking) ──
  let aiRiskScore: number | null = null;
  let aiRiskCategory: string | null = null;
  let aiConfidence: number | null = null;

  try {
    // Fetch questionnaire data for extra features
    const questionnaire = await prisma.healthQuestionnaire.findFirst({
      where: { userId },
      orderBy: { submittedAt: "desc" },
    });

    const preExisting = Array.isArray(questionnaire?.preExistingConditions)
      ? (questionnaire.preExistingConditions as string[]).length
      : 0;
    const familyHist = Array.isArray(questionnaire?.familyHistory)
      ? (questionnaire.familyHistory as string[]).length
      : 0;

    const aiInput: AIScoreInput = {
      age,
      gender: "male", // Gender not stored on User model; default for AI model
      bmi: questionnaire?.bmi ? Number(questionnaire.bmi) : 25,
      smoker: questionnaire?.smoker ?? false,
      alcohol_frequency: questionnaire?.alcoholFrequency || "occasional",
      exercise_frequency: questionnaire?.exerciseFrequency || "moderate",
      pre_existing_conditions_count: preExisting,
      family_history_count: familyHist,
      steps: metric.steps || 0,
      active_minutes: metric.activeMinutes || 0,
      sleep_hours: Number(metric.sleepHours || 0),
      resting_heart_rate: metric.restingHeartRate || 70,
      calories_burned: metric.caloriesBurned || 0,
      distance_km: Number(metric.distanceKm || 0),
    };

    const aiResult = await getAIScore(aiInput);
    if (aiResult) {
      aiRiskScore = Math.round(aiResult.aiRiskScore);
      aiRiskCategory = aiResult.riskCategory;
      aiConfidence = aiResult.confidence;
    }
  } catch (err) {
    console.warn("[recalculateScore] AI score fetch failed (non‑critical):", err);
  }

  // ── Determine trend ──
  const recentScores = await prisma.healthScore.findMany({
    where: { userId },
    orderBy: { scoreDate: "desc" },
    take: 14,
    select: { overallScore: true },
  });

  const recent7 = recentScores.slice(0, 7).map((s) => s.overallScore);
  const prev7 = recentScores.slice(7, 14).map((s) => s.overallScore);
  const trend = determineTrend(recent7, prev7);

  // ── Persist both scores ──
  await prisma.healthScore.upsert({
    where: { userId_scoreDate: { userId, scoreDate: new Date(dateStr) } },
    update: {
      overallScore: breakdown.overallScore,
      stepsScore: breakdown.stepsScore,
      activityScore: breakdown.activityScore,
      sleepScore: breakdown.sleepScore,
      heartScore: breakdown.heartScore,
      trend,
      aiRiskScore,
      aiRiskCategory,
      aiConfidence,
    },
    create: {
      userId,
      scoreDate: new Date(dateStr),
      overallScore: breakdown.overallScore,
      stepsScore: breakdown.stepsScore,
      activityScore: breakdown.activityScore,
      sleepScore: breakdown.sleepScore,
      heartScore: breakdown.heartScore,
      trend,
      aiRiskScore,
      aiRiskCategory,
      aiConfidence,
    },
  });

  // Invalidate cache
  await redis.del(`user:${userId}:health_score`).catch(() => {});
}

