import { create } from "zustand";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function vendorApi() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("healthchain_vendor_token")
      : null;

  return axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

interface Vendor {
  id: string;
  companyName: string;
  email: string;
  isVerified: boolean;
  walletAddress?: string | null;
  licenseNumber?: string | null;
  description?: string | null;
  logoUrl?: string | null;
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
  isActive: boolean;
  createdAt: string;
}

interface Application {
  id: string;
  policyNumber: string;
  status: string;
  basePremium: number;
  coverageAmount: number;
  initialHealthScore: number | null;
  currentHealthScore: number | null;
  healthScoreTrend: string | null;
  totalMetricDays: number;
  createdAt: string;
  reviewedAt: string | null;
  vendorNotes: string | null;
  rejectionReason: string | null;
  user: {
    id: string;
    email: string;
  };
  template: {
    planName: string;
    coverageTier: number;
    basePremium: number;
    coverageAmount: number;
  } | null;
  questionnaire: Record<string, unknown> | null;
}

interface VendorState {
  vendor: Vendor | null;
  token: string | null;
  templates: PolicyTemplate[];
  applications: Application[];

  login: (email: string, password: string) => Promise<void>;
  register: (data: { companyName: string; email: string; password: string; licenseNumber?: string; description?: string }) => Promise<void>;
  logout: () => void;
  loadVendor: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchApplications: (status?: string) => Promise<void>;
  createTemplate: (data: Partial<PolicyTemplate>) => Promise<void>;
  updateTemplate: (id: string, data: Partial<PolicyTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  approveApplication: (id: string, notes?: string, premium?: number) => Promise<void>;
  rejectApplication: (id: string, reason: string) => Promise<void>;
}

export const useVendorStore = create<VendorState>((set) => ({
  vendor: null,
  token:
    typeof window !== "undefined"
      ? localStorage.getItem("healthchain_vendor_token")
      : null,
  templates: [],
  applications: [],

  login: async (email, password) => {
    const res = await vendorApi().post("/vendors/login", { email, password });
    const { token, vendor } = res.data;
    localStorage.setItem("healthchain_vendor_token", token);
    set({ token, vendor });
  },

  register: async (data) => {
    const res = await vendorApi().post("/vendors/register", data);
    const { token, vendor } = res.data;
    localStorage.setItem("healthchain_vendor_token", token);
    set({ token, vendor });
  },

  logout: () => {
    localStorage.removeItem("healthchain_vendor_token");
    set({ token: null, vendor: null, templates: [], applications: [] });
  },

  loadVendor: async () => {
    try {
      const res = await vendorApi().get("/vendors/me");
      set({ vendor: res.data.vendor });
    } catch {
      set({ vendor: null, token: null });
      localStorage.removeItem("healthchain_vendor_token");
    }
  },

  fetchTemplates: async () => {
    try {
      const res = await vendorApi().get("/templates");
      set({ templates: res.data.templates });
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    }
  },

  fetchApplications: async (status) => {
    try {
      const params = status ? { status } : {};
      const res = await vendorApi().get("/vendor/applications", { params });
      set({ applications: res.data.applications });
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  },

  createTemplate: async (data) => {
    await vendorApi().post("/templates", data);
  },

  updateTemplate: async (id, data) => {
    await vendorApi().put(`/templates/${id}`, data);
  },

  deleteTemplate: async (id) => {
    await vendorApi().delete(`/templates/${id}`);
  },

  approveApplication: async (id, vendorNotes, basePremium) => {
    await vendorApi().post(`/vendor/applications/${id}/approve`, { vendorNotes, basePremium });
  },

  rejectApplication: async (id, rejectionReason) => {
    await vendorApi().post(`/vendor/applications/${id}/reject`, { rejectionReason });
  },
}));

