import { http, createConfig } from "wagmi";
import { polygonMumbai, hardhat } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [polygonMumbai, hardhat],
  connectors: [injected()],
  transports: {
    [polygonMumbai.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

