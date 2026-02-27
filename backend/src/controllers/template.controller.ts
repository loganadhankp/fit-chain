import { Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../types";

// --------------- Validation Schemas ---------------

export const createTemplateSchema = z.object({
  planName: z.string().min(2, "Plan name is required"),
  description: z.string().optional(),
  basePremium: z.number().positive("Base premium must be positive"),
  coverageAmount: z.number().positive("Coverage amount must be positive"),
  coverageTier: z.number().int().min(1).max(4).default(1),
  policyType: z.enum(["health", "life", "critical_illness"]).default("health"),
  minHealthScore: z.number().int().min(0).max(100).default(0),
  maxDiscountPercentage: z.number().int().min(0).max(50).default(20),
  durationMonths: z.number().int().min(1).max(120).default(12),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// --------------- Handlers ---------------

/**
 * POST /api/templates — Create a new policy template (vendor-only)
 */
export async function createTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Vendor authentication required" });
      return;
    }

    const template = await prisma.policyTemplate.create({
      data: {
        vendorId: req.vendor.id,
        planName: req.body.planName,
        description: req.body.description,
        basePremium: req.body.basePremium,
        coverageAmount: req.body.coverageAmount,
        coverageTier: req.body.coverageTier,
        policyType: req.body.policyType,
        minHealthScore: req.body.minHealthScore,
        maxDiscountPercentage: req.body.maxDiscountPercentage,
        durationMonths: req.body.durationMonths,
      },
    });

    res.status(201).json({ template });
  } catch (error) {
    console.error("createTemplate error:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
}

/**
 * GET /api/templates — List vendor's own templates
 */
export async function getVendorTemplates(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Vendor authentication required" });
      return;
    }

    const templates = await prisma.policyTemplate.findMany({
      where: { vendorId: req.vendor.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ templates });
  } catch (error) {
    console.error("getVendorTemplates error:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
}

/**
 * PUT /api/templates/:id — Update a template
 */
export async function updateTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Vendor authentication required" });
      return;
    }

    const template = await prisma.policyTemplate.findFirst({
      where: { id: req.params.id, vendorId: req.vendor.id },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    const updated = await prisma.policyTemplate.update({
      where: { id: template.id },
      data: req.body,
    });

    res.json({ template: updated });
  } catch (error) {
    console.error("updateTemplate error:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
}

/**
 * DELETE /api/templates/:id — Deactivate a template (soft delete)
 */
export async function deleteTemplate(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Vendor authentication required" });
      return;
    }

    const template = await prisma.policyTemplate.findFirst({
      where: { id: req.params.id, vendorId: req.vendor.id },
    });

    if (!template) {
      res.status(404).json({ error: "Template not found" });
      return;
    }

    await prisma.policyTemplate.update({
      where: { id: template.id },
      data: { isActive: false },
    });

    res.json({ message: "Template deactivated" });
  } catch (error) {
    console.error("deleteTemplate error:", error);
    res.status(500).json({ error: "Failed to deactivate template" });
  }
}

/**
 * GET /api/templates/browse — Public: browse all active templates from verified vendors
 */
export async function browseTemplates(req: AuthenticatedRequest, res: Response) {
  try {
    const { tier, type, minCoverage, maxPremium } = req.query;

    const where: Record<string, unknown> = {
      isActive: true,
      vendor: { isVerified: true },
    };

    if (tier) where.coverageTier = parseInt(tier as string, 10);
    if (type) where.policyType = type as string;
    if (minCoverage) where.coverageAmount = { gte: parseFloat(minCoverage as string) };
    if (maxPremium) where.basePremium = { lte: parseFloat(maxPremium as string) };

    const templates = await prisma.policyTemplate.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
            isVerified: true,
          },
        },
      },
      orderBy: { basePremium: "asc" },
    });

    res.json({ templates });
  } catch (error) {
    console.error("browseTemplates error:", error);
    res.status(500).json({ error: "Failed to browse templates" });
  }
}

