"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useAppStore } from "@/store/store";
import { useEffect } from "react";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { user, connectWallet: linkWallet } = useAppStore();

  // Auto-link wallet to backend when connected
  useEffect(() => {
    if (isConnected && address && user && !user.walletAddress) {
      linkWallet(address).catch(console.error);
    }
  }, [isConnected, address, user, linkWallet]);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm">
          <Wallet className="h-4 w-4" />
          <span className="font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          variant="outline"
          onClick={() => connect({ connector })}
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          Connect {connector.name}
        </Button>
      ))}
    </div>
  );
}

