import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Vendor } from "@/types";

interface AuthState {
  token: string | null;
  user: User | null;
  vendor: Vendor | null;
  isAuthenticated: boolean;
  isVendor: boolean;

  setAuth: (token: string, user: User) => void;
  setVendorAuth: (token: string, vendor: Vendor) => void;
  setUser: (user: User) => void;
  setVendor: (vendor: Vendor) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      vendor: null,
      isAuthenticated: false,
      isVendor: false,

      setAuth: (token, user) =>
        set({ token, user, vendor: null, isAuthenticated: true, isVendor: false }),

      setVendorAuth: (token, vendor) =>
        set({ token, vendor, user: null, isAuthenticated: true, isVendor: true }),

      setUser: (user) => set({ user }),
      setVendor: (vendor) => set({ vendor }),

      logout: () =>
        set({ token: null, user: null, vendor: null, isAuthenticated: false, isVendor: false }),
    }),
    { name: "healthchain-auth" }
  )
);
