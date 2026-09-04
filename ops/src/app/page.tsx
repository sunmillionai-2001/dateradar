"use client";

import { useEffect, useState } from "react";

import { TodayDashboard } from "@/components/today-dashboard";
import { localizeErrorMessage } from "@/lib/i18n/zh-cn";
import type { BootstrapData } from "@/lib/types";

function localDateKey() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

export default function DashboardPage() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/bootstrap", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { data?: BootstrapData; error?: string };
        if (!response.ok || !payload.data) throw new Error(payload.error || "无法加载本地运营数据。");
        if (active) setData(payload.data);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? localizeErrorMessage(reason.message) : "无法加载本地运营数据。");
      });
    return () => { active = false; };
  }, []);

  if (error) return <main className="page-shell"><div className="error-panel"><strong>本地数据加载失败。</strong><p>{error}</p></div></main>;
  if (!data) return <main className="page-shell"><div className="loading-panel"><span /><span /><span /> 正在加载运营工作台</div></main>;
  return <TodayDashboard entries={data.ledger.entries} today={localDateKey()} />;
}
