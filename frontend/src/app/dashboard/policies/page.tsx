"use client";

import { motion } from "framer-motion";
import { Shield, ArrowRight, Loader2, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePolicies, useMintPolicy } from "@/hooks/usePolicies";
import { TIER_LABELS, TIER_COLORS, STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";

export default function PoliciesPage() {
  const { data, isLoading } = usePolicies();
  const mintMutation = useMintPolicy();
  const { user } = useAuthStore();
  const policies = data?.policies || [];

  const handleMint = (policyId: string) => {
    if (!user?.walletAddress) {
      toast.error("Connect your wallet first", { description: "Go to Settings to connect your wallet." });
      return;
    }
    mintMutation.mutate(policyId, {
      onSuccess: (data) => toast.success(`Policy minted! Token ID: ${data.tokenId}`),
      onError: () => toast.error("Failed to mint policy NFT"),
    });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">My Policies</h1>
        <p className="mt-1 text-muted-foreground">View and manage your insurance policies</p>
      </motion.div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : policies.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No policies yet</p>
            <p className="mt-1 text-muted-foreground">Browse plans and apply for your first insurance policy.</p>
            <Button className="mt-6" asChild>
              <Link href="/dashboard/plans">Browse Plans</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {policies.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{p.planName || "Insurance Policy"}</CardTitle>
                    </div>
                    <Badge className={cn(STATUS_COLORS[p.status])}>{p.status.replace("_", " ")}</Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">{p.policyNumber}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Coverage Tier</p>
                      <Badge className={cn("mt-0.5", TIER_COLORS[p.coverageTier])}>
                        {TIER_LABELS[p.coverageTier]}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Health Score</p>
                      <p className="font-bold text-lg">{p.healthScore}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Premium</p>
                      <p className="font-medium">${p.currentPremium.toFixed(2)}/mo</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Coverage</p>
                      <p className="font-medium">${p.coverageAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  {p.discountPercentage > 0 && (
                    <div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-950/30">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {p.discountPercentage}% discount applied
                      </span>
                    </div>
                  )}

                  {p.vendorName && (
                    <p className="text-sm text-muted-foreground">Provider: {p.vendorName}</p>
                  )}

                  {p.rejectionReason && (
                    <div className="rounded-lg bg-destructive/10 p-3">
                      <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                      <p className="text-sm text-muted-foreground">{p.rejectionReason}</p>
                    </div>
                  )}

                  {p.tokenId && (
                    <div className="rounded-lg border p-2 text-center">
                      <span className="text-xs text-muted-foreground">NFT Token ID: </span>
                      <span className="font-mono text-sm font-medium">{p.tokenId}</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {p.status === "approved" && !p.tokenId && (
                      <Button
                        size="sm"
                        onClick={() => handleMint(p.id)}
                        disabled={mintMutation.isPending}
                      >
                        {mintMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                        Mint NFT
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/policies/${p.id}`}>
                        Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
