"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/store";
import { ConnectWallet } from "@/components/web3/ConnectWallet";
import { useAccount } from "wagmi";
import api from "@/lib/api";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_review: { label: "Under Review", color: "bg-amber-50 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-blue-50 text-blue-700", icon: CheckCircle2 },
  active: { label: "Active", color: "bg-green-50 text-green-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
  paused: { label: "Paused", color: "bg-gray-100 text-gray-600", icon: AlertCircle },
};

export default function PolicyPage() {
  const { policies, fetchPolicies, user, connectWallet } = useAppStore();
  const { address, isConnected } = useAccount();
  const [minting, setMinting] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Auto-link wallet if connected in MetaMask but not saved in backend
  useEffect(() => {
    if (isConnected && address && user && !user.walletAddress) {
      connectWallet(address).catch(console.error);
    }
  }, [isConnected, address, user, connectWallet]);

  const walletReady = isConnected && address;

  const handleMint = async (policyId: string) => {
    if (!walletReady) {
      alert("Please connect your wallet first");
      return;
    }

    // Ensure wallet is linked to backend profile before minting
    if (!user?.walletAddress) {
      try {
        await connectWallet(address);
      } catch {
        alert("Failed to link wallet to your account. Please try again.");
        return;
      }
    }

    setMinting(policyId);
    try {
      const res = await api.post(`/policies/${policyId}/mint`);
      alert(`Policy minted! Token ID: ${res.data.tokenId}\nTx: ${res.data.txHash}`);
      fetchPolicies();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr.response?.data?.error || "Minting failed");
    } finally {
      setMinting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Policies</h1>
        <div className="flex gap-3">
          <ConnectWallet />
          <Link href="/dashboard/browse-plans">
            <Button>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Plans
            </Button>
          </Link>
        </div>
      </div>

      {/* Policy list */}
      {policies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <p className="mb-4">No policies found.</p>
            <Link href="/dashboard/browse-plans">
              <Button>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Available Plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {policies.map((p) => {
            const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.cancelled;
            const StatusIcon = statusCfg.icon;

            return (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {p.planName || p.policyNumber}
                        <Badge className={statusCfg.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                      </CardTitle>
                      {p.vendorName && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          by {p.vendorName} &middot; {p.policyNumber}
                        </p>
                      )}
                    </div>
                    {p.tokenId && (
                      <Badge className="bg-green-50 text-green-700">
                        NFT Token #{p.tokenId}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400">Base Premium</p>
                      <p className="font-semibold">${p.basePremium}/mo</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Current Premium</p>
                      <p className="font-semibold text-green-600">${p.currentPremium}/mo</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Coverage</p>
                      <p className="font-semibold">${p.coverageAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Health Score</p>
                      <p className="font-semibold">{p.healthScore}/100</p>
                    </div>
                  </div>

                  {/* Discount bar */}
                  {p.discountPercentage > 0 && (
                    <div className="mb-4 p-2 bg-green-50 rounded text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {p.discountPercentage}% healthy lifestyle discount applied!
                    </div>
                  )}

                  {/* Rejection reason */}
                  {p.status === "rejected" && p.rejectionReason && (
                    <div className="mb-4 p-3 bg-red-50 rounded text-sm text-red-700">
                      <p className="font-medium">Rejection Reason:</p>
                      <p>{p.rejectionReason}</p>
                    </div>
                  )}

                  {/* Vendor notes */}
                  {p.vendorNotes && p.status !== "rejected" && (
                    <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
                      <p className="font-medium">Vendor Notes:</p>
                      <p>{p.vendorNotes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {p.status === "approved" && !p.tokenId && (
                      <Button
                        disabled={minting === p.id || !walletReady}
                        onClick={() => handleMint(p.id)}
                      >
                        {minting === p.id ? "Minting..." : "Mint as NFT"}
                      </Button>
                    )}
                    {p.status === "pending_review" && (
                      <p className="text-sm text-amber-600 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Awaiting vendor review...
                      </p>
                    )}
                    {p.blockchainTxHash && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`https://mumbai.polygonscan.com/tx/${p.blockchainTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View on Explorer
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
