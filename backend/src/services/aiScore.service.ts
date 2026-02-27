/**
 * AI Score Service
 *
 * Wraps the HTTP call to the Python FastAPI AI microservice.
 * Graceful fallback: if the service is down, returns null so the
 * rule-based score still works.
 */

import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const TIMEOUT_MS = 5000;

export interface AIScoreInput {
  age: number;
  gender: string;
  bmi: number;
  smoker: boolean;
  alcohol_frequency: string;
  exercise_frequency: string;
  pre_existing_conditions_count: number;
  family_history_count: number;
  steps: number;
  active_minutes: number;
  sleep_hours: number;
  resting_heart_rate: number;
  calories_burned: number;
  distance_km: number;
}

export interface AIScoreResult {
  aiRiskScore: number;
  riskCategory: string;
  confidence: number;
}

/**
 * Call the AI microservice to get a predicted health risk score.
 * Returns null on failure (timeout, service down, etc.).
 */
export async function getAIScore(input: AIScoreInput): Promise<AIScoreResult | null> {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/predict`, input, {
      timeout: TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
    });

    const data = response.data;

    return {
      aiRiskScore: data.ai_risk_score,
      riskCategory: data.risk_category,
      confidence: data.confidence,
    };
  } catch (error) {
    // Graceful fallback – don't break the health score pipeline
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[AI Service] Prediction failed (non‑critical): ${msg}`);
    return null;
  }
}

/**
 * Check whether the AI service is reachable.
 */
export async function isAIServiceHealthy(): Promise<boolean> {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 2000 });
    return response.data?.status === "ok";
  } catch {
    return false;
  }
}

