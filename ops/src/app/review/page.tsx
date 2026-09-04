"use client";

import { useEffect, useState } from "react";
import { ReviewWorkspace } from "@/components/review-workspace";
import { localizeErrorMessage } from "@/lib/i18n/zh-cn";
import type { LedgerData } from "@/lib/types";

export default function ReviewPage() {
  const [ledger, setLedger] = useState<LedgerData | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; fetch("/api/ledger", { cache: "no-store" }).then(async (response) => { const payload = await response.json() as { data?: LedgerData; error?: string }; if (!response.ok || !payload.data) throw new Error(payload.error || "无法加载复盘数据。"); if (active) setLedger(payload.data); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? localizeErrorMessage(reason.message) : "无法加载复盘数据。"); }); return () => { active = false; }; }, []);
  if (error) return <main className="page-shell"><div className="error-panel"><strong>数据复盘加载失败。</strong><p>{error}</p></div></main>;
  if (!ledger) return <main className="page-shell"><div className="loading-panel"><span /><span /><span /> 正在加载数据复盘</div></main>;
  return <ReviewWorkspace initialEntries={ledger.entries} />;
}
