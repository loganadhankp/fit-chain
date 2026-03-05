"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";

export default function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting your wearable...");

  useEffect(() => {
    const code = searchParams.get("code");
    const stateRaw = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Authorization denied: ${error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received.");
      return;
    }

    // Parse provider from state parameter
    let provider = "google_fit"; // default
    if (stateRaw) {
      try {
        const state = JSON.parse(decodeURIComponent(stateRaw));
        provider = state.provider || "google_fit";
      } catch {
        // If state is not JSON, use it directly
        provider = stateRaw;
      }
    }

    // Send the code to the backend (which has the JWT via the api interceptor)
    api
      .post(`/wearables/callback/${provider}`, { code })
      .then(() => {
        setStatus("success");
        setMessage(`${provider === "google_fit" ? "Google Fit" : "Fitbit"} connected successfully!`);

        // Close this window after a short delay (if it's a popup)
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: "oauth_success", provider }, "*");
            window.close();
          } else {
            // Not a popup — redirect to wearables page
            window.location.href = "/dashboard/wearables";
          }
        }, 1500);
      })
      .catch((err) => {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setMessage(
          err.response?.data?.error || "Failed to connect wearable. Please try again."
        );
      });
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-lg font-medium text-gray-700">{message}</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="text-lg font-medium text-green-700">{message}</p>
              <p className="text-sm text-gray-500">Redirecting...</p>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-600" />
              <p className="text-lg font-medium text-red-700">{message}</p>
              <button
                onClick={() => (window.location.href = "/dashboard/wearables")}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                ← Back to Wearables
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

