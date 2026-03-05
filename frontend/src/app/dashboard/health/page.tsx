"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { format, subDays } from "date-fns";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHealthScoreHistory, useHealthMetrics } from "@/hooks/useHealthData";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function HealthMetricsPage() {
  const [days, setDays] = useState(30);
  const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
  const endDate = format(new Date(), "yyyy-MM-dd");

  const { data: scoreHistory, isLoading: scoresLoading } = useHealthScoreHistory(days);
  const { data: metricsData, isLoading: metricsLoading } = useHealthMetrics(startDate, endDate);

  const scores = (scoreHistory?.scores || []).map((s) => ({
    date: format(new Date(s.scoreDate!), "MMM d"),
    overall: s.overallScore,
    steps: s.stepsScore,
    activity: s.activityScore,
    sleep: s.sleepScore,
    heart: s.heartScore,
  }));

  const metrics = (metricsData?.metrics || [])
    .sort((a, b) => new Date(a.metricDate).getTime() - new Date(b.metricDate).getTime())
    .map((m) => ({
      date: format(new Date(m.metricDate), "MMM d"),
      steps: m.steps ?? 0,
      activeMinutes: m.activeMinutes ?? 0,
      sleepHours: Number(m.sleepHours ?? 0),
      heartRate: m.restingHeartRate ?? 0,
      calories: m.caloriesBurned ?? 0,
    }));

  const loading = scoresLoading || metricsLoading;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Health Metrics</h1>
        <p className="mt-1 text-muted-foreground">Track your health data and score trends over time</p>
      </motion.div>

      {/* Range Selector */}
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.days}
            variant={days === r.days ? "default" : "outline"}
            size="sm"
            onClick={() => setDays(r.days)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <Tabs defaultValue="scores" className="space-y-6">
          <TabsList>
            <TabsTrigger value="scores">Health Scores</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="sleep">Sleep</TabsTrigger>
            <TabsTrigger value="heart">Heart Rate</TabsTrigger>
          </TabsList>

          <TabsContent value="scores">
            <Card>
              <CardHeader>
                <CardTitle>Health Score Trend</CardTitle>
                <CardDescription>Overall and component scores over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={scores}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend />
                    <Line type="monotone" dataKey="overall" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={false} name="Overall" />
                    <Line type="monotone" dataKey="steps" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} name="Steps" />
                    <Line type="monotone" dataKey="activity" stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} name="Activity" />
                    <Line type="monotone" dataKey="sleep" stroke="hsl(var(--chart-4))" strokeWidth={1.5} dot={false} name="Sleep" />
                    <Line type="monotone" dataKey="heart" stroke="hsl(var(--chart-5))" strokeWidth={1.5} dot={false} name="Heart" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Daily Steps & Activity</CardTitle>
                <CardDescription>Steps and active minutes per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Legend />
                    <Bar dataKey="steps" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Steps" />
                    <Bar dataKey="activeMinutes" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Active Min" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sleep">
            <Card>
              <CardHeader>
                <CardTitle>Sleep Pattern</CardTitle>
                <CardDescription>Hours of sleep per night</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 12]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="sleepHours" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.2} strokeWidth={2} name="Sleep Hours" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heart">
            <Card>
              <CardHeader>
                <CardTitle>Resting Heart Rate</CardTitle>
                <CardDescription>Daily resting heart rate trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={metrics.filter((m) => m.heartRate > 0)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="heartRate" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 3 }} name="BPM" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
