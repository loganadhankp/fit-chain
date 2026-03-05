"use client";

import { Brain } from "lucide-react";

interface AIScoreGaugeProps {
  score: number | null;
  riskCategory: string | null;
  confidence: number | null;
}

export function AIScoreGauge({ score, riskCategory, confidence }: AIScoreGaugeProps) {
  if (score === null || score === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border min-h-[280px]">
        <Brain className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-400 text-center">
          AI score will appear after<br />metrics are recorded
        </p>
      </div>
    );
  }

  const getColor = (s: number) => {
    if (s >= 80) return "text-emerald-500";
    if (s >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  const getStrokeColor = (s: number) => {
    if (s >= 80) return "stroke-emerald-500";
    if (s >= 60) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  const getBadgeColor = (cat: string | null) => {
    if (cat === "low") return "bg-emerald-100 text-emerald-700";
    if (cat === "moderate") return "bg-amber-100 text-amber-700";
    return "bg-rose-100 text-rose-700";
  };

  const circumference = 2 * Math.PI * 80;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border">
      <div className="relative w-48 h-48">
        <svg className="transform -rotate-90 w-48 h-48" viewBox="0 0 192 192">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            strokeWidth="12"
            fill="transparent"
            className="stroke-gray-100"
          />
          {/* AI score arc */}
          <circle
            cx="96"
            cy="96"
            r="80"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${getStrokeColor(score)}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Brain className="w-5 h-5 text-gray-400 mb-1" />
          <span className={`text-5xl font-bold ${getColor(score)}`}>
            {score}
          </span>
          <span className="text-sm text-gray-500 mt-1">AI Score</span>
        </div>
      </div>

      {/* Risk category badge */}
      <div className="mt-4 flex flex-col items-center gap-2">
        {riskCategory && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getBadgeColor(riskCategory)}`}
          >
            {riskCategory} risk
          </span>
        )}
        {confidence !== null && (
          <span className="text-xs text-gray-400">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>
    </div>
  );
}

