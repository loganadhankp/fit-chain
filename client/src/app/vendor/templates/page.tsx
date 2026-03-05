"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useVendorStore } from "@/store/vendorStore";
import { Plus, Pencil, Trash2 } from "lucide-react";

const TIER_LABELS: Record<number, string> = { 1: "Bronze", 2: "Silver", 3: "Gold", 4: "Platinum" };

interface TemplateForm {
  planName: string;
  description: string;
  basePremium: string;
  coverageAmount: string;
  coverageTier: number;
  policyType: string;
  minHealthScore: string;
  maxDiscountPercentage: string;
  durationMonths: string;
}

const emptyForm: TemplateForm = {
  planName: "",
  description: "",
  basePremium: "",
  coverageAmount: "",
  coverageTier: 1,
  policyType: "health",
  minHealthScore: "0",
  maxDiscountPercentage: "20",
  durationMonths: "12",
};

export default function TemplatesPage() {
  const { templates, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } =
    useVendorStore();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (id: string) => {
    const t = templates.find((t) => t.id === id);
    if (!t) return;
    setEditId(id);
    setForm({
      planName: t.planName,
      description: t.description || "",
      basePremium: t.basePremium.toString(),
      coverageAmount: t.coverageAmount.toString(),
      coverageTier: t.coverageTier,
      policyType: t.policyType,
      minHealthScore: t.minHealthScore.toString(),
      maxDiscountPercentage: t.maxDiscountPercentage.toString(),
      durationMonths: t.durationMonths.toString(),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        planName: form.planName,
        description: form.description,
        basePremium: parseFloat(form.basePremium),
        coverageAmount: parseFloat(form.coverageAmount),
        coverageTier: form.coverageTier,
        policyType: form.policyType,
        minHealthScore: parseInt(form.minHealthScore),
        maxDiscountPercentage: parseInt(form.maxDiscountPercentage),
        durationMonths: parseInt(form.durationMonths),
      };
      if (editId) {
        await updateTemplate(editId, data);
      } else {
        await createTemplate(data);
      }
      fetchTemplates();
      setShowForm(false);
    } catch (err) {
      console.error("Save template error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deactivate this template? Users won't be able to apply for it.")) return;
    await deleteTemplate(id);
    fetchTemplates();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Templates</h1>
          <p className="text-gray-500 mt-1">Manage insurance plans you offer</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editId ? "Edit Template" : "Create Template"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input value={form.planName} onChange={(e) => update("planName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Policy Type</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.policyType}
                  onChange={(e) => update("policyType", e.target.value)}
                >
                  <option value="health">Health</option>
                  <option value="life">Life</option>
                  <option value="critical_illness">Critical Illness</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Base Premium ($/mo)</Label>
                <Input
                  type="number"
                  value={form.basePremium}
                  onChange={(e) => update("basePremium", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Coverage Amount ($)</Label>
                <Input
                  type="number"
                  value={form.coverageAmount}
                  onChange={(e) => update("coverageAmount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Coverage Tier</Label>
                <select
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  value={form.coverageTier}
                  onChange={(e) => update("coverageTier", parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4].map((t) => (
                    <option key={t} value={t}>{TIER_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Min Health Score (0-100)</Label>
                <Input
                  type="number"
                  value={form.minHealthScore}
                  onChange={(e) => update("minHealthScore", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Discount %</Label>
                <Input
                  type="number"
                  value={form.maxDiscountPercentage}
                  onChange={(e) => update("maxDiscountPercentage", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (months)</Label>
                <Input
                  type="number"
                  value={form.durationMonths}
                  onChange={(e) => update("durationMonths", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm min-h-[80px]"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editId ? "Update Template" : "Create Template"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template list */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            No templates yet. Create your first policy template above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card key={t.id} className={!t.isActive ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{t.planName}</span>
                    <Badge className="text-xs">
                      {TIER_LABELS[t.coverageTier]}
                    </Badge>
                    {!t.isActive && (
                      <Badge className="bg-gray-100 text-gray-500 text-xs">Inactive</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 space-x-4">
                    <span>${t.basePremium}/mo</span>
                    <span>Coverage: ${t.coverageAmount.toLocaleString()}</span>
                    <span>Min score: {t.minHealthScore}</span>
                    <span>Max discount: {t.maxDiscountPercentage}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(t.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {t.isActive && (
                    <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

