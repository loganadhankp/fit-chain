"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, ChevronRight, ChevronLeft, Loader2, CheckCircle2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import type { HealthQuestionnaire } from "@/types";

const STEPS = ["Body Metrics", "Lifestyle", "Medical History"];

const CONDITIONS = [
  "Diabetes", "Hypertension", "Heart Disease", "Asthma", "Arthritis",
  "Cancer", "Kidney Disease", "Thyroid", "Depression", "Other",
];

export default function QuestionnairePage() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    heightCm: "",
    weightKg: "",
    smoker: false,
    alcoholFrequency: "never" as string,
    exerciseFrequency: "moderate" as string,
    preExistingConditions: [] as string[],
    familyHistory: [] as string[],
    medications: [] as string[],
  });
  const [newMedication, setNewMedication] = useState("");

  const { data: existing, isLoading } = useQuery<{ questionnaire: HealthQuestionnaire }>({
    queryKey: ["questionnaire"],
    queryFn: async () => {
      const { data } = await api.get("/questionnaire");
      return data;
    },
    retry: false,
  });

  useEffect(() => {
    if (existing?.questionnaire) {
      const q = existing.questionnaire;
      setForm({
        heightCm: q.heightCm?.toString() || "",
        weightKg: q.weightKg?.toString() || "",
        smoker: q.smoker,
        alcoholFrequency: q.alcoholFrequency || "never",
        exerciseFrequency: q.exerciseFrequency || "moderate",
        preExistingConditions: q.preExistingConditions || [],
        familyHistory: q.familyHistory || [],
        medications: q.medications || [],
      });
    }
  }, [existing]);

  const isUpdate = !!existing?.questionnaire;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        heightCm: form.heightCm ? parseFloat(form.heightCm) : undefined,
        weightKg: form.weightKg ? parseFloat(form.weightKg) : undefined,
        smoker: form.smoker,
        alcoholFrequency: form.alcoholFrequency,
        exerciseFrequency: form.exerciseFrequency,
        preExistingConditions: form.preExistingConditions,
        familyHistory: form.familyHistory,
        medications: form.medications,
      };
      if (isUpdate) {
        const { data } = await api.put("/questionnaire", payload);
        return data;
      } else {
        const { data } = await api.post("/questionnaire", payload);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questionnaire"] });
      queryClient.invalidateQueries({ queryKey: ["policyReadiness"] });
      toast.success(isUpdate ? "Questionnaire updated!" : "Questionnaire submitted!");
    },
    onError: () => toast.error("Failed to save questionnaire"),
  });

  const bmi = form.heightCm && form.weightKg
    ? (parseFloat(form.weightKg) / Math.pow(parseFloat(form.heightCm) / 100, 2)).toFixed(1)
    : null;

  const toggleCondition = (c: string, list: "preExistingConditions" | "familyHistory") => {
    setForm((prev) => ({
      ...prev,
      [list]: prev[list].includes(c) ? prev[list].filter((x) => x !== c) : [...prev[list], c],
    }));
  };

  const addMedication = () => {
    if (newMedication.trim() && !form.medications.includes(newMedication.trim())) {
      setForm((prev) => ({ ...prev, medications: [...prev.medications, newMedication.trim()] }));
      setNewMedication("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Health Questionnaire</h1>
        <p className="mt-1 text-muted-foreground">
          {isUpdate ? "Update your health profile" : "Complete your health profile to apply for insurance"}
        </p>
      </motion.div>

      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </button>
            <span className="hidden text-sm sm:inline">{s}</span>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {STEPS[step]}
          </CardTitle>
          <CardDescription>Step {step + 1} of {STEPS.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input id="height" type="number" placeholder="170" value={form.heightCm} onChange={(e) => setForm((p) => ({ ...p, heightCm: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" placeholder="70" value={form.weightKg} onChange={(e) => setForm((p) => ({ ...p, weightKg: e.target.value }))} />
                  </div>
                </div>
                {bmi && (
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Calculated BMI</p>
                    <p className="text-2xl font-bold">{bmi}</p>
                    <p className="text-xs text-muted-foreground">
                      {parseFloat(bmi) < 18.5 ? "Underweight" : parseFloat(bmi) < 25 ? "Normal" : parseFloat(bmi) < 30 ? "Overweight" : "Obese"}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Smoker</Label>
                    <p className="text-sm text-muted-foreground">Do you currently smoke?</p>
                  </div>
                  <Switch checked={form.smoker} onCheckedChange={(v) => setForm((p) => ({ ...p, smoker: v }))} />
                </div>

                <div className="space-y-2">
                  <Label>Alcohol Consumption</Label>
                  <Select value={form.alcoholFrequency} onValueChange={(v) => setForm((p) => ({ ...p, alcoholFrequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="occasional">Occasional</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Exercise Frequency</Label>
                  <Select value={form.exerciseFrequency} onValueChange={(v) => setForm((p) => ({ ...p, exerciseFrequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-3">
                  <Label>Pre-existing Conditions</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((c) => (
                      <Badge
                        key={c}
                        variant={form.preExistingConditions.includes(c) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCondition(c, "preExistingConditions")}
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Family History</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((c) => (
                      <Badge
                        key={c}
                        variant={form.familyHistory.includes(c) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCondition(c, "familyHistory")}
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Medications</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Add medication" value={newMedication} onChange={(e) => setNewMedication(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMedication())} />
                    <Button type="button" variant="outline" onClick={addMedication}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.medications.map((m) => (
                      <Badge key={m} variant="secondary" className="gap-1">
                        {m}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setForm((p) => ({ ...p, medications: p.medications.filter((x) => x !== m) }))} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isUpdate ? "Update" : "Submit"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
