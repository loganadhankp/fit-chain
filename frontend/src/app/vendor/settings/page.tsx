"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Save, Loader2, Shield, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth-store";
import api from "@/lib/api";
import { toast } from "sonner";

export default function VendorSettingsPage() {
  const { vendor, setVendor } = useAuthStore();
  const [form, setForm] = useState({
    companyName: vendor?.companyName || "",
    description: vendor?.description || "",
    licenseNumber: vendor?.licenseNumber || "",
    logoUrl: vendor?.logoUrl || "",
    walletAddress: vendor?.walletAddress || "",
  });
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/vendors/profile", {
        companyName: form.companyName || undefined,
        description: form.description || undefined,
        licenseNumber: form.licenseNumber || undefined,
        logoUrl: form.logoUrl || undefined,
        walletAddress: form.walletAddress || undefined,
      });
      if (vendor) {
        setVendor({ ...vendor, ...form });
      }
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Vendor Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your vendor profile and account settings</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Company Profile
            </CardTitle>
            <CardDescription>Update your company information visible to users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="About your company..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} placeholder="INS-12345" />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input value={form.walletAddress} onChange={(e) => update("walletAddress", e.target.value)} placeholder="0x..." />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Verification Status</p>
                <p className="text-sm text-muted-foreground">
                  {vendor?.isVerified
                    ? "Your account is verified and you can create templates"
                    : "Your account is pending verification by admin"}
                </p>
              </div>
              {vendor?.isVerified ? (
                <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </Badge>
              ) : (
                <Badge className="gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
                  <Clock className="h-3 w-3" /> Pending
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor ID</span>
                <span className="font-mono text-xs">{vendor?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{vendor?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span>{vendor?.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
