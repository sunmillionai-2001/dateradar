"use client";

import { useEffect, useState } from "react";
import { LedgerWorkspace } from "@/components/ledger-workspace";
import { localizeErrorMessage } from "@/lib/i18n/zh-cn";
import type { LedgerData } from "@/lib/types";

export default function LedgerPage() {
  const [ledger, setLedger] = useState<LedgerData | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; fetch("/api/ledger", { cache: "no-store" }).then(async (response) => { const payload = await response.json() as { data?: LedgerData; error?: string }; if (!response.ok || !payload.data) throw new Error(payload.error || "无法加载内容台账。"); if (active) setLedger(payload.data); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? localizeErrorMessage(reason.message) : "无法加载内容台账。"); }); return () => { active = false; }; }, []);
  if (error) return <main className="page-shell"><div className="error-panel"><strong>内容台账加载失败。</strong><p>{error}</p></div></main>;
  if (!ledger) return <main className="page-shell"><div className="loading-panel"><span /><span /><span /> 正在加载内容台账</div></main>;
  return <LedgerWorkspace initialEntries={ledger.entries} />;
}
