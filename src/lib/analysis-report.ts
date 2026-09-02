import type { RadarDimension } from "@/components/risk-radar";

import signalLibrary from "../../signals.json";

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export const SIGNAL_CATEGORIES = [
  "avoidant",
  "extractive",
  "breadcrumbing",
  "manipulative",
  "deceptive",
  "scam",
] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
export type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

export type SignalHit = {
  signal_id: string;
  signal_name: string;
  matched_quote: string;
  timestamp_sec: number | null;
  explanation: string;
  advice: string;
};

export type AnalysisReport = {
  risk_level: RiskLevel;
  summary: string;
  radar: Record<SignalCategory, number>;
  signal_hits: SignalHit[];
  next_checklist: string[];
  disclaimers: string;
};

export type AnalysisProviderName = "anthropic" | "deepseek" | "mock";

export type StoredAnalysis = {
  report: AnalysisReport;
  provider: AnalysisProviderName;
  createdAt: string;
};

const CATEGORY_LABELS: Record<SignalCategory, string> = {
  avoidant: "Avoidance",
  extractive: "Taking",
  breadcrumbing: "Mixed",
  manipulative: "Manipulation",
  deceptive: "Deception",
  scam: "Scam risk",
};

const signalIndex = new Map(
  signalLibrary.signals.map((signal) => [signal.id, signal] as const),
);

export function reportToRadarDimensions(report: AnalysisReport): RadarDimension[] {
  return SIGNAL_CATEGORIES.map((category) => {
    const categoryHits = report.signal_hits.filter(
      (hit) => signalIndex.get(hit.signal_id)?.category === category,
    );

    return {
      key: category,
      label: CATEGORY_LABELS[category],
      hits: report.radar[category],
      containsHighRiskSignal: categoryHits.some(
        (hit) => signalIndex.get(hit.signal_id)?.severity === "high",
      ),
      containsScamSignal: category === "scam" && categoryHits.length > 0,
    };
  });
}

export function isStoredAnalysis(value: unknown): value is StoredAnalysis {
  if (!value || typeof value !== "object") return false;
  const stored = value as Partial<StoredAnalysis>;
  const report = stored.report as Partial<AnalysisReport> | undefined;

  const radar = report?.radar as Partial<Record<SignalCategory, unknown>> | undefined;
  const hasValidRadar = Boolean(radar) && SIGNAL_CATEGORIES.every(
    (category) => Number.isInteger(radar?.[category]) && Number(radar?.[category]) >= 0,
  );
  const hasValidHits = Array.isArray(report?.signal_hits) && report.signal_hits.every((candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    const hit = candidate as Partial<SignalHit>;
    return typeof hit.signal_id === "string" && typeof hit.signal_name === "string" && typeof hit.matched_quote === "string";
  });

  return (
    Boolean(report) &&
    typeof report?.summary === "string" &&
    typeof report?.disclaimers === "string" &&
    RISK_LEVELS.includes(report?.risk_level as RiskLevel) &&
    hasValidHits &&
    Array.isArray(report?.next_checklist) &&
    hasValidRadar &&
    ["anthropic", "deepseek", "mock"].includes(stored.provider ?? "") &&
    typeof stored.createdAt === "string"
  );
}
