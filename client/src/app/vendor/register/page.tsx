"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useVendorStore } from "@/store/vendorStore";
import { Building2 } from "lucide-react";

export default function VendorRegisterPage() {
  const router = useRouter();
  const vendorRegister = useVendorStore((s) => s.register);
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
    licenseNumber: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await vendorRegister({
        companyName: form.companyName,
        email: form.email,
        password: form.password,
        licenseNumber: form.licenseNumber || undefined,
        description: form.description || undefined,
      });
      router.push("/vendor/dashboard");
    } catch {
      setError("Registration failed. Email may already be taken.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 rounded-full bg-indigo-100 p-3 w-fit">
            <Building2 className="h-8 w-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl">Register Your Company</CardTitle>
          <CardDescription>
            Create a vendor account to offer insurance plans on HealthChain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="Acme Insurance Co."
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Company Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@company.io"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                placeholder="INS-2024-XXX"
                value={form.licenseNumber}
                onChange={(e) => update("licenseNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Company Description</Label>
              <textarea
                id="description"
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Brief description of your company..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/vendor/login" className="text-indigo-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

