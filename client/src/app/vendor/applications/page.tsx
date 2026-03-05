"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVendorStore } from "@/store/vendorStore";
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending_review", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function ApplicationsPage() {
  const { applications, fetchApplications, approveApplication, rejectApplication } =
    useVendorStore();

  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [adjustedPremium, setAdjustedPremium] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications(statusFilter || undefined);
  }, [fetchApplications, statusFilter]);

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      await approveApplication(
        id,
        notes || undefined,
        adjustedPremium ? parseFloat(adjustedPremium) : undefined
      );
      fetchApplications(statusFilter || undefined);
      setActionId(null);
      setNotes("");
      setAdjustedPremium("");
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setProcessing(true);
    try {
      await rejectApplication(id, rejectionReason);
      fetchApplications(statusFilter || undefined);
      setActionId(null);
      setRejectionReason("");
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">Review user applications for your plans</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No applications found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const isExpanded = expandedId === app.id;
            const showActions = actionId === app.id;

            return (
              <Card key={app.id}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{app.user.email}</span>
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
                      </div>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span>Plan: {app.template?.planName || "—"}</span>
                        <span>Score: {app.currentHealthScore ?? app.initialHealthScore ?? "—"}</span>
                        <span>Data: {app.totalMetricDays} days</span>
                        <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-4 space-y-4">
                      {/* Health info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Initial Health Score</p>
                          <p className="font-semibold">{app.initialHealthScore ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Current Health Score</p>
                          <p className="font-semibold">{app.currentHealthScore ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Score Trend</p>
                          <p className="font-semibold capitalize">{app.healthScoreTrend ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Wearable Data Days</p>
                          <p className="font-semibold">{app.totalMetricDays}</p>
                        </div>
                      </div>

                      {/* Questionnaire data */}
                      {app.questionnaire && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Health Questionnaire
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-gray-50 rounded p-3">
                            {Object.entries(app.questionnaire).map(([key, value]) => {
                              if (["id", "userId", "submittedAt"].includes(key)) return null;
                              const label = key
                                .replace(/([A-Z])/g, " $1")
                                .replace(/_/g, " ")
                                .trim();
                              const display = Array.isArray(value)
                                ? (value as string[]).join(", ") || "None"
                                : typeof value === "boolean"
                                ? value
                                  ? "Yes"
                                  : "No"
                                : String(value ?? "—");
                              return (
                                <div key={key}>
                                  <p className="text-gray-400 capitalize text-xs">{label}</p>
                                  <p className="font-medium">{display}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      {app.status === "pending_review" && (
                        <div>
                          {!showActions ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionId(app.id);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionId(app.id);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-3 bg-gray-50 rounded p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Vendor Notes (optional)</Label>
                                  <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Notes for the applicant..."
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Adjusted Premium (optional)</Label>
                                  <Input
                                    type="number"
                                    value={adjustedPremium}
                                    onChange={(e) => setAdjustedPremium(e.target.value)}
                                    placeholder={`Default: $${app.template?.basePremium || ""}`}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Rejection Reason (if rejecting)</Label>
                                <Input
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="Reason for rejection..."
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={processing}
                                  onClick={() => handleApprove(app.id)}
                                >
                                  {processing ? "Processing..." : "Confirm Approve"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600"
                                  disabled={processing}
                                  onClick={() => handleReject(app.id)}
                                >
                                  {processing ? "Processing..." : "Confirm Reject"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setActionId(null);
                                    setNotes("");
                                    setAdjustedPremium("");
                                    setRejectionReason("");
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Already reviewed info */}
                      {app.status === "approved" && app.vendorNotes && (
                        <div className="p-3 bg-green-50 rounded text-sm text-green-700">
                          <strong>Notes:</strong> {app.vendorNotes}
                        </div>
                      )}
                      {app.status === "rejected" && app.rejectionReason && (
                        <div className="p-3 bg-red-50 rounded text-sm text-red-700">
                          <strong>Rejection reason:</strong> {app.rejectionReason}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

