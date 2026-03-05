"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogOut, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ConnectWallet({ onConnected }: { onConnected?: (address: string) => void }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isConnected && address) {
    if (onConnected) onConnected(address);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-green-500 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </Badge>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <code className="flex-1 text-sm">{address.slice(0, 6)}...{address.slice(-4)}</code>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyAddress}>
            {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => disconnect()} className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Disconnect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          variant="outline"
          className="w-full justify-start"
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
          {connector.name}
        </Button>
      ))}
    </div>
  );
}
