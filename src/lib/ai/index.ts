import type { AnalysisProviderName, AnalysisReport } from "@/lib/analysis-report";
import { analyzeWithAnthropic } from "@/lib/ai/anthropic";
import { analyzeWithDeepSeek } from "@/lib/ai/deepseek";
import { analyzeWithMock } from "@/lib/ai/mock";
import { validateAndFinalizeReport } from "@/lib/ai/validate";

export type AnalysisOutcome = {
  report: AnalysisReport;
  provider: AnalysisProviderName;
};

export async function analyze(transcript: string): Promise<AnalysisOutcome> {
  const selectedProvider = process.env.AI_PROVIDER?.trim().toLowerCase() === "deepseek"
    ? "deepseek"
    : "anthropic";

  if (selectedProvider === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
    const rawReport = apiKey ? await analyzeWithDeepSeek(transcript, apiKey) : analyzeWithMock(transcript);
    return {
      report: validateAndFinalizeReport(rawReport, transcript),
      provider: apiKey ? "deepseek" : "mock",
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const rawReport = apiKey ? await analyzeWithAnthropic(transcript, apiKey) : analyzeWithMock(transcript);
  return {
    report: validateAndFinalizeReport(rawReport, transcript),
    provider: apiKey ? "anthropic" : "mock",
  };
}
