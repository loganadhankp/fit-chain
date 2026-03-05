"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { TIER_LABELS, TIER_COLORS, type PolicyTemplate } from "@/types";
import { cn } from "@/lib/utils";

const defaultForm = {
  planName: "",
  description: "",
  basePremium: "",
  coverageAmount: "",
  coverageTier: "1",
  policyType: "health",
  minHealthScore: "0",
  maxDiscountPercentage: "20",
  durationMonths: "12",
};

export default function VendorTemplatesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data, isLoading } = useQuery<{ templates: PolicyTemplate[] }>({
    queryKey: ["vendorTemplates"],
    queryFn: async () => {
      const { data } = await api.get("/templates");
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editId) {
        const { data } = await api.put(`/templates/${editId}`, payload);
        return data;
      }
      const { data } = await api.post("/templates", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorTemplates"] });
      toast.success(editId ? "Template updated" : "Template created");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => toast.error("Failed to save template"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/templates/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendorTemplates"] });
      toast.success("Template deactivated");
    },
  });

  const resetForm = () => {
    setForm(defaultForm);
    setEditId(null);
  };

  const openEdit = (t: PolicyTemplate) => {
    setEditId(t.id);
    setForm({
      planName: t.planName,
      description: t.description || "",
      basePremium: String(t.basePremium),
      coverageAmount: String(t.coverageAmount),
      coverageTier: String(t.coverageTier),
      policyType: t.policyType,
      minHealthScore: String(t.minHealthScore),
      maxDiscountPercentage: String(t.maxDiscountPercentage),
      durationMonths: String(t.durationMonths),
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    createMutation.mutate({
      planName: form.planName,
      description: form.description || undefined,
      basePremium: parseFloat(form.basePremium),
      coverageAmount: parseFloat(form.coverageAmount),
      coverageTier: parseInt(form.coverageTier),
      policyType: form.policyType,
      minHealthScore: parseInt(form.minHealthScore),
      maxDiscountPercentage: parseInt(form.maxDiscountPercentage),
      durationMonths: parseInt(form.durationMonths),
    });
  };

  const templates = data?.templates || [];
  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policy Templates</h1>
          <p className="mt-1 text-muted-foreground">Create and manage your insurance plan templates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit Template" : "Create Template"}</DialogTitle>
              <DialogDescription>Define your insurance plan parameters</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input value={form.planName} onChange={(e) => update("planName", e.target.value)} placeholder="Premium Health Plan" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe your plan..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base Premium ($/mo)</Label>
                  <Input type="number" value={form.basePremium} onChange={(e) => update("basePremium", e.target.value)} placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label>Coverage Amount ($)</Label>
                  <Input type="number" value={form.coverageAmount} onChange={(e) => update("coverageAmount", e.target.value)} placeholder="100000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coverage Tier</Label>
                  <Select value={form.coverageTier} onValueChange={(v) => update("coverageTier", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Bronze</SelectItem>
                      <SelectItem value="2">Silver</SelectItem>
                      <SelectItem value="3">Gold</SelectItem>
                      <SelectItem value="4">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Policy Type</Label>
                  <Select value={form.policyType} onValueChange={(v) => update("policyType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="life">Life</SelectItem>
                      <SelectItem value="critical_illness">Critical Illness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min Score</Label>
                  <Input type="number" value={form.minHealthScore} onChange={(e) => update("minHealthScore", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Discount %</Label>
                  <Input type="number" value={form.maxDiscountPercentage} onChange={(e) => update("maxDiscountPercentage", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (mo)</Label>
                  <Input type="number" value={form.durationMonths} onChange={(e) => update("durationMonths", e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No templates yet</p>
            <p className="mt-1 text-muted-foreground">Create your first insurance plan template</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn(!t.isActive && "opacity-60")}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={cn(TIER_COLORS[t.coverageTier])}>{TIER_LABELS[t.coverageTier]}</Badge>
                    {!t.isActive && <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>}
                  </div>
                  <CardTitle className="mt-2">{t.planName}</CardTitle>
                  <CardDescription>{t.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Premium</span><span className="font-medium">${Number(t.basePremium).toFixed(2)}/mo</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Coverage</span><span>${Number(t.coverageAmount).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Min Score</span><span>{t.minHealthScore}</span></div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(t)} className="flex-1">
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    {t.isActive && (
                      <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(t.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
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
