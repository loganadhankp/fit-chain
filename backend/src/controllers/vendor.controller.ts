import { Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma";
import { generateVendorToken } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";

// --------------- Validation Schemas ---------------

export const vendorRegisterSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  licenseNumber: z.string().optional(),
  description: z.string().optional(),
});

export const vendorLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const vendorUpdateSchema = z.object({
  companyName: z.string().min(2).optional(),
  description: z.string().optional(),
  licenseNumber: z.string().optional(),
  logoUrl: z.string().url().optional(),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
    .optional(),
});

// --------------- Handlers ---------------

/**
 * POST /api/vendors/register
 */
export async function registerVendor(req: AuthenticatedRequest, res: Response) {
  try {
    const { companyName, email, password, licenseNumber, description } = req.body;

    const existing = await prisma.vendor.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const vendor = await prisma.vendor.create({
      data: {
        companyName,
        email,
        passwordHash,
        licenseNumber,
        description,
      },
    });

    const token = generateVendorToken({
      id: vendor.id,
      email: vendor.email,
      companyName: vendor.companyName,
      isVerified: vendor.isVerified,
    });

    res.status(201).json({
      token,
      vendor: {
        id: vendor.id,
        companyName: vendor.companyName,
        email: vendor.email,
        isVerified: vendor.isVerified,
      },
    });
  } catch (error) {
    console.error("Vendor register error:", error);
    res.status(500).json({ error: "Vendor registration failed" });
  }
}

/**
 * POST /api/vendors/login
 */
export async function loginVendor(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password } = req.body;

    const vendor = await prisma.vendor.findUnique({ where: { email } });
    if (!vendor) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, vendor.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateVendorToken({
      id: vendor.id,
      email: vendor.email,
      companyName: vendor.companyName,
      isVerified: vendor.isVerified,
    });

    res.json({
      token,
      vendor: {
        id: vendor.id,
        companyName: vendor.companyName,
        email: vendor.email,
        isVerified: vendor.isVerified,
        walletAddress: vendor.walletAddress,
      },
    });
  } catch (error) {
    console.error("Vendor login error:", error);
    res.status(500).json({ error: "Vendor login failed" });
  }
}

/**
 * GET /api/vendors/me
 */
export async function getVendorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: req.vendor.id },
      select: {
        id: true,
        companyName: true,
        email: true,
        walletAddress: true,
        licenseNumber: true,
        description: true,
        logoUrl: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!vendor) {
      res.status(404).json({ error: "Vendor not found" });
      return;
    }

    res.json({ vendor });
  } catch (error) {
    console.error("GetVendorProfile error:", error);
    res.status(500).json({ error: "Failed to fetch vendor profile" });
  }
}

/**
 * PUT /api/vendors/profile
 */
export async function updateVendorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.vendor) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { companyName, description, licenseNumber, logoUrl, walletAddress } = req.body;

    const updateData: Record<string, unknown> = {};
    if (companyName) updateData.companyName = companyName;
    if (description !== undefined) updateData.description = description;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (walletAddress !== undefined) updateData.walletAddress = walletAddress;

    await prisma.vendor.update({
      where: { id: req.vendor.id },
      data: updateData,
    });

    res.json({ message: "Vendor profile updated" });
  } catch (error) {
    console.error("UpdateVendorProfile error:", error);
    res.status(500).json({ error: "Failed to update vendor profile" });
  }
}

