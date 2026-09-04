"use client";

import { useEffect, useState } from "react";

import { XGenerator } from "@/components/x-generator";
import type { BootstrapData, ContentTypeId } from "@/lib/types";

export default function XStudioPage() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/bootstrap", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { data?: BootstrapData; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Unable to load the X studio.");
      if (active) setData(payload.data);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Unable to load the X studio.");
    });
    return () => { active = false; };
  }, []);

  if (error) return <main className="page-shell"><div className="error-panel"><strong>X studio could not load.</strong><p>{error}</p></div></main>;
  if (!data) return <main className="page-shell"><div className="loading-panel"><span /><span /><span /> Loading the X studio</div></main>;

  const query = new URLSearchParams(window.location.search);
  const type = query.get("type") as ContentTypeId | null;
  const topicId = query.get("topic") ?? undefined;
  const reuseId = query.get("reuse");
  const topic = topicId ? data.topics.find((candidate) => candidate.id === topicId) : undefined;
  const reused = reuseId ? data.ledger.entries.find((entry) => entry.id === reuseId) : undefined;
  return <XGenerator
    initialData={data}
    initialType={topic?.contentTypes[0] ?? reused?.contentType ?? type ?? undefined}
    initialTopicId={topic?.id}
    initialMaterial={topic ? `${topic.title}\nAngle: ${topic.angle}${topic.notes ? `\nNotes: ${topic.notes}` : ""}` : reused?.finalText ?? ""}
  />;
}
