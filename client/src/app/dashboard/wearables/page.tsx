"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Watch, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { useAppStore } from "@/store/store";

const PROVIDERS = [
  {
    id: "fitbit",
    name: "Fitbit",
    icon: "⌚",
    color: "bg-teal-500",
    description: "Steps, heart rate, sleep, and activity data",
  },
  {
    id: "google_fit",
    name: "Google Fit",
    icon: "🏃",
    color: "bg-blue-500",
    description: "Activity, heart rate, and sleep tracking",
  },
];

export default function WearablesPage() {
  const { wearables, fetchWearables } = useAppStore();
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchWearables();

    // Listen for OAuth success from popup callback page
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth_success") {
        fetchWearables();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchWearables]);

  const isConnected = (provider: string) =>
    wearables.some((w) => w.provider === provider && w.isActive);

  const getLastSync = (provider: string) =>
    wearables.find((w) => w.provider === provider)?.lastSyncAt;

  const handleConnect = async (provider: string) => {
    try {
      const res = await api.get(`/wearables/auth-url/${provider}`);
      // Open OAuth in popup
      const popup = window.open(
        res.data.authUrl,
        `${provider} OAuth`,
        "width=500,height=600,left=300,top=200"
      );

      // Listen for callback (in a real app, the popup would post a message)
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          fetchWearables();
        }
      }, 1000);
    } catch (err) {
      console.error("Connect error:", err);
    }
  };

  const handleSync = async (provider: string) => {
    setSyncing(provider);
    try {
      await api.post(`/wearables/sync/${provider}`);
      await fetchWearables();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      await api.delete(`/wearables/${provider}`);
      fetchWearables();
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wearable Devices</h1>
        <p className="text-gray-500 mt-1">
          Connect your fitness tracker to sync health data automatically
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROVIDERS.map((provider) => {
          const connected = isConnected(provider.id);
          const lastSync = getLastSync(provider.id);

          return (
            <Card key={provider.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 ${provider.color} rounded-full flex items-center justify-center text-2xl text-white`}
                    >
                      {provider.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{provider.name}</h3>
                      <p className="text-sm text-gray-500">{provider.description}</p>
                    </div>
                  </div>
                  <Badge className={connected ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}>
                    {connected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>

                {connected && lastSync && (
                  <p className="text-xs text-gray-400 mb-4">
                    Last synced: {new Date(lastSync).toLocaleString()}
                  </p>
                )}

                <div className="flex gap-2">
                  {connected ? (
                    <>
                      <Button
                        className="flex-1"
                        onClick={() => handleSync(provider.id)}
                        disabled={syncing === provider.id}
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 ${syncing === provider.id ? "animate-spin" : ""}`}
                        />
                        {syncing === provider.id ? "Syncing..." : "Sync Now"}
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDisconnect(provider.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleConnect(provider.id)}
                    >
                      <Watch className="h-4 w-4 mr-2" />
                      Connect {provider.name}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

