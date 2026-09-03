import { toFullReportTier } from "@/lib/analysis-report";
import { unlockPendingReport } from "@/lib/server/report-store";
import { assertShareSigningConfigured, createSignedShareToken, ShareSigningConfigurationError } from "@/lib/server/share-token";

export const runtime = "nodejs";

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "Send the report credentials as JSON." }, { status: 415 });
  }

  const body = (await request.json().catch(() => null)) as { report_id?: unknown; unlock_token?: unknown } | null;
  const reportId = typeof body?.report_id === "string" ? body.report_id : "";
  const unlockToken = typeof body?.unlock_token === "string" ? body.unlock_token : "";

  if (!/^[0-9a-f-]{36}$/i.test(reportId) || unlockToken.length < 32 || unlockToken.length > 128) {
    return json({ error: "This report cannot be unlocked." }, { status: 400 });
  }

  const isDevMode = process.env.NODE_ENV === "development" && process.env.DEV_MODE === "true";
  try {
    // Resolve the signing configuration before consuming the one-time report.
    assertShareSigningConfigured();
  } catch (error) {
    if (error instanceof ShareSigningConfigurationError) {
      return json({ error: "Signed sharing is not configured on this deployment." }, { status: 503 });
    }
    throw error;
  }

  const unlock = unlockPendingReport(reportId, unlockToken, isDevMode);
  if (unlock.status === "invalid") {
    return json({ error: "This report has expired, was already unlocked, or the credentials are invalid." }, { status: 410 });
  }
  if (unlock.status === "payment_required") {
    return json({ code: "payment_required", error: "Today's 100 complimentary reports have been claimed.", price: "$4.99" }, { status: 402 });
  }

  return json({
    full_report: toFullReportTier(unlock.stored.report),
    share_token: createSignedShareToken(unlock.stored),
    unlock_source: isDevMode ? "dev_mode" : "daily_free",
  });
}
