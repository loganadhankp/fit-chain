import { create } from "zustand";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
  walletAddress?: string | null;
}

interface HealthScore {
  overallScore: number;
  stepsScore: number;
  activityScore: number;
  sleepScore: number;
  heartScore: number;
  trend: string;
  aiRiskScore: number | null;
  aiRiskCategory: string | null;
  aiConfidence: number | null;
}

interface Policy {
  id: string;
  policyNumber: string;
  tokenId?: number | null;
  basePremium: number;
  coverageAmount: number;
  coverageTier: number;
  policyType: string;
  status: string;
  healthScore: number;
  discountPercentage: number;
  currentPremium: number;
  blockchainTxHash?: string | null;
  startDate: string;
  createdAt: string;
  vendorName?: string | null;
  vendorLogo?: string | null;
  planName?: string | null;
  initialHealthScore?: number | null;
  vendorNotes?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
}

interface WearableConnection {
  provider: string;
  lastSyncAt: string | null;
  isActive: boolean;
}

interface Questionnaire {
  id: string;
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

interface PolicyTemplate {
  id: string;
  planName: string;
  description: string | null;
  basePremium: number;
  coverageAmount: number;
  coverageTier: number;
  policyType: string;
  minHealthScore: number;
  maxDiscountPercentage: number;
  durationMonths: number;
  vendor: {
    id: string;
    companyName: string;
    logoUrl: string | null;
  };
}

interface Readiness {
  questionnaireCompleted: boolean;
  wearableConnected: boolean;
  sufficientData: boolean;
  metricDays: number;
  daysNeeded: number;
  currentHealthScore: number | null;
  canApply: boolean;
}

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isLoading: boolean;

  // Health
  healthScore: HealthScore | null;
  policies: Policy[];
  wearables: WearableConnection[];

  // Questionnaire & Templates
  questionnaire: Questionnaire | null;
  templates: PolicyTemplate[];
  readiness: Readiness | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  fetchHealthScore: () => Promise<void>;
  fetchPolicies: () => Promise<void>;
  fetchWearables: () => Promise<void>;
  connectWallet: (address: string) => Promise<void>;
  fetchQuestionnaire: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchReadiness: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("healthchain_token") : null,
  isLoading: false,
  healthScore: null,
  policies: [],
  wearables: [],
  questionnaire: null,
  templates: [],
  readiness: null,

  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;
    localStorage.setItem("healthchain_token", token);
    set({ token, user });
  },

  register: async (email, password, firstName, lastName) => {
    const res = await api.post("/auth/register", { email, password, firstName, lastName });
    const { token, user } = res.data;
    localStorage.setItem("healthchain_token", token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("healthchain_token");
    set({
      token: null,
      user: null,
      healthScore: null,
      policies: [],
      wearables: [],
      questionnaire: null,
      templates: [],
      readiness: null,
    });
  },

  loadUser: async () => {
    try {
      const res = await api.get("/auth/me");
      set({ user: res.data.user });
    } catch {
      set({ user: null, token: null });
      localStorage.removeItem("healthchain_token");
    }
  },

  fetchHealthScore: async () => {
    try {
      const res = await api.get("/health/score");
      set({ healthScore: res.data });
    } catch (err) {
      console.error("Failed to fetch health score:", err);
    }
  },

  fetchPolicies: async () => {
    try {
      const res = await api.get("/policies");
      set({ policies: res.data.policies });
    } catch (err) {
      console.error("Failed to fetch policies:", err);
    }
  },

  fetchWearables: async () => {
    try {
      const res = await api.get("/wearables/connected");
      set({ wearables: res.data.connections });
    } catch (err) {
      console.error("Failed to fetch wearables:", err);
    }
  },

  connectWallet: async (address) => {
    await api.post("/auth/connect-wallet", { walletAddress: address });
    const user = get().user;
    if (user) {
      set({ user: { ...user, walletAddress: address } });
    }
  },

  fetchQuestionnaire: async () => {
    try {
      const res = await api.get("/questionnaire");
      set({ questionnaire: res.data.questionnaire });
    } catch {
      set({ questionnaire: null });
    }
  },

  fetchTemplates: async () => {
    try {
      const res = await api.get("/templates/browse");
      set({ templates: res.data.templates });
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  },

  fetchReadiness: async () => {
    try {
      const res = await api.get("/policies/readiness");
      set({ readiness: res.data });
    } catch (err) {
      console.error("Failed to fetch readiness:", err);
    }
  },
}));
