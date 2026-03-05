"use client";

import { motion } from "framer-motion";
import { FileText, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { PolicyTemplate, VendorApplication } from "@/types";
import { STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function VendorDashboardPage() {
  const { vendor } = useAuthStore();

  const { data: templatesData, isLoading: tLoading } = useQuery<{ templates: PolicyTemplate[] }>({
    queryKey: ["vendorTemplates"],
    queryFn: async () => {
      const { data } = await api.get("/templates");
      return data;
    },
  });

  const { data: appsData, isLoading: aLoading } = useQuery<{ applications: VendorApplication[] }>({
    queryKey: ["vendorApplications"],
    queryFn: async () => {
      const { data } = await api.get("/vendor/applications");
      return data;
    },
  });

  const templates = templatesData?.templates || [];
  const applications = appsData?.applications || [];

  const pending = applications.filter((a) => a.status === "pending_review");
  const approved = applications.filter((a) => a.status === "approved" || a.status === "active");
  const rejected = applications.filter((a) => a.status === "rejected");

  const loading = tLoading || aLoading;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back, {vendor?.companyName}
          {!vendor?.isVerified && (
            <Badge variant="outline" className="ml-2 text-yellow-600">Pending Verification</Badge>
          )}
        </p>
      </motion.div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="Templates" value={templates.length} icon={FileText} color="text-blue-600 dark:text-blue-400" delay={0} />
            <StatsCard title="Pending Review" value={pending.length} icon={Clock} color="text-yellow-600 dark:text-yellow-400" delay={0.05} />
            <StatsCard title="Approved" value={approved.length} icon={CheckCircle2} color="text-green-600 dark:text-green-400" delay={0.1} />
            <StatsCard title="Rejected" value={rejected.length} icon={XCircle} color="text-red-600 dark:text-red-400" delay={0.15} />
          </div>

          {/* Recent Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest policy applications from users</CardDescription>
              </div>
              <Link href="/vendor/applications" className="text-sm text-primary hover:underline">View All</Link>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No applications yet</p>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 5).map((app) => (
                    <div key={app.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{app.user?.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.template?.planName} &middot; Score: {app.currentHealthScore ?? "N/A"} &middot; {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge className={cn(STATUS_COLORS[app.status])}>{app.status.replace("_", " ")}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
