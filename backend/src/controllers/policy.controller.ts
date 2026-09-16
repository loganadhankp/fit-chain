import { Response } from "express";
import { z } from "zod";
import { ethers } from "ethers";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../types";

// Read ABI from blockchain build artifacts (copied at build time or imported)
// For now we inline the minimal ABI we need
const NFT_ABI = [
  "function mintPolicy(address _to, uint256 _basePremium, string memory _ipfsHash) external returns (uint256)",
  "function policies(uint256) view returns (uint256 policyId, address policyHolder, uint256 basePremium, uint256 healthScore, uint256 discountPercentage, uint256 coverageTier, uint256 lastUpdated, bool isActive, string ipfsMetadataHash)",
  "function getCurrentPremium(uint256 _tokenId) view returns (uint256)",
  "function getUserPolicies(address _user) view returns (uint256[])",
  "event PolicyMinted(uint256 indexed tokenId, address indexed holder, uint256 basePremium)",
];

// --------------- Constants ---------------

const MIN_WEARABLE_DAYS = 7;

// --------------- Validation ---------------

export const applyPolicySchema = z.object({
  templateId: z.string().uuid("Invalid template ID"),
});

// --------------- Helpers ---------------

function getContract() {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL;
  const privateKey = process.env.ORACLE_PRIVATE_KEY;
  const contractAddress = process.env.NFT_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    throw new Error("Blockchain configuration missing");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(contractAddress, NFT_ABI, wallet);
}

function generatePolicyNumber(): string {
  const prefix = "HC";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// --------------- Handlers ---------------

/**
 * POST /api/policies/apply
 * User applies for a policy by choosing a vendor's template.
 * Prerequisites:
 *   1. Health questionnaire must be submitted
 *   2. At least one wearable connected
 *   3. At least 7 days of health metric data
 */
export async function applyForPolicy(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { templateId } = req.body;

    // 1. Validate the template exists and belongs to a verified vendor
    const template = await prisma.policyTemplate.findFirst({
      where: {
        id: templateId,
        isActive: true,
        vendor: { isVerified: true },
      },
      include: { vendor: { select: { id: true, companyName: true } } },
    });

    if (!template) {
      res.status(404).json({ error: "Policy plan not found or not available" });
      return;
    }

    // 2. Validate health questionnaire exists
    const questionnaire = await prisma.healthQuestionnaire.findFirst({
      where: { userId: req.user.id },
      orderBy: { submittedAt: "desc" },
    });

    if (!questionnaire) {
      res.status(400).json({
        error: "Health questionnaire required",
        detail: "Please complete your health questionnaire before applying for a policy.",
        action: "questionnaire",
      });
      return;
    }

    // 3. Validate wearable connected
    const wearable = await prisma.wearableConnection.findFirst({
      where: { userId: req.user.id, isActive: true },
    });

    if (!wearable) {
      res.status(400).json({
        error: "Wearable device required",
        detail: "Please connect at least one wearable device before applying.",
        action: "wearable",
      });
      return;
    }

    // 4. Validate minimum days of health data
    const metricCount = await prisma.healthMetric.count({
      where: { userId: req.user.id },
    });

    if (metricCount < MIN_WEARABLE_DAYS) {
      res.status(400).json({
        error: "Insufficient health data",
        detail: `At least ${MIN_WEARABLE_DAYS} days of wearable data required. You have ${metricCount} days.`,
        action: "wait",
        daysNeeded: MIN_WEARABLE_DAYS - metricCount,
      });
      return;
    }

    // 5. Check minimum health score eligibility
    const latestScore = await prisma.healthScore.findFirst({
      where: { userId: req.user.id },
      orderBy: { scoreDate: "desc" },
    });

    const currentScore = latestScore?.overallScore ?? 0;
    if (currentScore < template.minHealthScore) {
      res.status(400).json({
        error: "Health score too low",
        detail: `This plan requires a minimum health score of ${template.minHealthScore}. Your current score is ${currentScore}.`,
        action: "improve_score",
      });
      return;
    }

    // 6. Check for duplicate pending application to same template
    const existingApplication = await prisma.insurancePolicy.findFirst({
      where: {
        userId: req.user.id,
        templateId,
        status: { in: ["pending_review", "approved"] },
      },
    });

    if (existingApplication) {
      res.status(409).json({
        error: "Duplicate application",
        detail: "You already have a pending or approved application for this plan.",
      });
      return;
    }

    // 7. Create the policy application
    const policy = await prisma.insurancePolicy.create({
      data: {
        userId: req.user.id,
        vendorId: template.vendorId,
        templateId: template.id,
        questionnaireId: questionnaire.id,
        policyNumber: generatePolicyNumber(),
        basePremium: template.basePremium,
        coverageAmount: template.coverageAmount,
        coverageTier: template.coverageTier,
        policyType: template.policyType,
        startDate: new Date(),
        status: "pending_review",
        initialHealthScore: currentScore,
      },
    });

    res.status(201).json({
      message: "Application submitted for vendor review",
      policy: {
        id: policy.id,
        policyNumber: policy.policyNumber,
        status: policy.status,
        vendorName: template.vendor.companyName,
        planName: template.planName,
        basePremium: Number(template.basePremium),
        coverageAmount: Number(template.coverageAmount),
        initialHealthScore: currentScore,
      },
    });
  } catch (error) {
    console.error("applyForPolicy error:", error);
    res.status(500).json({ error: "Failed to create policy application" });
  }
}

/**
 * GET /api/policies/readiness — Check if user can apply for policies
 */
export async function checkReadiness(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const [questionnaire, wearable, metricCount, latestScore] = await Promise.all([
      prisma.healthQuestionnaire.findFirst({ where: { userId: req.user.id } }),
      prisma.wearableConnection.findFirst({ where: { userId: req.user.id, isActive: true } }),
      prisma.healthMetric.count({ where: { userId: req.user.id } }),
      prisma.healthScore.findFirst({ where: { userId: req.user.id }, orderBy: { scoreDate: "desc" } }),
    ]);

    const checks = {
      questionnaireCompleted: !!questionnaire,
      wearableConnected: !!wearable,
      sufficientData: metricCount >= MIN_WEARABLE_DAYS,
      metricDays: metricCount,
      daysNeeded: Math.max(0, MIN_WEARABLE_DAYS - metricCount),
      currentHealthScore: latestScore?.overallScore ?? null,
      canApply: !!questionnaire && !!wearable && metricCount >= MIN_WEARABLE_DAYS,
    };

    res.json(checks);
  } catch (error) {
    console.error("checkReadiness error:", error);
    res.status(500).json({ error: "Failed to check readiness" });
  }
}

/**
 * GET /api/policies
 */
export async function getUserPolicies(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const policies = await prisma.insurancePolicy.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        policyUpdates: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        vendor: {
          select: { companyName: true, logoUrl: true },
        },
        template: {
          select: { planName: true },
        },
      },
    });

    // Enrich with on-chain data if available
    const enriched = policies.map((p) => {
      const latestUpdate = p.policyUpdates[0];
      return {
        id: p.id,
        policyNumber: p.policyNumber,
        tokenId: p.tokenId,
        basePremium: Number(p.basePremium),
        coverageAmount: Number(p.coverageAmount),
        coverageTier: latestUpdate?.coverageTier || p.coverageTier,
        policyType: p.policyType,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        healthScore: latestUpdate?.healthScore || p.initialHealthScore || 0,
        discountPercentage: Number(latestUpdate?.discountPercentage || 0),
        currentPremium: Number(latestUpdate?.newPremium || p.basePremium),
        blockchainTxHash: p.blockchainTxHash,
        vendorName: p.vendor?.companyName ?? null,
        vendorLogo: p.vendor?.logoUrl ?? null,
        planName: p.template?.planName ?? null,
        initialHealthScore: p.initialHealthScore,
        vendorNotes: p.vendorNotes,
        rejectionReason: p.rejectionReason,
        reviewedAt: p.reviewedAt,
        createdAt: p.createdAt,
      };
    });

    res.json({ policies: enriched });
  } catch (error) {
    console.error("getUserPolicies error:", error);
    res.status(500).json({ error: "Failed to fetch policies" });
  }
}

/**
 * GET /api/policies/:policyId
 */
export async function getPolicyDetails(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const policy = await prisma.insurancePolicy.findFirst({
      where: { id: req.params.policyId, userId: req.user.id },
      include: {
        policyUpdates: { orderBy: { updatedAt: "desc" }, take: 10 },
        vendor: { select: { companyName: true, logoUrl: true } },
        template: { select: { planName: true, description: true } },
        questionnaire: true,
      },
    });

    if (!policy) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }

    res.json({ policy });
  } catch (error) {
    console.error("getPolicyDetails error:", error);
    res.status(500).json({ error: "Failed to fetch policy details" });
  }
}

/**
 * POST /api/policies/:policyId/mint
 * Mints the policy as an NFT on the blockchain.
 * Policy must be in "approved" status.
 */
export async function mintPolicyNFT(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const policy = await prisma.insurancePolicy.findFirst({
      where: { id: req.params.policyId, userId: req.user.id },
    });

    if (!policy) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }

    if (policy.status !== "approved") {
      res.status(400).json({ error: "Policy must be approved by the vendor before minting" });
      return;
    }

    if (policy.tokenId) {
      res.status(400).json({ error: "Policy already minted" });
      return;
    }

    // Fetch fresh wallet address from database (JWT may have stale data)
    const freshUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { walletAddress: true },
    });

    const walletAddress = freshUser?.walletAddress;
    if (!walletAddress) {
      res.status(400).json({ error: "Wallet not connected. Please connect your wallet first." });
      return;
    }

    const contract = getContract();

    const basePremiumWei = ethers.parseEther(policy.basePremium.toString());
    const ipfsHash = policy.ipfsHash || "QmPlaceholder"; // TODO: Upload actual document to IPFS

    const tx = await contract.mintPolicy(walletAddress, basePremiumWei, ipfsHash);
    const receipt = await tx.wait();

    // Parse the PolicyMinted event to get the tokenId
    const mintEvent = receipt.logs.find((log: { topics: string[]; data: string }) => {
      try {
        const parsed = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
        return parsed?.name === "PolicyMinted";
      } catch {
        return false;
      }
    });

    let tokenId: number | null = null;
    if (mintEvent) {
      const parsed = contract.interface.parseLog({ topics: mintEvent.topics as string[], data: mintEvent.data });
      tokenId = Number(parsed?.args[0]);
    }

    // Update policy in database
    await prisma.insurancePolicy.update({
      where: { id: policy.id },
      data: {
        tokenId,
        blockchainTxHash: tx.hash,
        status: "active",
      },
    });

    res.json({
      message: "Policy minted successfully",
      tokenId,
      txHash: tx.hash,
    });
  } catch (error) {
    console.error("mintPolicyNFT error:", error);
    res.status(500).json({ error: "Failed to mint policy NFT" });
  }
}

/**
 * GET /api/policies/:policyId/premium
 */
export async function calculateCurrentPremium(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const policy = await prisma.insurancePolicy.findFirst({
      where: { id: req.params.policyId, userId: req.user.id },
    });

    if (!policy) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }

    if (policy.tokenId) {
      // Fetch from blockchain
      try {
        const contract = getContract();
        const premiumWei = await contract.getCurrentPremium(policy.tokenId);
        const premiumEth = ethers.formatEther(premiumWei);

        res.json({
          basePremium: Number(policy.basePremium),
          currentPremium: parseFloat(premiumEth),
          source: "blockchain",
        });
        return;
      } catch {
        // Fallback to database
      }
    }

    // Calculate from database
    const latestUpdate = await prisma.policyUpdate.findFirst({
      where: { policyId: policy.id },
      orderBy: { updatedAt: "desc" },
    });

    res.json({
      basePremium: Number(policy.basePremium),
      currentPremium: latestUpdate ? Number(latestUpdate.newPremium) : Number(policy.basePremium),
      discountPercentage: latestUpdate ? Number(latestUpdate.discountPercentage) : 0,
      source: "database",
    });
  } catch (error) {
    console.error("calculateCurrentPremium error:", error);
    res.status(500).json({ error: "Failed to calculate premium" });
  }
}

/**
 * GET /api/policies/:policyId/history
 */
export async function getPolicyUpdateHistory(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const policy = await prisma.insurancePolicy.findFirst({
      where: { id: req.params.policyId, userId: req.user.id },
    });

    if (!policy) {
      res.status(404).json({ error: "Policy not found" });
      return;
    }

    const updates = await prisma.policyUpdate.findMany({
      where: { policyId: policy.id },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ updates });
  } catch (error) {
    console.error("getPolicyUpdateHistory error:", error);
    res.status(500).json({ error: "Failed to fetch policy history" });
  }
}
