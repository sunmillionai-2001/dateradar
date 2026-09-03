"use client";

import { useState } from "react";

import type { AnalysisReport, StoredAnalysis } from "@/lib/analysis-report";
import { createReadOnlyShareUrl } from "@/lib/shared-report";

type FullReportProps = {
  report: AnalysisReport;
  stored: StoredAnalysis;
  isUnlocked: boolean;
  isShared: boolean;
  devMode: boolean;
};

export function FullReport({ report, stored, isUnlocked, isShared, devMode }: FullReportProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  if (!isUnlocked) {
    return (
      <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-300 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]" aria-labelledby="full-report-title">
        <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="grid size-12 place-items-center rounded-full border border-white/15 bg-white/10 text-xl" aria-hidden="true">⌁</span>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-lime-300">Full evidence report</p>
            <h2 id="full-report-title" className="font-display mt-2 text-4xl font-black tracking-[-0.045em]">Unlock the complete report</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">See every matched quote, what it may indicate, a practical response, your next-date checklist, and a private read-only sharing link.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center lg:min-w-64">
            <p className="text-3xl font-black">$4.99</p>
            <button type="button" disabled className="mt-4 min-h-12 w-full cursor-not-allowed rounded-full bg-slate-700 px-5 text-sm font-extrabold text-slate-300">Unlock full report</button>
            <p className="mt-3 text-xs leading-5 text-slate-500">Secure payment via Paddle is coming next.</p>
          </div>
        </div>
      </section>
    );
  }

  async function copyShareLink() {
    try {
      const shareUrl = createReadOnlyShareUrl(stored, window.location.origin);
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <section className="mt-10 border-t border-slate-300 pt-10" aria-labelledby="full-report-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Complete report</p>
            {isShared ? (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">Read-only share</span>
            ) : devMode ? (
              <span className="rounded-full bg-lime-300 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-950">Dev mode · unlocked</span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-900">Unlocked</span>
            )}
          </div>
          <h2 id="full-report-title" className="font-display mt-3 text-5xl font-black tracking-[-0.055em] text-slate-950">Evidence, then action.</h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-500">Each finding stays tied to the exact wording that triggered it. Context still matters.</p>
      </div>

      <div className="mt-8 grid gap-5">
        {report.signal_hits.length ? report.signal_hits.map((hit, index) => (
          <article key={hit.signal_id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.06)]">
            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-black text-white">{index + 1}</span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.13em] text-slate-400">{hit.signal_id}</p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-950">{hit.signal_name}</h3>
                  </div>
                </div>
                <blockquote className="mt-6 rounded-2xl border-l-4 border-lime-400 bg-[#f5f6ef] p-5 text-base font-bold leading-7 text-slate-800">
                  “{hit.matched_quote}”
                  {hit.timestamp_sec !== null && <footer className="mt-3 text-xs font-black uppercase tracking-wide text-slate-400">At {formatTimestamp(hit.timestamp_sec)}</footer>}
                </blockquote>
              </div>
              <div className="grid gap-4">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">What it may indicate</p>
                  <p className="mt-3 leading-7 text-slate-700">{hit.explanation}</p>
                </div>
                <div className="rounded-2xl border border-lime-300/70 bg-lime-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-lime-800">What you can say or do</p>
                  <p className="mt-3 font-semibold leading-7 text-slate-800">{hit.advice}</p>
                </div>
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-7">
            <h3 className="text-lg font-extrabold text-emerald-950">No evidence-backed signal hits</h3>
            <p className="mt-2 leading-7 text-emerald-900/75">This transcript did not support a catalog match. Keep watching for consistency over time rather than treating one result as proof.</p>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8" aria-labelledby="checklist-title">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Next time</p>
          <h3 id="checklist-title" className="mt-2 text-2xl font-black text-slate-950">Your observation checklist</h3>
          <ol className="mt-6 grid gap-4">
            {report.next_checklist.map((item, index) => (
              <li key={`${index}-${item}`} className="flex gap-4 text-sm leading-6 text-slate-700">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-lime-300 text-xs font-black text-slate-950">{index + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[1.75rem] bg-slate-950 p-6 text-white sm:p-8" aria-labelledby="share-title">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-300">Private sharing</p>
          <h3 id="share-title" className="mt-2 text-2xl font-black">Get a read-only link</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">Anyone with the link can read the evidence included above. The report is carried in the link and is not stored on DateXray’s server.</p>
          <button type="button" onClick={copyShareLink} className="mt-6 min-h-12 w-full rounded-full bg-white px-5 text-sm font-extrabold text-slate-950 transition hover:bg-lime-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300">
            {copyState === "copied" ? "Link copied" : copyState === "failed" ? "Could not copy — try again" : "Copy read-only link"}
          </button>
        </section>
      </div>
    </section>
  );
}

function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
