"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { useAppStore } from "@/store/store";
import api from "@/lib/api";

export default function SettingsPage() {
  const { user } = useAppStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.put("/auth/profile", { firstName, lastName, dateOfBirth: dateOfBirth || undefined });
      setMessage("Profile updated successfully");
    } catch {
      setMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
          {message && (
            <p className={`text-sm ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Wallet */}
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.walletAddress ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Connected:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {user.walletAddress}
              </code>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Connect your wallet to mint policies as NFTs
            </p>
          )}
          <ConnectWallet />
        </CardContent>
      </Card>
    </div>
  );
}

