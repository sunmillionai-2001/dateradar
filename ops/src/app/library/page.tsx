"use client";

import { useEffect, useState } from "react";
import { LibraryWorkspace } from "@/components/library-workspace";
import { localizeErrorMessage } from "@/lib/i18n/zh-cn";
import type { BootstrapData } from "@/lib/types";

export default function LibraryPage() {
  const [data, setData] = useState<BootstrapData | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; fetch("/api/bootstrap", { cache: "no-store" }).then(async (response) => { const payload = await response.json() as { data?: BootstrapData; error?: string }; if (!response.ok || !payload.data) throw new Error(payload.error || "无法加载内容库。"); if (active) setData(payload.data); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? localizeErrorMessage(reason.message) : "无法加载内容库。"); }); return () => { active = false; }; }, []);
  if (error) return <main className="page-shell"><div className="error-panel"><strong>内容库加载失败。</strong><p>{error}</p></div></main>;
  if (!data) return <main className="page-shell"><div className="loading-panel"><span /><span /><span /> 正在加载内容库</div></main>;
  return <LibraryWorkspace brand={data.brand} contentTypes={data.contentTypes} templates={data.templates} initialTopics={data.topics} />;
}
