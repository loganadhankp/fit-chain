"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Shield, Star, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrowseTemplates, useApplyPolicy, usePolicyReadiness } from "@/hooks/usePolicies";
import { TIER_LABELS, TIER_COLORS } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function BrowsePlansPage() {
  const [filters, setFilters] = useState<{ tier?: string; type?: string }>({});
  const { data, isLoading } = useBrowseTemplates(filters);
  const { data: readiness } = usePolicyReadiness();
  const applyMutation = useApplyPolicy();

  const templates = data?.templates || [];

  const handleApply = (templateId: string) => {
    if (!readiness?.canApply) {
      toast.error("Complete your profile first", { description: "You need to fill questionnaire, connect a wearable, and have 7+ days of data." });
      return;
    }
    applyMutation.mutate(templateId, {
      onSuccess: (data) => toast.success(data.message || "Application submitted!"),
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.detail
          || (err as { response?: { data?: { error?: string } } })?.response?.data?.error
          || "Failed to apply";
        toast.error(msg);
      },
    });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Browse Insurance Plans</h1>
        <p className="mt-1 text-muted-foreground">Find the perfect coverage from verified insurance vendors</p>
      </motion.div>

      {/* Readiness Check */}
      {readiness && !readiness.canApply && (
        <Card className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-400">Complete your setup to apply</p>
              <div className="mt-1 flex flex-wrap gap-2 text-sm">
                {!readiness.questionnaireCompleted && (
                  <Link href="/dashboard/questionnaire" className="text-primary underline">Fill questionnaire</Link>
                )}
                {!readiness.wearableConnected && (
                  <Link href="/dashboard/wearables" className="text-primary underline">Connect wearable</Link>
                )}
                {!readiness.sufficientData && (
                  <span className="text-muted-foreground">{readiness.daysNeeded} more days of data needed</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.tier || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, tier: v === "all" ? undefined : v }))}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Tiers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="1">Bronze</SelectItem>
            <SelectItem value="2">Silver</SelectItem>
            <SelectItem value="3">Gold</SelectItem>
            <SelectItem value="4">Platinum</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.type || "all"} onValueChange={(v) => setFilters((p) => ({ ...p, type: v === "all" ? undefined : v }))}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="health">Health</SelectItem>
            <SelectItem value="life">Life</SelectItem>
            <SelectItem value="critical_illness">Critical Illness</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No plans available matching your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="flex h-full flex-col transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={cn(TIER_COLORS[t.coverageTier])}>
                      {TIER_LABELS[t.coverageTier]}
                    </Badge>
                    <Badge variant="outline">{t.policyType}</Badge>
                  </div>
                  <CardTitle className="mt-2">{t.planName}</CardTitle>
                  <CardDescription>{t.description || "No description provided"}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premium</span>
                    <span className="font-bold text-lg">${Number(t.basePremium).toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium">${Number(t.coverageAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span>{t.durationMonths} months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Discount</span>
                    <span className="text-green-600 dark:text-green-400">{t.maxDiscountPercentage}%</span>
                  </div>
                  {t.minHealthScore > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Min Score</span>
                      <span>{t.minHealthScore}</span>
                    </div>
                  )}
                  {t.vendor && (
                    <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-sm">{t.vendor.companyName}</span>
                      {t.vendor.isVerified && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleApply(t.id)}
                    disabled={applyMutation.isPending || !readiness?.canApply}
                  >
                    {applyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                    Apply Now
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
