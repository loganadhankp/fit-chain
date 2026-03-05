import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

import cron from "node-cron";
import express from "express";
import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --------------- ABI (minimal) --------------- 
const NFT_ABI = [
  "function updateHealthScore(uint256 _tokenId, uint256 _newScore) external",
  "function policies(uint256) view returns (uint256 policyId, address policyHolder, uint256 basePremium, uint256 healthScore, uint256 discountPercentage, uint256 coverageTier, uint256 lastUpdated, bool isActive, string ipfsMetadataHash)",
];

// --------------- Setup ---------------
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || "";
const PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY || "";
const CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || "";

let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet;
let contract: ethers.Contract;

function initBlockchain() {
  if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
    console.warn("Blockchain config incomplete – oracle will run in dry-run mode");
    return false;
  }
  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, NFT_ABI, wallet);
  return true;
}

// --------------- Core logic ---------------

async function updateAllPolicies() {
  const blockchainReady = initBlockchain();

  const policies = await prisma.insurancePolicy.findMany({
    where: {
      status: "active",
      tokenId: { not: null },
    },
    include: { user: true },
  });

  console.log(`[Oracle] Found ${policies.length} active minted policies`);

  for (const policy of policies) {
    try {
      await updateSinglePolicy(policy, blockchainReady);
      await sleep(5000); // Prevent nonce collisions
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[Oracle] Failed to update policy ${policy.policyNumber}:`, msg);
      await prisma.oracleLog.create({
        data: { policyId: policy.id, status: "error", errorMessage: msg },
      });
    }
  }

  console.log("[Oracle] Update cycle complete");
}

async function updateSinglePolicy(
  policy: { id: string; policyNumber: string; tokenId: number | null; userId: string; basePremium: any },
  blockchainReady: boolean
) {
  if (!policy.tokenId) return;

  // Check 24-hour cooldown
  const lastUpdate = await prisma.policyUpdate.findFirst({
    where: { policyId: policy.id },
    orderBy: { updatedAt: "desc" },
  });

  if (lastUpdate) {
    const hoursSince = (Date.now() - lastUpdate.updatedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      console.log(`[Oracle] Skipping ${policy.policyNumber} – updated ${hoursSince.toFixed(1)}h ago`);
      return;
    }
  }

  // Get latest health score
  const latestScore = await prisma.healthScore.findFirst({
    where: { userId: policy.userId },
    orderBy: { scoreDate: "desc" },
  });

  if (!latestScore) {
    console.log(`[Oracle] No health score for ${policy.policyNumber}`);
    return;
  }

  // Check if score differs from last update
  if (lastUpdate && lastUpdate.healthScore === latestScore.overallScore) {
    console.log(`[Oracle] Score unchanged for ${policy.policyNumber}`);
    return;
  }

  console.log(
    `[Oracle] Updating ${policy.policyNumber}: score ${lastUpdate?.healthScore ?? "N/A"} → ${latestScore.overallScore}`
  );

  let txHash: string | null = null;

  if (blockchainReady && contract) {
    const tx = await contract.updateHealthScore(
      policy.tokenId,
      latestScore.overallScore,
      { gasLimit: 200000 }
    );
    console.log(`[Oracle] Tx submitted: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[Oracle] Confirmed in block ${receipt.blockNumber}`);
    txHash = tx.hash;
  } else {
    console.log(`[Oracle] Dry-run – would update token ${policy.tokenId} to score ${latestScore.overallScore}`);
  }

  // Persist update
  const discount = calculateDiscount(latestScore.overallScore);
  const basePremium = Number(policy.basePremium);
  const newPremium = basePremium * (1 - discount / 100);
  const tier = calculateTier(latestScore.overallScore);

  await prisma.policyUpdate.create({
    data: {
      policyId: policy.id,
      healthScore: latestScore.overallScore,
      discountPercentage: discount,
      newPremium,
      coverageTier: tier,
      oracleTxHash: txHash,
    },
  });

  // Mark score as synced
  if (txHash) {
    await prisma.healthScore.update({
      where: { id: latestScore.id },
      data: { syncedToBlockchain: true, blockchainTxHash: txHash },
    });
  }

  await prisma.oracleLog.create({
    data: {
      policyId: policy.id,
      status: "success",
      txHash,
    },
  });
}

// --------------- Helpers ---------------

function calculateDiscount(score: number): number {
  if (score >= 90) return 20;
  if (score >= 80) return 15;
  if (score >= 70) return 10;
  if (score >= 60) return 5;
  return 0;
}

function calculateTier(score: number): number {
  if (score >= 85) return 4;
  if (score >= 70) return 3;
  if (score >= 55) return 2;
  return 1;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --------------- Express endpoint for manual trigger ---------------

const app = express();
const PORT = process.env.ORACLE_PORT || 3002;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "oracle" });
});

app.post("/trigger", async (_req, res) => {
  console.log("[Oracle] Manual trigger received");
  try {
    await updateAllPolicies();
    res.json({ status: "ok", message: "Oracle update triggered" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ status: "error", message: msg });
  }
});

// --------------- Cron schedule ---------------

// Run daily at 3 AM
cron.schedule("0 3 * * *", async () => {
  console.log("[Oracle] Scheduled daily run starting...");
  await updateAllPolicies();
});

// --------------- Start ---------------

app.listen(PORT, () => {
  console.log(`[Oracle] Service running on http://localhost:${PORT}`);
  console.log("[Oracle] Cron scheduled: daily at 03:00");
  console.log(`[Oracle] Manual trigger: POST http://localhost:${PORT}/trigger`);
});

