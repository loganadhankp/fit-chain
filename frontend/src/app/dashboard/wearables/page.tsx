"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Watch, RefreshCw, Unlink, ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConnectedWearables, useSyncWearable, useDisconnectWearable } from "@/hooks/useWearables";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const PROVIDERS = [
  {
    id: "fitbit",
    name: "Fitbit",
    description: "Track steps, heart rate, sleep, and activity from your Fitbit device.",
    color: "bg-teal-500",
  },
  {
    id: "google_fit",
    name: "Google Fit",
    description: "Connect Google Fit to import your health and fitness data.",
    color: "bg-blue-500",
  },
];

export default function WearablesPage() {
  const { data, isLoading } = useConnectedWearables();
  const syncMutation = useSyncWearable();
  const disconnectMutation = useDisconnectWearable();
  const [connecting, setConnecting] = useState<string | null>(null);

  const connections = data?.connections || [];
  const connectedProviders = new Set(connections.map((c) => c.provider));

  const handleConnect = async (provider: string) => {
    setConnecting(provider);
    try {
      const { data: urlData } = await api.get(`/wearables/auth-url/${provider}`);
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        urlData.authUrl,
        `${provider} OAuth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );

      const checkInterval = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            clearInterval(checkInterval);
            setConnecting(null);
            return;
          }
          const url = popup.location.href;
          if (url.includes("code=")) {
            const params = new URL(url).searchParams;
            const code = params.get("code");
            if (code) {
              popup.close();
              clearInterval(checkInterval);
              api.post(`/wearables/callback/${provider}`, { code })
                .then(() => {
                  toast.success(`${provider} connected successfully!`);
                  window.location.reload();
                })
                .catch(() => toast.error("Failed to complete connection"));
            }
          }
        } catch {
          // Cross-origin errors are expected while on the OAuth provider's page
        }
      }, 500);
    } catch {
      toast.error("Failed to start connection");
    } finally {
      setConnecting(null);
    }
  };

  const handleSync = (provider: string) => {
    syncMutation.mutate(provider, {
      onSuccess: () => toast.success(`${provider} data synced!`),
      onError: () => toast.error("Sync failed"),
    });
  };

  const handleDisconnect = (provider: string) => {
    disconnectMutation.mutate(provider, {
      onSuccess: () => toast.success(`${provider} disconnected`),
      onError: () => toast.error("Failed to disconnect"),
    });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Wearable Devices</h1>
        <p className="mt-1 text-muted-foreground">Connect your fitness trackers to automatically sync health data</p>
      </motion.div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {PROVIDERS.map((provider, i) => {
            const isConnected = connectedProviders.has(provider.id);
            const connection = connections.find((c) => c.provider === provider.id);

            return (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="relative overflow-hidden">
                  <div className={`absolute inset-x-0 top-0 h-1 ${provider.color}`} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${provider.color} text-white`}>
                          <Watch className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{provider.name}</CardTitle>
                          <CardDescription>{provider.description}</CardDescription>
                        </div>
                      </div>
                      {isConnected ? (
                        <Badge variant="outline" className="gap-1 border-green-500 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <XCircle className="h-3 w-3" /> Not connected
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <div className="space-y-4">
                        {connection?.lastSyncAt && (
                          <p className="text-sm text-muted-foreground">
                            Last synced {formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSync(provider.id)}
                            disabled={syncMutation.isPending}
                          >
                            {syncMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Sync Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnect(provider.id)}
                            disabled={disconnectMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <Unlink className="mr-2 h-4 w-4" />
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleConnect(provider.id)}
                        disabled={connecting === provider.id}
                      >
                        {connecting === provider.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="mr-2 h-4 w-4" />
                        )}
                        Connect {provider.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
