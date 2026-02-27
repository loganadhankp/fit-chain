import { Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma";
import { generateToken } from "../middleware/auth";
import { AuthenticatedRequest } from "../types";
import { encrypt } from "../lib/encryption";

// --------------- Validation Schemas ---------------

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const connectWalletSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(), // ISO date string
});

// --------------- Handlers ---------------

export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Encrypt PII if provided
    let firstNameEncrypted: string | undefined;
    let lastNameEncrypted: string | undefined;
    let encryptionIv: string | undefined;
    let encryptionAuthTag: string | undefined;

    if (firstName || lastName) {
      const payload = JSON.stringify({ firstName, lastName });
      const enc = encrypt(payload);
      firstNameEncrypted = enc.encrypted;
      encryptionIv = enc.iv;
      encryptionAuthTag = enc.authTag;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstNameEncrypted,
        lastNameEncrypted,
        encryptionIv,
        encryptionAuthTag,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        walletAddress: true,
        dateOfBirth: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { firstName, lastName, dateOfBirth } = req.body;

    const updateData: Record<string, unknown> = {};

    if (firstName || lastName) {
      const payload = JSON.stringify({ firstName, lastName });
      const enc = encrypt(payload);
      updateData.firstNameEncrypted = enc.encrypted;
      updateData.encryptionIv = enc.iv;
      updateData.encryptionAuthTag = enc.authTag;
    }

    if (dateOfBirth) {
      updateData.dateOfBirth = new Date(dateOfBirth);
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    res.json({ message: "Profile updated" });
  } catch (error) {
    console.error("UpdateProfile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

export async function connectWallet(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { walletAddress } = req.body;

    // Check if wallet is already linked
    const existing = await prisma.user.findUnique({
      where: { walletAddress },
    });
    if (existing && existing.id !== req.user.id) {
      res.status(409).json({ error: "Wallet already linked to another account" });
      return;
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { walletAddress },
    });

    res.json({ message: "Wallet connected", walletAddress });
  } catch (error) {
    console.error("ConnectWallet error:", error);
    res.status(500).json({ error: "Failed to connect wallet" });
  }
}

