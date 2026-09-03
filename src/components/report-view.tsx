"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { FullReport } from "@/components/full-report";
import { RiskRadar } from "@/components/risk-radar";
import {
  isFullReportTier,
  isStoredFreeAnalysis,
  isUnlockedAnalysis,
  reportToRadarDimensions,
  toFreeAnalysisReport,
  type RiskLevel,
  type StoredAnalysis,
  type StoredFreeAnalysis,
  type UnlockedAnalysis,
} from "@/lib/analysis-report";
import { PRIVACY_PROCESSING_NOTICE } from "@/lib/privacy";

const RISK_CONTENT: Record<RiskLevel, { label: string; badge: string; eyebrow: string }> = {
  low: { label: "Low risk", badge: "border-emerald-300 bg-emerald-100 text-emerald-900", eyebrow: "No clear pattern found" },
  medium: { label: "Medium risk", badge: "border-amber-300 bg-amber-100 text-amber-950", eyebrow: "Worth a closer look" },
  high: { label: "High risk", badge: "border-orange-300 bg-orange-100 text-orange-950", eyebrow: "Multiple warning patterns" },
  critical: { label: "Red alert", badge: "border-[#98234b]/35 bg-[#98234b]/10 text-[#7d1839]", eyebrow: "Financial scam pattern detected" },
};

const LOADING_SNAPSHOT = "__datexray_loading__";
const MISSING_SNAPSHOT = "__datexray_missing__";

type UnlockState = "idle" | "working" | "payment_required" | "failed";

type ReportViewProps = {
  reportId: string;
  devMode: boolean;
  sharedAnalysis: StoredAnalysis | null;
  shareToken: string;
  invalidSharedLink: boolean;
};

function subscribeToReportStore(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getServerSnapshot() {
  return LOADING_SNAPSHOT;
}

export function ReportView({ reportId, devMode, sharedAnalysis, shareToken, invalidSharedLink }: ReportViewProps) {
  const isShared = Boolean(sharedAnalysis);
  const getSnapshot = useCallback(() => {
    if (isShared || invalidSharedLink) return MISSING_SNAPSHOT;
    try {
      return sessionStorage.getItem(`datexray:report:${reportId}`) ?? MISSING_SNAPSHOT;
    } catch {
      return MISSING_SNAPSHOT;
    }
  }, [invalidSharedLink, isShared, reportId]);
  const rawSnapshot = useSyncExternalStore(subscribeToReportStore, getSnapshot, getServerSnapshot);
  const storedFree = useMemo<StoredFreeAnalysis | null>(() => {
    if (rawSnapshot === LOADING_SNAPSHOT || rawSnapshot === MISSING_SNAPSHOT) return null;
    try {
      const parsed = JSON.parse(rawSnapshot) as unknown;
      return isStoredFreeAnalysis(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [rawSnapshot]);
  const getUnlockedSnapshot = useCallback(() => {
    if (isShared || invalidSharedLink) return MISSING_SNAPSHOT;
    try {
      return sessionStorage.getItem(`datexray:unlocked-report:${reportId}`) ?? MISSING_SNAPSHOT;
    } catch {
      return MISSING_SNAPSHOT;
    }
  }, [invalidSharedLink, isShared, reportId]);
  const rawUnlockedSnapshot = useSyncExternalStore(subscribeToReportStore, getUnlockedSnapshot, getServerSnapshot);
  const cachedUnlocked = useMemo<UnlockedAnalysis | null>(() => {
    if (rawUnlockedSnapshot === LOADING_SNAPSHOT || rawUnlockedSnapshot === MISSING_SNAPSHOT) return null;
    try {
      const parsed = JSON.parse(rawUnlockedSnapshot) as unknown;
      return isUnlockedAnalysis(parsed) && parsed.stored.createdAt === storedFree?.createdAt ? parsed : null;
    } catch {
      return null;
    }
  }, [rawUnlockedSnapshot, storedFree]);
  const [freshUnlocked, setFreshUnlocked] = useState<UnlockedAnalysis | null>(() => (
    sharedAnalysis ? { stored: sharedAnalysis, shareToken, source: "daily_free" } : null
  ));
  const [unlockState, setUnlockState] = useState<UnlockState>("idle");
  const [unlockError, setUnlockError] = useState("");
  const automaticUnlockStarted = useRef(false);
  const unlocked = freshUnlocked ?? cachedUnlocked;
  const cacheChecked = isShared || invalidSharedLink || rawUnlockedSnapshot !== LOADING_SNAPSHOT;

  const requestUnlock = useCallback(async () => {
    if (!storedFree) return;
    setUnlockState("working");
    setUnlockError("");

    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId, unlock_token: storedFree.unlockToken }),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as Record<string, unknown> | null;

      if (response.status === 402 && payload?.code === "payment_required") {
        setUnlockState("payment_required");
        return;
      }
      if (!response.ok || !isFullReportTier(payload?.full_report)) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "The complete report could not be unlocked.");
      }

      const token = typeof payload.share_token === "string" ? payload.share_token : "";
      const source = payload.unlock_source === "dev_mode" ? "dev_mode" : payload.unlock_source === "daily_free" ? "daily_free" : null;
      if (token.length < 32 || !source) throw new Error("The unlock response was incomplete.");

      const nextUnlocked: UnlockedAnalysis = {
        stored: {
          report: { ...storedFree.report, ...payload.full_report },
          provider: storedFree.provider,
          createdAt: storedFree.createdAt,
        },
        shareToken: token,
        source,
      };
      try {
        sessionStorage.setItem(`datexray:unlocked-report:${reportId}`, JSON.stringify(nextUnlocked));
      } catch {
        // The unlocked report remains available in memory for this page visit.
      }
      setFreshUnlocked(nextUnlocked);
      setUnlockState("idle");
    } catch (error) {
      setUnlockState("failed");
      setUnlockError(error instanceof Error ? error.message : "The complete report could not be unlocked.");
    }
  }, [reportId, storedFree]);

  useEffect(() => {
    if (!devMode || !cacheChecked || !storedFree || unlocked || automaticUnlockStarted.current) return;
    automaticUnlockStarted.current = true;
    void requestUnlock();
  }, [cacheChecked, devMode, requestUnlock, storedFree, unlocked]);

  if (invalidSharedLink) {
    return <InvalidSharedReport />;
  }

  const displayStored = sharedAnalysis
    ? { report: toFreeAnalysisReport(sharedAnalysis.report), provider: sharedAnalysis.provider, createdAt: sharedAnalysis.createdAt }
    : storedFree;
  const isMissing = !isShared && rawSnapshot !== LOADING_SNAPSHOT && !storedFree;

  if (!displayStored && !isMissing) {
    return <div className="grid min-h-[60vh] place-items-center text-sm font-bold text-slate-500">Loading your report…</div>;
  }

  if (!displayStored) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-5 text-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Private report</p>
          <h1 className="font-display mt-4 text-5xl font-black tracking-[-0.05em] text-slate-950">This report is no longer in this tab.</h1>
          <p className="mt-5 leading-7 text-slate-600">{PRIVACY_PROCESSING_NOTICE} This browser-tab copy is no longer available, so run the conversation again to recreate it.</p>
          <Link href="/analyze" className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 font-extrabold text-white">Analyze a conversation</Link>
        </div>
      </div>
    );
  }

  const { report, provider } = displayStored;
  const risk = RISK_CONTENT[report.risk_level];
  const dimensions = reportToRadarDimensions(report);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-10 lg:py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${risk.badge}`}>{risk.label}</span>
            {provider === "mock" && <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-500">Mock analysis</span>}
          </div>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{risk.eyebrow}</p>
          <h1 className="font-display mt-1 text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">Your signal snapshot</h1>
        </div>
        <Link href="/analyze" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-800 transition hover:border-slate-950">Analyze another</Link>
      </div>

      {report.risk_level === "critical" && (
        <div className="mt-3 flex gap-3 rounded-2xl border border-[#98234b]/30 bg-[#98234b]/8 px-5 py-3 text-[#68132f]">
          <span aria-hidden="true" className="text-lg">⚠</span>
          <p className="text-sm font-bold leading-6">Consider pausing money transfers and keeping account access private while you verify the details. It may help to contact your bank or payment provider if money has already been sent.</p>
        </div>
      )}

      <div className="mt-3 grid items-start gap-5 lg:grid-cols-[1.16fr_0.84fr]">
        <section className="rounded-[2rem] border border-slate-700/70 bg-[#0f172a] p-4 shadow-[0_26px_70px_rgba(15,23,42,0.2)] sm:p-6" aria-label="Six-category risk radar">
          <RiskRadar key={reportId} dimensions={dimensions} riskLevel={report.risk_level} compact />
        </section>

        <aside className="grid gap-4">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.07)] sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">One-line read</p>
            <p className="font-display mt-4 text-3xl font-black leading-tight tracking-[-0.035em] text-slate-950">{report.summary}</p>
            <div className="mt-8 border-t border-slate-200 pt-6">
              <p className="text-sm font-bold text-slate-950">What this score means</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">The radar counts only evidence-backed matches from the current signal library. A clean category means no supported match in this transcript—not proof that a relationship is safe.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-[#efefe8] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Important</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">{report.disclaimers}</p>
          </section>
        </aside>
      </div>

      <FullReport
        reportId={reportId}
        unlocked={unlocked}
        isShared={isShared}
        devMode={devMode}
        unlockState={unlockState}
        unlockError={unlockError}
        onUnlock={requestUnlock}
      />
    </div>
  );
}

function InvalidSharedReport() {
  return (
    <div className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-5 text-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#98234b]">Invalid link</p>
        <h1 className="font-display mt-4 text-5xl font-black tracking-[-0.05em] text-slate-950">This shared report cannot be verified.</h1>
        <p className="mt-5 leading-7 text-slate-600">The link may be incomplete, modified, or signed by a different deployment. Ask the sender for the original read-only link.</p>
        <Link href="/analyze" className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 font-extrabold text-white">Analyze a conversation</Link>
      </div>
    </div>
  );
}
