export const NFT_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";

export const NFT_ABI = [
  {
    inputs: [{ name: "_tokenId", type: "uint256" }],
    name: "getCurrentPremium",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_user", type: "address" }],
    name: "getUserPolicies",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "policies",
    outputs: [
      { name: "policyId", type: "uint256" },
      { name: "policyHolder", type: "address" },
      { name: "basePremium", type: "uint256" },
      { name: "healthScore", type: "uint256" },
      { name: "discountPercentage", type: "uint256" },
      { name: "coverageTier", type: "uint256" },
      { name: "lastUpdated", type: "uint256" },
      { name: "isActive", type: "bool" },
      { name: "ipfsMetadataHash", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "healthScore", type: "uint256" }],
    name: "calculateDiscount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
] as const;

export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "80001", 10);
