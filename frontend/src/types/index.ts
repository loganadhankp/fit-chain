export interface User {
  id: string;
  email: string;
  role: string;
  walletAddress?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string;
}

export interface Vendor {
  id: string;
  companyName: string;
  email: string;
  walletAddress?: string | null;
  licenseNumber?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  isVerified: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user?: User;
  vendor?: Vendor;
}

export interface HealthScore {
  overallScore: number;
  stepsScore: number | null;
  activityScore: number | null;
  sleepScore: number | null;
  heartScore: number | null;
  trend: string | null;
  scoreDate?: string;
  syncedToBlockchain?: boolean;
  aiRiskScore: number | null;
  aiRiskCategory: string | null;
  aiConfidence: number | null;
}

export interface HealthMetric {
  id: string;
  userId: string;
  metricDate: string;
  steps: number | null;
  activeMinutes: number | null;
  distanceKm: number | null;
  caloriesBurned: number | null;
  sleepHours: number | null;
  restingHeartRate: number | null;
  weightKg: number | null;
  dataSource: string | null;
  createdAt: string;
}

export interface HealthSummary {
  avgSteps: number;
  avgActiveMinutes: number;
  avgSleepHours: number;
  avgHeartRate: number;
  totalDays: number;
}

export interface WearableConnection {
  provider: string;
  lastSyncAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface WearableStatus {
  connected: boolean;
  provider: string;
  lastSyncAt?: string | null;
  tokenExpired?: boolean;
}

export interface HealthQuestionnaire {
  id: string;
  userId: string;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  smoker: boolean;
  alcoholFrequency: string | null;
  exerciseFrequency: string | null;
  preExistingConditions: string[];
  familyHistory: string[];
  medications: string[];
  submittedAt: string;
}

export interface PolicyTemplate {
  id: string;
  vendorId: string;
  planName: string;
  description: string | null;
  basePremium: number;
  coverageAmount: number;
  coverageTier: number;
  policyType: string;
  minHealthScore: number;
  maxDiscountPercentage: number;
  durationMonths: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    isVerified: boolean;
  };
}

export interface InsurancePolicy {
  id: string;
  policyNumber: string;
  tokenId: number | null;
  basePremium: number;
  coverageAmount: number;
  coverageTier: number;
  policyType: string;
  status: string;
  startDate: string;
  endDate: string | null;
  healthScore: number;
  discountPercentage: number;
  currentPremium: number;
  blockchainTxHash: string | null;
  vendorName: string | null;
  vendorLogo: string | null;
  planName: string | null;
  initialHealthScore: number | null;
  vendorNotes: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface PolicyUpdate {
  id: string;
  policyId: string;
  healthScore: number;
  discountPercentage: number;
  newPremium: number;
  coverageTier: number;
  oracleTxHash: string | null;
  updatedAt: string;
}

export interface PolicyReadiness {
  questionnaireCompleted: boolean;
  wearableConnected: boolean;
  sufficientData: boolean;
  metricDays: number;
  daysNeeded: number;
  currentHealthScore: number | null;
  canApply: boolean;
}

export interface VendorApplication {
  id: string;
  userId: string;
  policyNumber: string;
  basePremium: number;
  coverageAmount: number;
  coverageTier: number;
  policyType: string;
  status: string;
  initialHealthScore: number | null;
  vendorNotes: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  currentHealthScore: number | null;
  healthScoreTrend: string | null;
  totalMetricDays: number;
  user?: {
    id: string;
    email: string;
    dateOfBirth: string | null;
  };
  template?: {
    planName: string;
    coverageTier: number;
    basePremium: number;
    coverageAmount: number;
  };
  questionnaire?: HealthQuestionnaire | null;
}

export const TIER_LABELS: Record<number, string> = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
};

export const TIER_COLORS: Record<number, string> = {
  1: "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-950",
  2: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
  3: "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950",
  4: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-950",
};

export const STATUS_COLORS: Record<string, string> = {
  pending_review: "text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950",
  approved: "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-950",
  active: "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950",
  paused: "text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-950",
  cancelled: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950",
  rejected: "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950",
};
