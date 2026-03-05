"use client";

interface HealthScoreGaugeProps {
  score: number;
  trend?: "improving" | "stable" | "declining" | string;
}

export function HealthScoreGauge({ score, trend }: HealthScoreGaugeProps) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getStrokeColor = (s: number) => {
    if (s >= 80) return "stroke-green-500";
    if (s >= 60) return "stroke-yellow-500";
    return "stroke-red-500";
  };

  const getTrendLabel = (t?: string) => {
    if (t === "improving") return { text: "Improving", icon: "↗" };
    if (t === "declining") return { text: "Declining", icon: "↘" };
    return { text: "Stable", icon: "→" };
  };

  const circumference = 2 * Math.PI * 80;
  const offset = circumference * (1 - score / 100);
  const trendInfo = getTrendLabel(trend);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border">
      <div className="relative w-48 h-48">
        <svg className="transform -rotate-90 w-48 h-48" viewBox="0 0 192 192">
          <circle
            cx="96"
            cy="96"
            r="80"
            strokeWidth="12"
            fill="transparent"
            className="stroke-gray-100"
          />
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
          <span className={`text-5xl font-bold ${getColor(score)}`}>
            {score}
          </span>
          <span className="text-sm text-gray-500 mt-1">Health Score</span>
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-sm text-gray-600">
          <span>{trendInfo.icon}</span>
          <span>{trendInfo.text}</span>
        </div>
      )}
    </div>
  );
}

