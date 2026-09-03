import "server-only";

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import type { StoredAnalysis } from "@/lib/analysis-report";

const REPORT_TTL_MS = 10 * 60 * 1_000;
const MAX_PENDING_REPORTS = 5_000;
const DAILY_FREE_UNLOCK_LIMIT = 100;

type PendingReport = {
  accessTokenHash: Buffer;
  expiresAt: number;
  stored: StoredAnalysis;
  timer: ReturnType<typeof setTimeout>;
};

type RuntimeReportState = {
  dailyUnlocks: { count: number; utcDate: string };
  pendingReports: Map<string, PendingReport>;
};

const runtimeGlobal = globalThis as typeof globalThis & {
  __datexrayReportState?: RuntimeReportState;
};

const state = runtimeGlobal.__datexrayReportState ?? {
  dailyUnlocks: { count: 0, utcDate: new Date().toISOString().slice(0, 10) },
  pendingReports: new Map<string, PendingReport>(),
};
runtimeGlobal.__datexrayReportState = state;

function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest();
}

function deletePendingReport(reportId: string) {
  const pending = state.pendingReports.get(reportId);
  if (pending) clearTimeout(pending.timer);
  state.pendingReports.delete(reportId);
}

function sweepExpiredReports(now: number) {
  for (const [reportId, pending] of state.pendingReports) {
    if (pending.expiresAt <= now) deletePendingReport(reportId);
  }
}

export function createPendingReport(stored: StoredAnalysis) {
  const now = Date.now();
  sweepExpiredReports(now);

  while (state.pendingReports.size >= MAX_PENDING_REPORTS) {
    const oldestId = state.pendingReports.keys().next().value;
    if (typeof oldestId !== "string") break;
    deletePendingReport(oldestId);
  }

  const reportId = randomUUID();
  const accessToken = randomBytes(32).toString("base64url");
  const expiresAt = now + REPORT_TTL_MS;
  const timer = setTimeout(() => deletePendingReport(reportId), REPORT_TTL_MS);
  timer.unref?.();

  state.pendingReports.set(reportId, {
    accessTokenHash: hashAccessToken(accessToken),
    expiresAt,
    stored,
    timer,
  });

  return { reportId, accessToken, expiresAt };
}

export function unlockPendingReport(reportId: string, accessToken: string, bypassDailyLimit: boolean) {
  const now = Date.now();
  const pending = state.pendingReports.get(reportId);

  if (!pending || pending.expiresAt <= now) {
    if (pending) deletePendingReport(reportId);
    return { status: "invalid" as const };
  }

  const suppliedHash = hashAccessToken(accessToken);
  if (suppliedHash.length !== pending.accessTokenHash.length || !timingSafeEqual(suppliedHash, pending.accessTokenHash)) {
    return { status: "invalid" as const };
  }

  const availability = getDailyUnlockAvailability(new Date(now));
  if (!bypassDailyLimit && !availability.available) return { status: "payment_required" as const };

  deletePendingReport(reportId);
  if (!bypassDailyLimit) state.dailyUnlocks.count += 1;
  return { status: "unlocked" as const, stored: pending.stored };
}

function getDailyUnlockAvailability(now = new Date()) {
  const utcDate = now.toISOString().slice(0, 10);
  if (state.dailyUnlocks.utcDate !== utcDate) state.dailyUnlocks = { count: 0, utcDate };

  return {
    available: state.dailyUnlocks.count < DAILY_FREE_UNLOCK_LIMIT,
    limit: DAILY_FREE_UNLOCK_LIMIT,
    used: state.dailyUnlocks.count,
    utcDate,
  };
}
