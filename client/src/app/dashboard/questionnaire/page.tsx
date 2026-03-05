"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/store";
import api from "@/lib/api";
import { CheckCircle2 } from "lucide-react";

const CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Asthma",
  "Cancer",
  "Thyroid Disorder",
  "Arthritis",
  "Kidney Disease",
  "None",
];

const FAMILY_HISTORY = [
  "Diabetes",
  "Heart Disease",
  "Cancer",
  "Stroke",
  "Hypertension",
  "None",
];

export default function QuestionnairePage() {
  const { questionnaire, fetchQuestionnaire } = useAppStore();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [smoker, setSmoker] = useState(false);
  const [alcoholFrequency, setAlcoholFrequency] = useState("never");
  const [exerciseFrequency, setExerciseFrequency] = useState("moderate");
  const [preExistingConditions, setPreExistingConditions] = useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = useState<string[]>([]);
  const [medications, setMedications] = useState("");

  useEffect(() => {
    fetchQuestionnaire();
  }, [fetchQuestionnaire]);

  // Pre-fill form when questionnaire exists
  useEffect(() => {
    if (questionnaire) {
      setHeightCm(questionnaire.heightCm?.toString() || "");
      setWeightKg(questionnaire.weightKg?.toString() || "");
      setSmoker(questionnaire.smoker);
      setAlcoholFrequency(questionnaire.alcoholFrequency || "never");
      setExerciseFrequency(questionnaire.exerciseFrequency || "moderate");
      setPreExistingConditions(questionnaire.preExistingConditions || []);
      setFamilyHistory(questionnaire.familyHistory || []);
      setMedications((questionnaire.medications || []).join(", "));
    }
  }, [questionnaire]);

  const toggleCondition = (c: string) => {
    if (c === "None") {
      setPreExistingConditions(preExistingConditions.includes("None") ? [] : ["None"]);
      return;
    }
    setPreExistingConditions((prev) =>
      prev.filter((x) => x !== "None").includes(c)
        ? prev.filter((x) => x !== c)
        : [...prev.filter((x) => x !== "None"), c]
    );
  };

  const toggleFamily = (f: string) => {
    if (f === "None") {
      setFamilyHistory(familyHistory.includes("None") ? [] : ["None"]);
      return;
    }
    setFamilyHistory((prev) =>
      prev.filter((x) => x !== "None").includes(f)
        ? prev.filter((x) => x !== f)
        : [...prev.filter((x) => x !== "None"), f]
    );
  };

  const bmi =
    heightCm && weightKg
      ? (parseFloat(weightKg) / Math.pow(parseFloat(heightCm) / 100, 2)).toFixed(1)
      : null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        heightCm: parseFloat(heightCm) || undefined,
        weightKg: parseFloat(weightKg) || undefined,
        smoker,
        alcoholFrequency,
        exerciseFrequency,
        preExistingConditions: preExistingConditions.filter((x) => x !== "None"),
        familyHistory: familyHistory.filter((x) => x !== "None"),
        medications: medications
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean),
      };

      if (questionnaire) {
        await api.put("/questionnaire", payload);
      } else {
        await api.post("/questionnaire", payload);
      }

      setSuccess(true);
      fetchQuestionnaire();
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Health Profile Saved!</h2>
            <p className="text-gray-500 mb-6">
              Your health questionnaire has been {questionnaire ? "updated" : "submitted"} successfully.
              You can now browse and apply for insurance plans.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setSuccess(false)} variant="outline">
                Edit Responses
              </Button>
              <Button onClick={() => (window.location.href = "/dashboard/browse-plans")}>
                Browse Plans
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Health Profile</h1>
        <p className="text-gray-500 mt-1">
          Complete your health questionnaire to apply for insurance plans.
          {questionnaire && (
            <Badge className="ml-2 bg-green-50 text-green-700">Completed</Badge>
          )}
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s}
            </div>
            <span className="text-sm text-gray-600 hidden sm:inline">
              {s === 1 ? "Physical" : s === 2 ? "Lifestyle" : "Medical"}
            </span>
            {s < 3 && <div className="flex-1 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Physical Stats */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Physical Information</CardTitle>
            <CardDescription>Basic physical measurements for risk assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  placeholder="175"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  placeholder="72"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </div>
            </div>
            {bmi && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  Calculated BMI: <strong>{bmi}</strong>
                  {parseFloat(bmi) < 18.5
                    ? " (Underweight)"
                    : parseFloat(bmi) < 25
                    ? " (Normal)"
                    : parseFloat(bmi) < 30
                    ? " (Overweight)"
                    : " (Obese)"}
                </span>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Lifestyle */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Lifestyle Information</CardTitle>
            <CardDescription>Help us understand your daily habits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Do you smoke?</Label>
              <div className="flex gap-3">
                <Button
                  variant={!smoker ? "default" : "outline"}
                  onClick={() => setSmoker(false)}
                  size="sm"
                >
                  No
                </Button>
                <Button
                  variant={smoker ? "default" : "outline"}
                  onClick={() => setSmoker(true)}
                  size="sm"
                >
                  Yes
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alcohol Consumption</Label>
              <div className="flex gap-2">
                {["never", "occasional", "regular"].map((freq) => (
                  <Button
                    key={freq}
                    variant={alcoholFrequency === freq ? "default" : "outline"}
                    onClick={() => setAlcoholFrequency(freq)}
                    size="sm"
                    className="capitalize"
                  >
                    {freq}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Exercise Frequency</Label>
              <div className="flex flex-wrap gap-2">
                {["sedentary", "light", "moderate", "active"].map((freq) => (
                  <Button
                    key={freq}
                    variant={exerciseFrequency === freq ? "default" : "outline"}
                    onClick={() => setExerciseFrequency(freq)}
                    size="sm"
                    className="capitalize"
                  >
                    {freq}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Medical History */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Medical History</CardTitle>
            <CardDescription>
              This information helps vendors assess your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Pre-existing Conditions</Label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <Button
                    key={c}
                    variant={preExistingConditions.includes(c) ? "default" : "outline"}
                    onClick={() => toggleCondition(c)}
                    size="sm"
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Family Medical History</Label>
              <div className="flex flex-wrap gap-2">
                {FAMILY_HISTORY.map((f) => (
                  <Button
                    key={f}
                    variant={familyHistory.includes(f) ? "default" : "outline"}
                    onClick={() => toggleFamily(f)}
                    size="sm"
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Medications (comma-separated)</Label>
              <Input
                placeholder="e.g. Metformin, Lisinopril"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : questionnaire
                  ? "Update Profile"
                  : "Submit Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

