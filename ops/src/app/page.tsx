"use client";

import { useEffect, useState } from "react";

import { TodayDashboard } from "@/components/today-dashboard";
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
        if (!response.ok || !payload.data) throw new Error(payload.error || "Unable to load local operations data.");
        if (active) setData(payload.data);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load local operations data.");
      });
    return () => { active = false; };
  }, []);

  if (error) return <main className="page-shell"><div className="error-panel"><strong>Local data could not load.</strong><p>{error}</p></div></main>;
  if (!data) return <main className="page-shell"><div className="loading-panel"><span /><span /><span /> Loading your operations desk</div></main>;
  return <TodayDashboard entries={data.ledger.entries} today={localDateKey()} />;
}
