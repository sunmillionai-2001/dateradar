"use client";

import { useEffect, useState } from "react";
import { LibraryWorkspace } from "@/components/library-workspace";
import type { BootstrapData } from "@/lib/types";

export default function LibraryPage() {
  const [data, setData] = useState<BootstrapData | null>(null); const [error, setError] = useState("");
  useEffect(() => { let active = true; fetch("/api/bootstrap", { cache: "no-store" }).then(async (response) => { const payload = await response.json() as { data?: BootstrapData; error?: string }; if (!response.ok || !payload.data) throw new Error(payload.error || "Unable to load library."); if (active) setData(payload.data); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load library."); }); return () => { active = false; }; }, []);
  if (error) return <main className="page-shell"><div className="error-panel"><strong>Library could not load.</strong><p>{error}</p></div></main>;
  if (!data) return <main className="page-shell"><div className="loading-panel"><span /><span /><span /> Loading the library</div></main>;
  return <LibraryWorkspace brand={data.brand} contentTypes={data.contentTypes} templates={data.templates} initialTopics={data.topics} />;
}
