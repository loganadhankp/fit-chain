"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, User, Wallet, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ConnectWallet } from "@/components/web3/connect-wallet";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/api";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({ firstName: "", lastName: "", dateOfBirth: "" });
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await api.put("/auth/profile", {
        firstName: profile.firstName || undefined,
        lastName: profile.lastName || undefined,
        dateOfBirth: profile.dateOfBirth || undefined,
      });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkWallet = async (address: string) => {
    if (user?.walletAddress === address) return;
    setLinking(true);
    try {
      await api.post("/auth/connect-wallet", { walletAddress: address });
      setUser({ ...user!, walletAddress: address });
      toast.success("Wallet linked to your account");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to link wallet";
      toast.error(msg);
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account and preferences</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={profile.dateOfBirth} onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))} />
            </div>
            <Button onClick={handleProfileSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Blockchain Wallet
            </CardTitle>
            <CardDescription>Connect and link your wallet for NFT policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.walletAddress && (
              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Wallet linked to your account</p>
                <p className="mt-1 font-mono text-xs text-green-600 dark:text-green-500">
                  {user.walletAddress}
                </p>
              </div>
            )}
            <Separator />
            <ConnectWallet onConnected={handleLinkWallet} />
            {linking && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Linking wallet...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account ID</span>
              <span className="font-mono text-xs">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member Since</span>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
