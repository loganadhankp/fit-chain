import { HealthMetrics, ScoreWeights, ScoreBreakdown } from "../types";

/**
 * Default weights for health score calculation.
 * Steps: 25%, Activity: 30%, Sleep: 25%, Heart Rate: 20%
 */
const DEFAULT_WEIGHTS: ScoreWeights = {
  steps: 0.25,
  activity: 0.30,
  sleep: 0.25,
  heartRate: 0.20,
};

/**
 * Calculate an overall health score (0-100) from individual metrics.
 */
export function calculateHealthScore(
  metrics: HealthMetrics,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  const stepsScore = calculateStepsScore(metrics.steps, metrics.age);
  const activityScore = calculateActivityScore(metrics.activeMinutes, metrics.age);
  const sleepScore = calculateSleepScore(metrics.sleepHours);
  const heartScore = calculateHeartRateScore(metrics.restingHeartRate, metrics.age);

  const overallScore =
    stepsScore * weights.steps +
    activityScore * weights.activity +
    sleepScore * weights.sleep +
    heartScore * weights.heartRate;

  return {
    overallScore: clamp(Math.round(overallScore)),
    stepsScore: clamp(Math.round(stepsScore)),
    activityScore: clamp(Math.round(activityScore)),
    sleepScore: clamp(Math.round(sleepScore)),
    heartScore: clamp(Math.round(heartScore)),
  };
}

// --------------- Individual Metric Scorers ---------------

/**
 * Score steps against an age-adjusted daily target.
 */
function calculateStepsScore(steps: number, age: number): number {
  const target = getStepsTarget(age);
  const ratio = steps / target;

  if (ratio >= 1.2) return 100;
  if (ratio >= 1.0) return 90 + (ratio - 1.0) * 50;
  if (ratio >= 0.7) return 60 + (ratio - 0.7) * 100;
  if (ratio >= 0.5) return 30 + (ratio - 0.5) * 150;
  return ratio * 60;
}

function getStepsTarget(age: number): number {
  if (age < 18) return 12000;
  if (age < 40) return 10000;
  if (age < 60) return 8000;
  return 6000;
}

/**
 * Score active minutes against age-adjusted WHO recommendation.
 */
function calculateActivityScore(activeMinutes: number, age: number): number {
  const target = age < 60 ? 30 : 20; // minutes per day
  const ratio = activeMinutes / target;

  if (ratio >= 2.0) return 100;
  if (ratio >= 1.5) return 90 + (ratio - 1.5) * 20;
  if (ratio >= 1.0) return 70 + (ratio - 1.0) * 40;
  if (ratio >= 0.5) return 40 + (ratio - 0.5) * 60;
  return ratio * 80;
}

/**
 * Score sleep duration. Optimal range: 7-9 hours.
 */
function calculateSleepScore(sleepHours: number): number {
  if (sleepHours >= 7 && sleepHours <= 9) return 100;
  if (sleepHours >= 6 && sleepHours < 7) return 80 + (sleepHours - 6) * 20;
  if (sleepHours > 9 && sleepHours <= 10) return 80 + (10 - sleepHours) * 20;
  if (sleepHours >= 5 && sleepHours < 6) return 50 + (sleepHours - 5) * 30;
  if (sleepHours > 10 && sleepHours <= 11) return 50 + (11 - sleepHours) * 30;
  return Math.max(0, 50 - Math.abs(sleepHours - 7.5) * 10);
}

/**
 * Score resting heart rate.
 * Lower resting HR (within safe range) indicates better cardiovascular fitness.
 */
function calculateHeartRateScore(restingHR: number, _age: number): number {
  const optimalLow = 60;
  const optimalHigh = 100;

  if (restingHR < optimalLow) return 100; // Athletic
  if (restingHR >= optimalLow && restingHR <= optimalHigh) {
    return 100 - ((restingHR - optimalLow) / (optimalHigh - optimalLow)) * 20;
  }
  if (restingHR <= 110) return 60;
  if (restingHR <= 120) return 40;
  return 20;
}

/**
 * Determine trend by comparing last 7 days average vs previous 7 days.
 */
export function determineTrend(
  recentScores: number[],
  previousScores: number[]
): "improving" | "stable" | "declining" {
  if (recentScores.length === 0 || previousScores.length === 0) return "stable";

  const recentAvg = average(recentScores);
  const previousAvg = average(previousScores);
  const diff = recentAvg - previousAvg;

  if (diff > 3) return "improving";
  if (diff < -3) return "declining";
  return "stable";
}

// --------------- Helpers ---------------

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function average(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

