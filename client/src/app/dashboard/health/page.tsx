"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthScoreGauge } from "@/components/dashboard/HealthScoreGauge";
import { AIScoreGauge } from "@/components/dashboard/AIScoreGauge";
import { useAppStore } from "@/store/store";
import api from "@/lib/api";

interface Metric {
  metricDate: string;
  steps: number;
  activeMinutes: number;
  sleepHours: number;
  restingHeartRate: number | null;
}

interface ScoreHistory {
  scoreDate: string;
  overallScore: number;
  stepsScore: number;
  activityScore: number;
  sleepScore: number;
  heartScore: number;
  aiRiskScore: number | null;
}

export default function HealthPage() {
  const { healthScore, fetchHealthScore } = useAppStore();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);

  useEffect(() => {
    fetchHealthScore();
    api.get("/health/metrics?startDate=" + thirtyDaysAgo()).then((r) =>
      setMetrics(r.data.metrics.reverse())
    ).catch(() => {});
    api.get("/health/score/history?days=30").then((r) =>
      setScoreHistory(r.data.scores)
    ).catch(() => {});
  }, [fetchHealthScore]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Health Metrics</h1>

      {/* Score overview — dual gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <HealthScoreGauge
          score={healthScore?.overallScore || 0}
          trend={healthScore?.trend}
        />
        <AIScoreGauge
          score={healthScore?.aiRiskScore ?? null}
          riskCategory={healthScore?.aiRiskCategory ?? null}
          confidence={healthScore?.aiConfidence ?? null}
        />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Health Score Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scoreDate" tickFormatter={formatDate} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="overallScore"
                  name="Rule-based"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="aiRiskScore"
                  name="AI Score"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metricDate" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="steps" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metricDate" tickFormatter={formatDate} />
                <YAxis domain={[0, 12]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="sleepHours"
                  stroke="#8b5cf6"
                  fill="#ede9fe"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Heart Rate (Resting)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metrics.filter((m) => m.restingHeartRate)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metricDate" tickFormatter={formatDate} />
                <YAxis domain={[40, 120]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="restingHeartRate"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Minutes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metricDate" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activeMinutes" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// helpers
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

