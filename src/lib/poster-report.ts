import signalLibrary from "../../signals.json";

import type { AnalysisReport, RiskLevel, SignalCategory, SignalHit } from "@/lib/analysis-report";

type SignalSeverity = "medium" | "high" | "critical";

type SignalMetadata = {
  id: string;
  name_en: string;
  category: SignalCategory;
  severity: SignalSeverity;
};

export type PosterSignal = SignalHit & {
  category: SignalCategory;
  categoryLabel: string;
  severity: SignalSeverity;
};

export type PosterRiskContent = {
  label: string;
  eyebrow: string;
  accent: string;
  softAccent: string;
  conclusion: string;
  guidance: string;
};

const metadataById = new Map(
  (signalLibrary.signals as SignalMetadata[]).map((signal) => [signal.id, signal] as const),
);

const SEVERITY_PRIORITY: Record<SignalSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
};

const CATEGORY_PRIORITY: Record<SignalCategory, number> = {
  scam: 6,
  manipulative: 5,
  extractive: 4,
  deceptive: 3,
  breadcrumbing: 2,
  avoidant: 1,
};

const CATEGORY_LABELS: Record<SignalCategory, string> = {
  scam: "Scam risk",
  manipulative: "Manipulation",
  extractive: "Taking",
  deceptive: "Deception",
  breadcrumbing: "Mixed signals",
  avoidant: "Avoidance",
};

export const POSTER_RISK_CONTENT: Record<RiskLevel, PosterRiskContent> = {
  low: {
    label: "LOW RISK",
    eyebrow: "No clear warning pattern",
    accent: "#3cff8f",
    softAccent: "rgba(60, 255, 143, 0.2)",
    conclusion: "No clear warning pattern is supported by this conversation.",
    guidance: "Treat this as one input, not a verdict. Consider watching for consistency over time.",
  },
  medium: {
    label: "MEDIUM RISK",
    eyebrow: "Patterns worth watching",
    accent: "#ffe45c",
    softAccent: "rgba(255, 228, 92, 0.2)",
    conclusion: "Some observable patterns may be worth watching in context.",
    guidance: "Treat this as a heads-up, not a verdict. It may help to note whether these patterns repeat over time.",
  },
  high: {
    label: "HIGH RISK",
    eyebrow: "Multiple warning patterns",
    accent: "#ff8a3d",
    softAccent: "rgba(255, 138, 61, 0.2)",
    conclusion: "Several observable warning patterns appear together.",
    guidance: "Treat this as a heads-up, not a verdict. Consider noting whether these behaviors persist over time before any larger commitment.",
  },
  critical: {
    label: "RED ALERT",
    eyebrow: "Potential scam warning",
    accent: "#98234b",
    softAccent: "rgba(152, 35, 75, 0.28)",
    conclusion: "This conversation includes a potential scam-related warning pattern.",
    guidance: "Treat this as a serious heads-up, not a verdict. Consider pausing financial commitments and verifying details with a trusted person or relevant provider.",
  },
};

export function selectPosterSignals(report: AnalysisReport): PosterSignal[] {
  return report.signal_hits
    .map((hit, originalIndex) => {
      const metadata = metadataById.get(hit.signal_id);
      return metadata ? { hit, metadata, originalIndex } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((left, right) => (
      SEVERITY_PRIORITY[right.metadata.severity] - SEVERITY_PRIORITY[left.metadata.severity]
      || CATEGORY_PRIORITY[right.metadata.category] - CATEGORY_PRIORITY[left.metadata.category]
      || left.originalIndex - right.originalIndex
    ))
    .slice(0, 3)
    .map(({ hit, metadata }) => ({
      ...hit,
      category: metadata.category,
      categoryLabel: CATEGORY_LABELS[metadata.category],
      severity: metadata.severity,
    }));
}
