import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthenticatedRequest } from "../types";
import { encrypt, decrypt } from "../lib/encryption";
import { syncFitbitData } from "../services/fitbit.service";

// Fitbit OAuth 2.0 configuration
const FITBIT_AUTH_URL = "https://www.fitbit.com/oauth2/authorize";
const FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token";
const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID || "";
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || "";
const FITBIT_REDIRECT_URI = process.env.FITBIT_REDIRECT_URI || "";

const GOOGLE_FIT_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_FIT_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_FIT_CLIENT_ID = process.env.GOOGLE_FIT_CLIENT_ID || "";
const GOOGLE_FIT_CLIENT_SECRET = process.env.GOOGLE_FIT_CLIENT_SECRET || "";
const GOOGLE_FIT_REDIRECT_URI = process.env.GOOGLE_FIT_REDIRECT_URI || "http://localhost:3000/dashboard/wearables/callback";

/**
 * GET /api/wearables/auth-url/:provider
 */
export async function getAuthUrl(req: AuthenticatedRequest, res: Response) {
  const { provider } = req.params;

  if (provider === "fitbit") {
    const scopes = "activity heartrate sleep profile";
    const url = `${FITBIT_AUTH_URL}?response_type=code&client_id=${FITBIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(FITBIT_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&expires_in=604800`;
    res.json({ authUrl: url, provider });
    return;
  }

  if (provider === "google_fit") {
    const scopes = "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.sleep.read";
    const state = encodeURIComponent(JSON.stringify({ provider: "google_fit" }));
    const url = `${GOOGLE_FIT_AUTH_URL}?response_type=code&client_id=${GOOGLE_FIT_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_FIT_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&state=${state}`;
    res.json({ authUrl: url, provider });
    return;
  }

  res.status(400).json({ error: `Unsupported provider: ${provider}` });
}

/**
 * POST /api/wearables/callback/:provider
 * Body: { code: string }
 */
export async function handleOAuthCallback(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    const { provider } = req.params;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    let accessToken: string;
    let refreshToken: string;
    let expiresAt: Date | undefined;

    if (provider === "fitbit") {
      const axios = (await import("axios")).default;
      const credentials = Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64");

      const tokenResponse = await axios.post(
        FITBIT_TOKEN_URL,
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: FITBIT_REDIRECT_URI,
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token;
      expiresAt = new Date(Date.now() + tokenResponse.data.expires_in * 1000);
    } else if (provider === "google_fit") {
      const axios = (await import("axios")).default;

      const tokenResponse = await axios.post(
        GOOGLE_FIT_TOKEN_URL,
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: GOOGLE_FIT_REDIRECT_URI,
          client_id: GOOGLE_FIT_CLIENT_ID,
          client_secret: GOOGLE_FIT_CLIENT_SECRET,
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      accessToken = tokenResponse.data.access_token;
      refreshToken = tokenResponse.data.refresh_token || "";
      expiresAt = new Date(Date.now() + tokenResponse.data.expires_in * 1000);
    } else {
      res.status(400).json({ error: `Unsupported provider: ${provider}` });
      return;
    }

    // Encrypt tokens before storing
    const accessEnc = encrypt(accessToken);
    const refreshEnc = encrypt(refreshToken);

    await prisma.wearableConnection.upsert({
      where: {
        userId_provider: { userId: req.user.id, provider },
      },
      update: {
        accessTokenEncrypted: accessEnc.encrypted,
        refreshTokenEncrypted: refreshEnc.encrypted,
        tokenExpiresAt: expiresAt,
        encryptionIv: accessEnc.iv,
        encryptionAuthTag: accessEnc.authTag,
        isActive: true,
      },
      create: {
        userId: req.user.id,
        provider,
        accessTokenEncrypted: accessEnc.encrypted,
        refreshTokenEncrypted: refreshEnc.encrypted,
        tokenExpiresAt: expiresAt,
        encryptionIv: accessEnc.iv,
        encryptionAuthTag: accessEnc.authTag,
        isActive: true,
      },
    });

    res.json({ message: `${provider} connected successfully` });
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({ error: "Failed to connect wearable" });
  }
}

/**
 * GET /api/wearables/connected
 */
export async function getConnectedWearables(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    const connections = await prisma.wearableConnection.findMany({
      where: { userId: req.user.id, isActive: true },
      select: {
        provider: true,
        lastSyncAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({ connections });
  } catch (error) {
    console.error("getConnectedWearables error:", error);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
}

/**
 * POST /api/wearables/sync/:provider
 */
export async function manualSync(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    const { provider } = req.params;

    const connection = await prisma.wearableConnection.findUnique({
      where: { userId_provider: { userId: req.user.id, provider } },
    });

    if (!connection || !connection.isActive) {
      res.status(404).json({ error: `${provider} is not connected` });
      return;
    }

    // Decrypt access token
    const accessToken = decrypt(
      connection.accessTokenEncrypted,
      connection.encryptionIv || "",
      connection.encryptionAuthTag || ""
    );

    if (provider === "fitbit") {
      await syncFitbitData(req.user.id, accessToken);
    } else {
      res.status(400).json({ error: `Sync not implemented for ${provider}` });
      return;
    }

    // Update last sync timestamp
    await prisma.wearableConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    res.json({ message: `${provider} data synced successfully` });
  } catch (error) {
    console.error("manualSync error:", error);
    res.status(500).json({ error: "Failed to sync data" });
  }
}

/**
 * DELETE /api/wearables/:provider
 */
export async function disconnectWearable(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    const { provider } = req.params;

    await prisma.wearableConnection.updateMany({
      where: { userId: req.user.id, provider },
      data: { isActive: false },
    });

    res.json({ message: `${provider} disconnected` });
  } catch (error) {
    console.error("disconnectWearable error:", error);
    res.status(500).json({ error: "Failed to disconnect" });
  }
}

/**
 * GET /api/wearables/status/:provider
 */
export async function getConnectionStatus(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }

    const { provider } = req.params;

    const connection = await prisma.wearableConnection.findUnique({
      where: { userId_provider: { userId: req.user.id, provider } },
      select: {
        isActive: true,
        lastSyncAt: true,
        tokenExpiresAt: true,
      },
    });

    if (!connection) {
      res.json({ connected: false, provider });
      return;
    }

    res.json({
      connected: connection.isActive,
      provider,
      lastSyncAt: connection.lastSyncAt,
      tokenExpired: connection.tokenExpiresAt
        ? connection.tokenExpiresAt < new Date()
        : false,
    });
  } catch (error) {
    console.error("getConnectionStatus error:", error);
    res.status(500).json({ error: "Failed to check status" });
  }
}

