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

export type FreeAnalysisReport = Pick<AnalysisReport, "risk_level" | "summary" | "radar" | "disclaimers">;
export type FullReportTier = Pick<AnalysisReport, "signal_hits" | "next_checklist">;

export type AnalysisProviderName = "anthropic" | "deepseek" | "mock";

export type StoredAnalysis = {
  report: AnalysisReport;
  provider: AnalysisProviderName;
  createdAt: string;
};

export type StoredFreeAnalysis = {
  report: FreeAnalysisReport;
  provider: AnalysisProviderName;
  createdAt: string;
  expiresAt: string;
  unlockToken: string;
};

export type UnlockedAnalysis = {
  stored: StoredAnalysis;
  shareToken: string;
  source: "daily_free" | "dev_mode";
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

export function reportToRadarDimensions(report: FreeAnalysisReport | AnalysisReport): RadarDimension[] {
  return SIGNAL_CATEGORIES.map((category) => {
    const categoryHits = ("signal_hits" in report ? report.signal_hits : []).filter(
      (hit) => signalIndex.get(hit.signal_id)?.category === category,
    );

    return {
      key: category,
      label: CATEGORY_LABELS[category],
      hits: report.radar[category],
      containsHighRiskSignal: categoryHits.some(
        (hit) => signalIndex.get(hit.signal_id)?.severity === "high",
      ),
      containsScamSignal: category === "scam" && report.radar.scam > 0,
    };
  });
}

function hasValidFreeReport(report: Partial<FreeAnalysisReport> | undefined) {
  const radar = report?.radar as Partial<Record<SignalCategory, unknown>> | undefined;
  const hasValidRadar = Boolean(radar) && SIGNAL_CATEGORIES.every(
    (category) => Number.isInteger(radar?.[category]) && Number(radar?.[category]) >= 0,
  );

  return (
    Boolean(report) &&
    typeof report?.summary === "string" &&
    typeof report?.disclaimers === "string" &&
    RISK_LEVELS.includes(report?.risk_level as RiskLevel) &&
    hasValidRadar
  );
}

function hasValidFullTier(report: Partial<FullReportTier> | undefined) {
  const hasValidHits = Array.isArray(report?.signal_hits) && report.signal_hits.every((candidate) => {
    if (!candidate || typeof candidate !== "object") return false;
    const hit = candidate as Partial<SignalHit>;
    return (
      typeof hit.signal_id === "string" &&
      typeof hit.signal_name === "string" &&
      typeof hit.matched_quote === "string" &&
      (hit.timestamp_sec === null || typeof hit.timestamp_sec === "number") &&
      typeof hit.explanation === "string" &&
      typeof hit.advice === "string"
    );
  });

  return hasValidHits && Array.isArray(report?.next_checklist) && report.next_checklist.every((item) => typeof item === "string");
}

export function toFreeAnalysisReport(report: AnalysisReport): FreeAnalysisReport {
  return {
    risk_level: report.risk_level,
    summary: report.summary,
    radar: report.radar,
    disclaimers: report.disclaimers,
  };
}

export function toFullReportTier(report: AnalysisReport): FullReportTier {
  return {
    signal_hits: report.signal_hits,
    next_checklist: report.next_checklist,
  };
}

export function isStoredFreeAnalysis(value: unknown): value is StoredFreeAnalysis {
  if (!value || typeof value !== "object") return false;
  const stored = value as Partial<StoredFreeAnalysis>;
  return (
    hasValidFreeReport(stored.report) &&
    ["anthropic", "deepseek", "mock"].includes(stored.provider ?? "") &&
    typeof stored.createdAt === "string" &&
    typeof stored.expiresAt === "string" &&
    typeof stored.unlockToken === "string" && stored.unlockToken.length >= 32
  );
}

export function isFullReportTier(value: unknown): value is FullReportTier {
  return Boolean(value) && typeof value === "object" && hasValidFullTier(value as Partial<FullReportTier>);
}

export function isUnlockedAnalysis(value: unknown): value is UnlockedAnalysis {
  if (!value || typeof value !== "object") return false;
  const unlocked = value as Partial<UnlockedAnalysis>;
  return (
    isStoredAnalysis(unlocked.stored) &&
    typeof unlocked.shareToken === "string" && unlocked.shareToken.length >= 32 &&
    (unlocked.source === "daily_free" || unlocked.source === "dev_mode")
  );
}

export function isStoredAnalysis(value: unknown): value is StoredAnalysis {
  if (!value || typeof value !== "object") return false;
  const stored = value as Partial<StoredAnalysis>;
  const report = stored.report as Partial<AnalysisReport> | undefined;

  return (
    hasValidFreeReport(report) &&
    hasValidFullTier(report) &&
    ["anthropic", "deepseek", "mock"].includes(stored.provider ?? "") &&
    typeof stored.createdAt === "string"
  );
}
