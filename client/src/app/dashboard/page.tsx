"use client";

import { useEffect } from "react";
import { Footprints, Timer, Moon, HeartPulse } from "lucide-react";
import { useAppStore } from "@/store/store";
import { HealthScoreGauge } from "@/components/dashboard/HealthScoreGauge";
import { AIScoreGauge } from "@/components/dashboard/AIScoreGauge";
import { PolicyCard } from "@/components/dashboard/PolicyCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import api from "@/lib/api";
import { useState } from "react";

interface HealthSummary {
  avgSteps: number;
  avgActiveMinutes: number;
  avgSleepHours: number;
  avgHeartRate: number;
  totalDays: number;
}

export default function DashboardPage() {
  const { user, healthScore, policies, fetchHealthScore, fetchPolicies } = useAppStore();
  const [summary, setSummary] = useState<HealthSummary | null>(null);

  useEffect(() => {
    fetchHealthScore();
    fetchPolicies();
    api.get("/health/summary").then((r) => setSummary(r.data)).catch(() => {});
  }, [fetchHealthScore, fetchPolicies]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back{user?.email ? `, ${user.email}` : ""}
          </p>
        </div>
        <ConnectWallet />
      </div>

      {/* Health Scores (Rule-based + AI) + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Rule-based score */}
        <div className="lg:col-span-1">
          <HealthScoreGauge
            score={healthScore?.overallScore || 0}
            trend={healthScore?.trend}
          />
        </div>
        {/* AI-based score */}
        <div className="lg:col-span-1">
          <AIScoreGauge
            score={healthScore?.aiRiskScore ?? null}
            riskCategory={healthScore?.aiRiskCategory ?? null}
            confidence={healthScore?.aiConfidence ?? null}
          />
        </div>
        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Avg Steps"
            value={summary?.avgSteps?.toLocaleString() || "—"}
            subtitle="Last 7 days"
            icon={Footprints}
          />
          <StatsCard
            title="Active Minutes"
            value={summary?.avgActiveMinutes || "—"}
            subtitle="Daily average"
            icon={Timer}
          />
          <StatsCard
            title="Sleep"
            value={summary?.avgSleepHours ? `${summary.avgSleepHours}h` : "—"}
            subtitle="Daily average"
            icon={Moon}
          />
          <StatsCard
            title="Heart Rate"
            value={summary?.avgHeartRate ? `${summary.avgHeartRate} bpm` : "—"}
            subtitle="Resting average"
            icon={HeartPulse}
          />
        </div>
      </div>

      {/* Policies */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Policies</h2>
        {policies.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
            <p>You don&apos;t have any policies yet.</p>
            <p className="text-sm mt-1">
              Apply for a policy in the{" "}
              <a href="/dashboard/policy" className="text-blue-600 hover:underline">
                Policies
              </a>{" "}
              section.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((p) => (
              <PolicyCard key={p.id} policy={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

