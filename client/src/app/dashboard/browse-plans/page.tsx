"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/store";
import api from "@/lib/api";
import { Shield, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const TIER_LABELS: Record<number, string> = { 1: "Bronze", 2: "Silver", 3: "Gold", 4: "Platinum" };
const TIER_COLORS: Record<number, string> = {
  1: "bg-amber-100 text-amber-800",
  2: "bg-gray-100 text-gray-700",
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-purple-100 text-purple-800",
};

export default function BrowsePlansPage() {
  const { templates, fetchTemplates, readiness, fetchReadiness } = useAppStore();
  const [applying, setApplying] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [filterTier, setFilterTier] = useState<number | null>(null);

  useEffect(() => {
    fetchTemplates();
    fetchReadiness();
  }, [fetchTemplates, fetchReadiness]);

  const filtered = filterTier ? templates.filter((t) => t.coverageTier === filterTier) : templates;

  const handleApply = async (templateId: string) => {
    if (!readiness?.canApply) return;

    setApplying(templateId);
    try {
      await api.post("/policies/apply", { templateId });
      setAppliedIds((prev) => new Set([...Array.from(prev), templateId]));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; detail?: string } } };
      alert(axiosErr.response?.data?.detail || axiosErr.response?.data?.error || "Application failed");
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Insurance Plans</h1>
        <p className="text-gray-500 mt-1">
          Compare plans from verified insurance providers
        </p>
      </div>

      {/* Readiness check */}
      {readiness && !readiness.canApply && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800">
                  Complete these steps before applying
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  {!readiness.questionnaireCompleted && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      <Link href="/dashboard/questionnaire" className="underline">
                        Complete your health questionnaire
                      </Link>
                    </li>
                  )}
                  {!readiness.wearableConnected && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      <Link href="/dashboard/wearables" className="underline">
                        Connect a wearable device
                      </Link>
                    </li>
                  )}
                  {!readiness.sufficientData && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      {readiness.daysNeeded} more day(s) of wearable data needed
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {readiness?.canApply && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <span className="text-sm text-green-800">
              You&apos;re ready to apply! Your current health score is{" "}
              <strong>{readiness.currentHealthScore}</strong>.
            </span>
          </CardContent>
        </Card>
      )}

      {/* Tier filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterTier === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterTier(null)}
        >
          All Plans
        </Button>
        {[1, 2, 3, 4].map((tier) => (
          <Button
            key={tier}
            variant={filterTier === tier ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterTier(tier)}
          >
            {TIER_LABELS[tier]}
          </Button>
        ))}
      </div>

      {/* Template grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No plans available. Check back later.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((template) => {
            const eligible =
              readiness?.currentHealthScore != null &&
              readiness.currentHealthScore >= template.minHealthScore;
            const applied = appliedIds.has(template.id);

            return (
              <Card key={template.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={TIER_COLORS[template.coverageTier]}>
                      {TIER_LABELS[template.coverageTier]}
                    </Badge>
                    {template.minHealthScore > 0 && (
                      <span className="text-xs text-gray-400">
                        Min score: {template.minHealthScore}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{template.planName}</CardTitle>
                  <p className="text-sm text-gray-500">{template.vendor.companyName}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {template.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Monthly Premium</span>
                      <span className="font-semibold">${template.basePremium}/mo</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Coverage</span>
                      <span className="font-semibold">
                        ${template.coverageAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Max Discount</span>
                      <span className="font-semibold text-green-600">
                        Up to {template.maxDiscountPercentage}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration</span>
                      <span>{template.durationMonths} months</span>
                    </div>
                  </div>

                  {applied ? (
                    <Button disabled className="w-full bg-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Application Submitted
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={!readiness?.canApply || !eligible || applying === template.id}
                      onClick={() => handleApply(template.id)}
                    >
                      {applying === template.id ? (
                        "Applying..."
                      ) : !eligible && readiness?.canApply ? (
                        "Score too low"
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Apply Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

