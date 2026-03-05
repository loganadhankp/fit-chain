"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVendorStore } from "@/store/vendorStore";
import { FileText, ClipboardCheck, CheckCircle2, Clock } from "lucide-react";

export default function VendorDashboardPage() {
  const { vendor, templates, applications, fetchTemplates, fetchApplications } =
    useVendorStore();

  useEffect(() => {
    fetchTemplates();
    fetchApplications();
  }, [fetchTemplates, fetchApplications]);

  const activeTemplates = templates.filter((t) => t.isActive).length;
  const pendingApps = applications.filter((a) => a.status === "pending_review").length;
  const approvedApps = applications.filter((a) => a.status === "approved" || a.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {vendor?.companyName || "Vendor"}
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your insurance plans and review applications
          {vendor && !vendor.isVerified && (
            <Badge className="ml-2 bg-amber-50 text-amber-700">Pending Verification</Badge>
          )}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{activeTemplates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{applications.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{pendingApps}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 font-normal flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{approvedApps}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent applications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-gray-500 text-sm">No applications yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4">Applicant</th>
                    <th className="py-2 pr-4">Plan</th>
                    <th className="py-2 pr-4">Health Score</th>
                    <th className="py-2 pr-4">Data Days</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Applied</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 10).map((app) => (
                    <tr key={app.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{app.user.email}</td>
                      <td className="py-2 pr-4">{app.template?.planName || "—"}</td>
                      <td className="py-2 pr-4 font-medium">
                        {app.currentHealthScore ?? app.initialHealthScore ?? "—"}
                      </td>
                      <td className="py-2 pr-4">{app.totalMetricDays}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          className={
                            app.status === "pending_review"
                              ? "bg-amber-50 text-amber-700"
                              : app.status === "approved" || app.status === "active"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }
                        >
                          {app.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

