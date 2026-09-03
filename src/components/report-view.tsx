"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import { FullReport } from "@/components/full-report";
import { RiskRadar } from "@/components/risk-radar";
import { isStoredAnalysis, reportToRadarDimensions, type RiskLevel, type StoredAnalysis } from "@/lib/analysis-report";
import { readSharedAnalysis, SHARED_REPORT_ID } from "@/lib/shared-report";

const RISK_CONTENT: Record<RiskLevel, { label: string; badge: string; eyebrow: string }> = {
  low: { label: "Low risk", badge: "border-emerald-300 bg-emerald-100 text-emerald-900", eyebrow: "No clear pattern found" },
  medium: { label: "Medium risk", badge: "border-amber-300 bg-amber-100 text-amber-950", eyebrow: "Worth a closer look" },
  high: { label: "High risk", badge: "border-orange-300 bg-orange-100 text-orange-950", eyebrow: "Multiple warning patterns" },
  critical: { label: "Red alert", badge: "border-[#98234b]/35 bg-[#98234b]/10 text-[#7d1839]", eyebrow: "Financial scam pattern detected" },
};

const LOADING_SNAPSHOT = "__datexray_loading__";
const MISSING_SNAPSHOT = "__datexray_missing__";
const UNLOCKED_SNAPSHOT = "unlocked";
const LOCKED_SNAPSHOT = "locked";
const REPORT_ACCESS_EVENT = "datexray:report-access";

function subscribeToReportStore(onStoreChange: () => void) {
  window.addEventListener("hashchange", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("hashchange", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerSnapshot() {
  return LOADING_SNAPSHOT;
}

function subscribeToReportAccess(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(REPORT_ACCESS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(REPORT_ACCESS_EVENT, onStoreChange);
  };
}

export function ReportView({ reportId, devMode }: { reportId: string; devMode: boolean }) {
  const isSharedRoute = reportId === SHARED_REPORT_ID;
  const getSnapshot = useCallback(
    () => {
      try {
        if (isSharedRoute) {
          const shared = readSharedAnalysis(window.location.hash);
          return shared ? JSON.stringify(shared) : MISSING_SNAPSHOT;
        }
        return sessionStorage.getItem(`datexray:report:${reportId}`) ?? MISSING_SNAPSHOT;
      } catch {
        return MISSING_SNAPSHOT;
      }
    },
    [isSharedRoute, reportId],
  );
  const rawSnapshot = useSyncExternalStore(subscribeToReportStore, getSnapshot, getServerSnapshot);
  const getUnlockSnapshot = useCallback(() => {
    if (devMode || isSharedRoute) return UNLOCKED_SNAPSHOT;
    try {
      const rawAccess = localStorage.getItem(`datexray:report-access:${reportId}`);
      if (!rawAccess) return LOCKED_SNAPSHOT;
      const access = JSON.parse(rawAccess) as { status?: unknown };
      return access.status === UNLOCKED_SNAPSHOT ? UNLOCKED_SNAPSHOT : LOCKED_SNAPSHOT;
    } catch {
      return LOCKED_SNAPSHOT;
    }
  }, [devMode, isSharedRoute, reportId]);
  const getUnlockServerSnapshot = useCallback(
    () => devMode || isSharedRoute ? UNLOCKED_SNAPSHOT : LOCKED_SNAPSHOT,
    [devMode, isSharedRoute],
  );
  const unlockSnapshot = useSyncExternalStore(subscribeToReportAccess, getUnlockSnapshot, getUnlockServerSnapshot);
  const stored = useMemo<StoredAnalysis | null>(() => {
    if (rawSnapshot === LOADING_SNAPSHOT || rawSnapshot === MISSING_SNAPSHOT) return null;
    try {
      const parsed = JSON.parse(rawSnapshot) as unknown;
      return isStoredAnalysis(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [rawSnapshot]);
  const isMissing = rawSnapshot !== LOADING_SNAPSHOT && !stored;
  const isUnlocked = unlockSnapshot === UNLOCKED_SNAPSHOT;

  useEffect(() => {
    if (!devMode || isSharedRoute || !stored) return;
    try {
      const accessKey = `datexray:report-access:${reportId}`;
      if (!localStorage.getItem(accessKey)) {
        localStorage.setItem(accessKey, JSON.stringify({
          reportId,
          status: UNLOCKED_SNAPSHOT,
          source: "dev_mode",
          unlockedAt: new Date().toISOString(),
        }));
        window.dispatchEvent(new Event(REPORT_ACCESS_EVENT));
      }
    } catch {
      // DEV_MODE still unlocks the in-memory view when browser storage is unavailable.
    }
  }, [devMode, isSharedRoute, reportId, stored]);

  if (!stored && !isMissing) {
    return <div className="grid min-h-[60vh] place-items-center text-sm font-bold text-slate-500">Loading your report…</div>;
  }

  if (!stored) {
    return (
      <div className="mx-auto grid min-h-[65vh] max-w-xl place-items-center px-5 text-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Private report</p>
          <h1 className="font-display mt-4 text-5xl font-black tracking-[-0.05em] text-slate-950">This report is no longer in this tab.</h1>
          <p className="mt-5 leading-7 text-slate-600">Reports stay in this browser tab and are not stored on the server. Run the conversation again to recreate it.</p>
          <Link href="/analyze" className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 font-extrabold text-white">Analyze a conversation</Link>
        </div>
      </div>
    );
  }

  const { report, provider } = stored;
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
          <p className="text-sm font-bold leading-6">Stop money transfers and do not share account access. Contact your bank or payment provider if money has already been sent.</p>
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
        report={report}
        stored={stored}
        isUnlocked={isUnlocked}
        isShared={isSharedRoute}
        devMode={devMode}
      />
    </div>
  );
}
