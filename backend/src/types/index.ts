import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    walletAddress?: string | null;
  };
  vendor?: {
    id: string;
    email: string;
    companyName: string;
    isVerified: boolean;
  };
}

export interface HealthMetrics {
  steps: number;
  activeMinutes: number;
  sleepHours: number;
  restingHeartRate: number;
  age: number;
}

export interface ScoreWeights {
  steps: number;
  activity: number;
  sleep: number;
  heartRate: number;
}

export interface ScoreBreakdown {
  overallScore: number;
  stepsScore: number;
  activityScore: number;
  sleepScore: number;
  heartScore: number;
}

export interface WearableTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: Date;
}

