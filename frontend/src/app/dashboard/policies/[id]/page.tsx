"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Shield, ArrowLeft, ExternalLink, Wallet, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePolicyDetail, usePolicyHistory, useMintPolicy } from "@/hooks/usePolicies";
import { TIER_LABELS, TIER_COLORS, STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";


export default function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = usePolicyDetail(id);
  const { data: historyData } = usePolicyHistory(id);
  const mintMutation = useMintPolicy();
  const { user } = useAuthStore();

  const policy = data?.policy;
  const updates = historyData?.updates || [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Policy not found</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/dashboard/policies">Back to Policies</Link>
        </Button>
      </div>
    );
  }

  const handleMint = () => {
    if (!user?.walletAddress) {
      toast.error("Connect your wallet first");
      return;
    }
    mintMutation.mutate(id, {
      onSuccess: (data) => toast.success(`Minted! Token ID: ${data.tokenId}`),
      onError: () => toast.error("Mint failed"),
    });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/policies"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
        </Button>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{policy.template?.planName || "Policy Details"}</h1>
            <p className="font-mono text-sm text-muted-foreground">{policy.policyNumber}</p>
          </div>
          <Badge className={cn("ml-auto", STATUS_COLORS[policy.status])}>{policy.status.replace("_", " ")}</Badge>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Policy Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Coverage Tier", <Badge key="t" className={cn(TIER_COLORS[policy.coverageTier])}>{TIER_LABELS[policy.coverageTier]}</Badge>],
              ["Base Premium", `$${Number(policy.basePremium).toFixed(2)}/mo`],
              ["Coverage Amount", `$${Number(policy.coverageAmount).toLocaleString()}`],
              ["Policy Type", policy.policyType],
              ["Start Date", format(new Date(policy.startDate), "MMM d, yyyy")],
              ...(policy.endDate ? [["End Date", format(new Date(policy.endDate), "MMM d, yyyy")]] : []),
              ...(policy.tokenId ? [["Token ID", <span key="tid" className="font-mono">{policy.tokenId}</span>]] : []),
              ...(policy.vendor?.companyName ? [["Vendor", policy.vendor.companyName]] : []),
            ].map(([label, value], idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label as string}</span>
                <span className="font-medium">{value as React.ReactNode}</span>
              </div>
            ))}

            {policy.blockchainTxHash && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Blockchain TX</span>
                  <a
                    href={`https://mumbai.polygonscan.com/tx/${policy.blockchainTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                  >
                    {policy.blockchainTxHash.slice(0, 10)}...{policy.blockchainTxHash.slice(-8)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </>
            )}

            {policy.status === "approved" && !policy.tokenId && (
              <Button onClick={handleMint} disabled={mintMutation.isPending} className="mt-4 w-full">
                {mintMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                Mint as NFT
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update History</CardTitle>
            <CardDescription>Oracle-driven score and premium updates</CardDescription>
          </CardHeader>
          <CardContent>
            {updates.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No updates yet</p>
            ) : (
              <div className="space-y-3">
                {updates.map((u) => (
                  <div key={u.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Score: {u.healthScore}</span>
                      <Badge className={cn(TIER_COLORS[u.coverageTier])} variant="outline">
                        {TIER_LABELS[u.coverageTier]}
                      </Badge>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>Premium: ${Number(u.newPremium).toFixed(2)} (-{Number(u.discountPercentage)}%)</span>
                      <span>{format(new Date(u.updatedAt), "MMM d, yyyy")}</span>
                    </div>
                    {u.oracleTxHash && (
                      <a
                        href={`https://mumbai.polygonscan.com/tx/${u.oracleTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        TX: {u.oracleTxHash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
