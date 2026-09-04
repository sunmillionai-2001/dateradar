"use client";

import { useEffect, useState } from "react";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import type { LedgerData } from "@/lib/types";

export default function LedgerPage() {
  const [ledger, setLedger] = useState<LedgerData | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; fetch("/api/ledger", { cache: "no-store" }).then(async (response) => { const payload = await response.json() as { data?: LedgerData; error?: string }; if (!response.ok || !payload.data) throw new Error(payload.error || "Unable to load ledger."); if (active) setLedger(payload.data); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load ledger."); }); return () => { active = false; }; }, []);
  if (error) return <main className="page-shell"><div className="error-panel"><strong>Ledger could not load.</strong><p>{error}</p></div></main>;
  if (!ledger) return <main className="page-shell"><div className="loading-panel"><span /><span /><span /> Loading the ledger</div></main>;
  return <LedgerWorkspace initialEntries={ledger.entries} />;
}
