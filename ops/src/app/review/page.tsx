"use client";

import { useEffect, useState } from "react";
import { ReviewWorkspace } from "@/components/review-workspace";
import type { LedgerData } from "@/lib/types";

export default function ReviewPage() {
  const [ledger, setLedger] = useState<LedgerData | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; fetch("/api/ledger", { cache: "no-store" }).then(async (response) => { const payload = await response.json() as { data?: LedgerData; error?: string }; if (!response.ok || !payload.data) throw new Error(payload.error || "Unable to load review data."); if (active) setLedger(payload.data); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load review data."); }); return () => { active = false; }; }, []);
  if (error) return <main className="page-shell"><div className="error-panel"><strong>Review could not load.</strong><p>{error}</p></div></main>;
  if (!ledger) return <main className="page-shell"><div className="loading-panel"><span /><span /><span /> Loading performance review</div></main>;
  return <ReviewWorkspace initialEntries={ledger.entries} />;
}
