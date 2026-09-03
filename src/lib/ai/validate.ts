import signalLibrary from "../../../signals.json";

import { SIGNAL_CATEGORIES, type AnalysisReport, type RiskLevel, type SignalCategory, type SignalHit } from "@/lib/analysis-report";

export const REPORT_DISCLAIMER = "DateXray is an informational screening tool, not a diagnosis or definitive judgment. Review patterns over time and seek trusted or professional help when safety or money is at risk.";

const signalIndex = new Map(signalLibrary.signals.map((signal) => [signal.id, signal] as const));

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function cleanText(value: unknown, fallback: string, maxLength = 500) {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function quoteAppearsInTranscript(quote: string, transcript: string) {
  const normalize = (value: string) => value.replace(/[\s\u00a0]+/g, " ").trim().toLocaleLowerCase();
  return quote.length >= 2 && normalize(transcript).includes(normalize(quote));
}

function parseSignalHits(value: unknown, transcript: string): SignalHit[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const hits: SignalHit[] = [];

  for (const candidate of value) {
    const raw = asRecord(candidate);
    const signalId = typeof raw.signal_id === "string" ? raw.signal_id.trim() : "";
    const signal = signalIndex.get(signalId);
    const matchedQuote = typeof raw.matched_quote === "string" ? raw.matched_quote.trim() : "";
    if (!signal || seen.has(signalId) || !quoteAppearsInTranscript(matchedQuote, transcript)) continue;

    seen.add(signalId);
    hits.push({
      signal_id: signal.id,
      signal_name: signal.name_en,
      matched_quote: matchedQuote.slice(0, 300),
      timestamp_sec: null,
      explanation: cleanText(raw.explanation, `This wording matches the observable criteria for ${signal.name_en}.`),
      advice: cleanText(raw.advice, "Consider asking a clear question and looking for a consistent pattern over time."),
    });
  }
  return hits;
}

function calculateRisk(hits: SignalHit[]): RiskLevel {
  const categories = hits.map((hit) => signalIndex.get(hit.signal_id)?.category);
  if (categories.includes("scam")) return "critical";
  const manipulative = categories.filter((category) => category === "manipulative").length;
  const extractive = categories.filter((category) => category === "extractive").length;
  if (hits.length >= 3 || manipulative >= 2 || extractive >= 2) return "high";
  if (hits.length === 2) return "medium";
  return "low";
}

function buildRadar(hits: SignalHit[]): Record<SignalCategory, number> {
  const radar = Object.fromEntries(SIGNAL_CATEGORIES.map((category) => [category, 0])) as Record<SignalCategory, number>;
  for (const hit of hits) {
    const category = signalIndex.get(hit.signal_id)?.category as SignalCategory | undefined;
    if (category) radar[category] += 1;
  }
  return radar;
}

function defaultSummary(riskLevel: RiskLevel) {
  if (riskLevel === "critical") return "This conversation includes a potential financial scam warning pattern.";
  if (riskLevel === "high") return "Several observable warning patterns appear together in this conversation.";
  if (riskLevel === "medium") return "Two observable warning signals merit a closer look over time.";
  return "No clear warning pattern is supported by the conversation provided.";
}

function parseChecklist(value: unknown, riskLevel: RiskLevel) {
  const items = Array.isArray(value) ? value.map((item) => cleanText(item, "", 220)).filter(Boolean).slice(0, 3) : [];
  if (items.length >= 2) return items;
  return riskLevel === "critical"
    ? ["Consider pausing transfers and keeping account access private.", "It may help to contact your bank or payment provider and tell a trusted person."]
    : ["Consider looking for consistent behavior over time.", "It may help to ask a clear question and notice whether the answer is direct."];
}

export function validateAndFinalizeReport(value: unknown, transcript: string): AnalysisReport {
  const raw = asRecord(value);
  const signalHits = parseSignalHits(raw.signal_hits, transcript);
  const riskLevel = calculateRisk(signalHits);
  return {
    risk_level: riskLevel,
    summary: cleanText(raw.summary, defaultSummary(riskLevel), 240),
    radar: buildRadar(signalHits),
    signal_hits: signalHits,
    next_checklist: parseChecklist(raw.next_checklist, riskLevel),
    disclaimers: REPORT_DISCLAIMER,
  };
}
