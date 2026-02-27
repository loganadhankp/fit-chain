import { Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../types";

// --------------- Validation Schemas ---------------

export const approveSchema = z.object({
  vendorNotes: z.string().optional(),
  basePremium: z.number().positive().optional(), // vendor can adjust premium based on risk
});

export const rejectSchema = z.object({
  rejectionReason: z.string().min(5, "Please provide a reason for rejection"),
});

// --------------- Handlers ---------------

/**
 * GET /api/vendor/applications — List applications for vendor's templates
 */
export async function listApplications(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Vendor authentication required" });
      return;
    }

    const { status } = req.query;

    const where: Record<string, unknown> = {
      vendorId: req.vendor.id,
    };

    if (status) {
      where.status = status as string;
    }

    const applications = await prisma.insurancePolicy.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            dateOfBirth: true,
          },
        },
        template: {
          select: {
            planName: true,
            coverageTier: true,
            basePremium: true,
            coverageAmount: true,
          },
        },
        questionnaire: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with latest health scores
    const enriched = await Promise.all(
      applications.map(async (app) => {
        const latestScore = await prisma.healthScore.findFirst({
          where: { userId: app.userId },
          orderBy: { scoreDate: "desc" },
        });

        const metricCount = await prisma.healthMetric.count({
          where: { userId: app.userId },
        });

        return {
          ...app,
          currentHealthScore: latestScore?.overallScore ?? null,
          healthScoreTrend: latestScore?.trend ?? null,
          totalMetricDays: metricCount,
        };
      })
    );

    res.json({ applications: enriched });
  } catch (error) {
    console.error("listApplications error:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
}

/**
 * GET /api/vendor/applications/:id — Get application detail
 */
export async function getApplicationDetail(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Vendor authentication required" });
      return;
    }

    const application = await prisma.insurancePolicy.findFirst({
      where: {
        id: req.params.id,
        vendorId: req.vendor.id,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            dateOfBirth: true,
          },
        },
        template: true,
        questionnaire: true,
      },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found" });
      return;
    }

    // Get recent health scores (last 30 days)
    const healthScores = await prisma.healthScore.findMany({
      where: { userId: application.userId },
      orderBy: { scoreDate: "desc" },
      take: 30,
    });

    // Get recent health metrics (last 14 days)
    const healthMetrics = await prisma.healthMetric.findMany({
      where: { userId: application.userId },
      orderBy: { metricDate: "desc" },
      take: 14,
    });

    res.json({
      application,
      healthScores,
      healthMetrics,
    });
  } catch (error) {
    console.error("getApplicationDetail error:", error);
    res.status(500).json({ error: "Failed to fetch application detail" });
  }
}

/**
 * POST /api/vendor/applications/:id/approve — Approve an application
 */
export async function approveApplication(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Vendor authentication required" });
      return;
    }

    const application = await prisma.insurancePolicy.findFirst({
      where: {
        id: req.params.id,
        vendorId: req.vendor.id,
        status: "pending_review",
      },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found or already reviewed" });
      return;
    }

    const { vendorNotes, basePremium } = req.body;

    const updated = await prisma.insurancePolicy.update({
      where: { id: application.id },
      data: {
        status: "approved",
        vendorNotes,
        basePremium: basePremium ?? application.basePremium,
        reviewedAt: new Date(),
      },
    });

    res.json({
      message: "Application approved",
      policy: updated,
    });
  } catch (error) {
    console.error("approveApplication error:", error);
    res.status(500).json({ error: "Failed to approve application" });
  }
}

/**
 * POST /api/vendor/applications/:id/reject — Reject an application
 */
export async function rejectApplication(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Vendor authentication required" });
      return;
    }

    const application = await prisma.insurancePolicy.findFirst({
      where: {
        id: req.params.id,
        vendorId: req.vendor.id,
        status: "pending_review",
      },
    });

    if (!application) {
      res.status(404).json({ error: "Application not found or already reviewed" });
      return;
    }

    const { rejectionReason } = req.body;

    const updated = await prisma.insurancePolicy.update({
      where: { id: application.id },
      data: {
        status: "rejected",
        rejectionReason,
        reviewedAt: new Date(),
      },
    });

    res.json({
      message: "Application rejected",
      policy: updated,
    });
  } catch (error) {
    console.error("rejectApplication error:", error);
    res.status(500).json({ error: "Failed to reject application" });
  }
}

