"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HealthScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
  trend?: string | null;
}

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: "hsl(var(--chart-1))", text: "text-green-600 dark:text-green-400", label: "Excellent" };
  if (score >= 60) return { stroke: "hsl(199, 89%, 48%)", text: "text-blue-600 dark:text-blue-400", label: "Good" };
  if (score >= 40) return { stroke: "hsl(43, 74%, 66%)", text: "text-yellow-600 dark:text-yellow-400", label: "Fair" };
  return { stroke: "hsl(0, 84%, 60%)", text: "text-red-600 dark:text-red-400", label: "Needs Improvement" };
}

export function HealthScoreGauge({ score, size = 180, label = "Health Score", trend }: HealthScoreGaugeProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={10}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn("text-4xl font-bold", color.text)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground">{color.label}</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium">{label}</p>
      {trend && (
        <p className={cn(
          "text-xs",
          trend === "improving" && "text-green-600 dark:text-green-400",
          trend === "stable" && "text-blue-600 dark:text-blue-400",
          trend === "declining" && "text-red-600 dark:text-red-400"
        )}>
          {trend === "improving" ? "Trending up" : trend === "declining" ? "Trending down" : "Stable"}
        </p>
      )}
    </div>
  );
}
