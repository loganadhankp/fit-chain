"use client";

import { http, createConfig } from "wagmi";
import { polygonAmoy, polygon, hardhat } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [polygonAmoy, polygon, hardhat],
  transports: {
    [polygonAmoy.id]: http(),
    [polygon.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});
