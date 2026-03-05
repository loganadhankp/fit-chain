"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PolicyCardProps {
  policy: {
    id: string;
    policyNumber: string;
    tokenId?: number | null;
    coverageTier: number;
    basePremium: number;
    currentPremium: number;
    discountPercentage: number;
    healthScore: number;
    status: string;
  };
}

const tierConfig: Record<number, { name: string; color: string }> = {
  1: { name: "Bronze", color: "bg-orange-100 text-orange-800" },
  2: { name: "Silver", color: "bg-gray-100 text-gray-800" },
  3: { name: "Gold", color: "bg-yellow-100 text-yellow-800" },
  4: { name: "Platinum", color: "bg-purple-100 text-purple-800" },
};

export function PolicyCard({ policy }: PolicyCardProps) {
  const tier = tierConfig[policy.coverageTier] || tierConfig[1];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Policy #{policy.policyNumber}</h3>
          {policy.tokenId && (
            <p className="text-sm text-gray-500">NFT Token ID: {policy.tokenId}</p>
          )}
        </div>
        <Badge className={tier.color}>{tier.name}</Badge>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Health Score</span>
          <span className="font-semibold">{policy.healthScore}/100</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Base Premium</span>
          <span className="font-semibold">${policy.basePremium.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Discount</span>
          <span className="font-semibold text-green-600">
            -{policy.discountPercentage}%
          </span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t">
          <span className="font-semibold text-gray-900">Current Premium</span>
          <span className="text-xl font-bold text-blue-600">
            ${policy.currentPremium.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <Link href={`/dashboard/policy?id=${policy.id}`}>
          <Button className="w-full">View Details</Button>
        </Link>
      </div>
    </div>
  );
}

