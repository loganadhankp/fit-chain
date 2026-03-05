"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Users, Eye, CheckCircle2, XCircle, Loader2, ArrowLeft, Heart, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { TIER_LABELS, STATUS_COLORS, type VendorApplication } from "@/types";
import { cn } from "@/lib/utils";

export default function VendorApplicationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [adjustedPremium, setAdjustedPremium] = useState("");

  const { data, isLoading } = useQuery<{ applications: VendorApplication[] }>({
    queryKey: ["vendorApplications", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const { data } = await api.get(`/vendor/applications${params}`);
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes, premium }: { id: string; notes?: string; premium?: number }) => {
      const { data } = await api.post(`/vendor/applications/${id}/approve`, {
        vendorNotes: notes || undefined,
        basePremium: premium || undefined,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorApplications"] });
      toast.success("Application approved");
      setSelectedApp(null);
      setApproveNotes("");
      setAdjustedPremium("");
    },
    onError: () => toast.error("Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await api.post(`/vendor/applications/${id}/reject`, { rejectionReason: reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorApplications"] });
      toast.success("Application rejected");
      setRejectDialogOpen(false);
      setSelectedApp(null);
      setRejectionReason("");
    },
    onError: () => toast.error("Failed to reject"),
  });

  const applications = data?.applications || [];

  if (selectedApp) {
    return (
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="ghost" size="sm" onClick={() => setSelectedApp(null)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Applications
          </Button>
          <h1 className="text-3xl font-bold">Application Review</h1>
          <p className="mt-1 text-muted-foreground">
            {selectedApp.user?.email} &middot; {selectedApp.template?.planName}
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={cn(STATUS_COLORS[selectedApp.status])}>{selectedApp.status.replace("_", " ")}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Policy #</span><span className="font-mono">{selectedApp.policyNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{selectedApp.template?.planName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Base Premium</span><span>${Number(selectedApp.basePremium).toFixed(2)}/mo</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Coverage</span><span>${Number(selectedApp.coverageAmount).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Applied</span><span>{format(new Date(selectedApp.createdAt), "MMM d, yyyy")}</span></div>

              <Separator />

              <div className="flex justify-between"><span className="text-muted-foreground">Applicant</span><span>{selectedApp.user?.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Health Score</span><span className="text-lg font-bold">{selectedApp.currentHealthScore ?? "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Score Trend</span><span className="capitalize">{selectedApp.healthScoreTrend || "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Metric Days</span><span>{selectedApp.totalMetricDays}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Questionnaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selectedApp.questionnaire ? (
                <>
                  {selectedApp.questionnaire.bmi && (
                    <div className="flex justify-between"><span className="text-muted-foreground">BMI</span><span>{Number(selectedApp.questionnaire.bmi).toFixed(1)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted-foreground">Smoker</span><span>{selectedApp.questionnaire.smoker ? "Yes" : "No"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Alcohol</span><span className="capitalize">{selectedApp.questionnaire.alcoholFrequency || "N/A"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Exercise</span><span className="capitalize">{selectedApp.questionnaire.exerciseFrequency || "N/A"}</span></div>
                  {selectedApp.questionnaire.preExistingConditions?.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-1">Pre-existing Conditions</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedApp.questionnaire.preExistingConditions.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No questionnaire data</p>
              )}
            </CardContent>
          </Card>

          {selectedApp.status === "pending_review" && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
                <CardDescription>Approve or reject this application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Vendor Notes (optional)</Label>
                    <Textarea value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} placeholder="Any notes for the applicant..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Adjusted Premium (optional)</Label>
                    <Input type="number" value={adjustedPremium} onChange={(e) => setAdjustedPremium(e.target.value)} placeholder={`Current: $${Number(selectedApp.basePremium).toFixed(2)}`} />
                    <p className="text-xs text-muted-foreground">Leave empty to keep default premium</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => approveMutation.mutate({
                      id: selectedApp.id,
                      notes: approveNotes,
                      premium: adjustedPremium ? parseFloat(adjustedPremium) : undefined,
                    })}
                    disabled={approveMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>Provide a reason for rejection</DialogDescription>
            </DialogHeader>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (min 5 characters)..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => rejectMutation.mutate({ id: selectedApp.id, reason: rejectionReason })}
                disabled={rejectionReason.length < 5 || rejectMutation.isPending}
              >
                {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="mt-1 text-muted-foreground">Review and manage policy applications</p>
      </motion.div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No applications</p>
            <p className="mt-1 text-muted-foreground">Applications from users will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app, i) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setSelectedApp(app)}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{app.user?.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.template?.planName} &middot; ${Number(app.basePremium).toFixed(2)}/mo
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-medium">Score: {app.currentHealthScore ?? "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(app.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <Badge className={cn(STATUS_COLORS[app.status])}>{app.status.replace("_", " ")}</Badge>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
