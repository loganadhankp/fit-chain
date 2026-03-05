"use client";

import { motion } from "framer-motion";
import { Footprints, Timer, Moon, HeartPulse, Shield, ArrowRight, Watch, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HealthScoreGauge } from "@/components/dashboard/health-score-gauge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useHealthScore, useHealthSummary } from "@/hooks/useHealthData";
import { usePolicies, usePolicyReadiness } from "@/hooks/usePolicies";
import { TIER_LABELS, TIER_COLORS, STATUS_COLORS } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: score, isLoading: scoreLoading } = useHealthScore();
  const { data: summary, isLoading: summaryLoading } = useHealthSummary();
  const { data: policiesData } = usePolicies();
  const { data: readiness } = usePolicyReadiness();

  const policies = policiesData?.policies || [];
  const activePolicy = policies.find((p) => p.status === "active");

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your health insurance overview at a glance</p>
      </motion.div>

      {/* Readiness Banner */}
      {readiness && !readiness.canApply && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Complete your setup to apply for insurance</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {!readiness.questionnaireCompleted && (
                    <Badge variant="outline" className="gap-1">
                      <ClipboardList className="h-3 w-3" /> Questionnaire
                    </Badge>
                  )}
                  {!readiness.wearableConnected && (
                    <Badge variant="outline" className="gap-1">
                      <Watch className="h-3 w-3" /> Connect Wearable
                    </Badge>
                  )}
                  {!readiness.sufficientData && (
                    <Badge variant="outline" className="gap-1">
                      {readiness.daysNeeded} more days of data needed
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!readiness.questionnaireCompleted && (
                  <Button size="sm" asChild>
                    <Link href="/dashboard/questionnaire">Fill Questionnaire</Link>
                  </Button>
                )}
                {!readiness.wearableConnected && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/dashboard/wearables">Connect Device</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Health Score + Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="flex h-full items-center justify-center py-8">
            <CardContent>
              {scoreLoading ? (
                <div className="flex h-[180px] w-[180px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <HealthScoreGauge
                  score={score?.overallScore ?? 0}
                  trend={score?.trend}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatsCard
            title="Avg Steps"
            value={summaryLoading ? "..." : (summary?.avgSteps ?? 0).toLocaleString()}
            subtitle="7-day average"
            icon={Footprints}
            color="text-blue-600 dark:text-blue-400"
            delay={0.15}
          />
          <StatsCard
            title="Active Minutes"
            value={summaryLoading ? "..." : `${summary?.avgActiveMinutes ?? 0} min`}
            subtitle="7-day average"
            icon={Timer}
            color="text-orange-600 dark:text-orange-400"
            delay={0.2}
          />
          <StatsCard
            title="Sleep"
            value={summaryLoading ? "..." : `${summary?.avgSleepHours ?? 0} hrs`}
            subtitle="7-day average"
            icon={Moon}
            color="text-violet-600 dark:text-violet-400"
            delay={0.25}
          />
          <StatsCard
            title="Heart Rate"
            value={summaryLoading ? "..." : `${summary?.avgHeartRate ?? 0} bpm`}
            subtitle="7-day average"
            icon={HeartPulse}
            color="text-red-600 dark:text-red-400"
            delay={0.3}
          />
        </div>
      </div>

      {/* AI Score + Policy */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Risk Score */}
        {score?.aiRiskScore != null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Risk Assessment</CardTitle>
                <CardDescription>ML-powered health risk prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <HealthScoreGauge score={score.aiRiskScore} size={120} label="AI Score" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Category:</span>
                      <Badge variant={score.aiRiskCategory === "low" ? "default" : "secondary"}>
                        {score.aiRiskCategory}
                      </Badge>
                    </div>
                    {score.aiConfidence != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Confidence:</span>
                        <span className="text-sm font-medium">{(score.aiConfidence * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Policy Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  <Shield className="mr-2 inline h-5 w-5 text-primary" />
                  {activePolicy ? "Active Policy" : "No Active Policy"}
                </CardTitle>
                <CardDescription>
                  {activePolicy ? activePolicy.planName : "Browse plans and apply for coverage"}
                </CardDescription>
              </div>
              {activePolicy && (
                <Badge className={cn(TIER_COLORS[activePolicy.coverageTier])}>
                  {TIER_LABELS[activePolicy.coverageTier]}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {activePolicy ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Policy #</span>
                    <span className="font-mono">{activePolicy.policyNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premium</span>
                    <span className="font-medium">${activePolicy.currentPremium.toFixed(2)}/mo</span>
                  </div>
                  {activePolicy.discountPercentage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -{activePolicy.discountPercentage}%
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium">${activePolicy.coverageAmount.toLocaleString()}</span>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                    <Link href={`/dashboard/policies`}>
                      View Details <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Complete your health profile and start tracking to apply for an insurance policy.
                  </p>
                  <Button size="sm" asChild>
                    <Link href="/dashboard/plans">
                      Browse Plans <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Policies */}
        {policies.filter((p) => p.status === "pending_review" || p.status === "approved").length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Policies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {policies
                  .filter((p) => p.status === "pending_review" || p.status === "approved")
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{p.planName}</p>
                        <p className="text-xs text-muted-foreground">{p.policyNumber}</p>
                      </div>
                      <Badge className={cn(STATUS_COLORS[p.status])}>{p.status.replace("_", " ")}</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
