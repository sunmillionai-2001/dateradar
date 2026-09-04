"use client";

import { useMemo, useState } from "react";

import { DraftCard } from "@/components/draft-card";
import { GitImporter } from "@/components/git-importer";
import type {
  BootstrapData,
  ContentTypeId,
  CopyLedgerInput,
  GenerationResult,
  GitCommit,
  GitInsight,
  LedgerEntry,
} from "@/lib/types";

export type XGeneratorApi = {
  generate: (input: { contentType: ContentTypeId; material: string; topicId?: string; context?: { goal?: string } }) => Promise<GenerationResult>;
  log: (input: CopyLedgerInput) => Promise<Pick<LedgerEntry, "id"> | { id: string }>;
  gitInsights: (rangeDays: number) => Promise<{ commits: GitCommit[]; insights: GitInsight[] }>;
};

type ClipboardWriter = { writeText: (text: string) => Promise<void> };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json() as { data?: T; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error || "Local API request failed.");
  return payload.data;
}

const browserApi: XGeneratorApi = {
  generate: (input) => postJson<GenerationResult>("/api/generate", input),
  log: (input) => postJson<LedgerEntry>("/api/ledger", input),
  gitInsights: (rangeDays) => postJson<{ commits: GitCommit[]; insights: GitInsight[] }>("/api/git-insights", { rangeDays }),
};

export function XGenerator({
  initialData,
  api = browserApi,
  clipboard,
  initialType,
  initialMaterial = "",
  initialTopicId,
}: {
  initialData: Pick<BootstrapData, "contentTypes" | "topics">;
  api?: XGeneratorApi;
  clipboard?: ClipboardWriter;
  initialType?: ContentTypeId;
  initialMaterial?: string;
  initialTopicId?: string;
}) {
  const fallbackType = initialData.contentTypes[0]?.id ?? "anti_fraud";
  const [contentType, setContentType] = useState<ContentTypeId>(initialType ?? fallbackType);
  const [material, setMaterial] = useState(initialMaterial);
  const [goal, setGoal] = useState("");
  const [topicId, setTopicId] = useState<string | undefined>(initialTopicId);
  const [sourceKind, setSourceKind] = useState<"manual" | "topic" | "git" | "reuse">(initialTopicId ? "topic" : initialMaterial ? "reuse" : "manual");
  const [commitHashes, setCommitHashes] = useState<string[]>([]);
  const [generation, setGeneration] = useState<GenerationResult | null>(null);
  const [editedDrafts, setEditedDrafts] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [copyingIndex, setCopyingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingLog, setPendingLog] = useState<CopyLedgerInput | null>(null);

  const selectedType = useMemo(
    () => initialData.contentTypes.find((candidate) => candidate.id === contentType),
    [contentType, initialData.contentTypes],
  );

  function chooseTopic(id: string) {
    const topic = initialData.topics.find((candidate) => candidate.id === id);
    if (!topic) return;
    setTopicId(topic.id);
    setSourceKind("topic");
    setCommitHashes([]);
    setContentType(topic.contentTypes[0] ?? fallbackType);
    setMaterial(`${topic.title}\nAngle: ${topic.angle}${topic.notes ? `\nNotes: ${topic.notes}` : ""}`);
  }

  async function generate() {
    setBusy(true);
    setError("");
    setMessage("");
    setPendingLog(null);
    try {
      const result = await api.generate({
        contentType,
        material,
        topicId,
        context: goal.trim() ? { goal: goal.trim() } : undefined,
      });
      setGeneration(result);
      setEditedDrafts(result.drafts.map((draft) => draft.text));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate drafts.");
    } finally {
      setBusy(false);
    }
  }

  function buildLedgerInput(index: number): CopyLedgerInput {
    if (!generation) throw new Error("Generate drafts before copying.");
    return {
      channel: "x",
      contentType,
      source: { kind: sourceKind, topicId: topicId ?? null, material, commitHashes },
      generation: {
        generationId: generation.generationId,
        variantIndex: index,
        originalText: generation.drafts[index].text,
      },
      finalText: editedDrafts[index],
    };
  }

  async function saveLedger(input: CopyLedgerInput) {
    try {
      await api.log(input);
      setPendingLog(null);
      setError("");
      setMessage("Copied and logged locally.");
    } catch {
      setPendingLog(input);
      setMessage("");
      setError("Copied, but not logged.");
    }
  }

  async function copyDraft(index: number) {
    const input = buildLedgerInput(index);
    setCopyingIndex(index);
    setError("");
    setMessage("");
    try {
      const writer = clipboard ?? navigator.clipboard;
      await writer.writeText(input.finalText);
    } catch {
      setError("Clipboard access failed. Nothing was added to the ledger.");
      setCopyingIndex(null);
      return;
    }
    await saveLedger(input);
    setCopyingIndex(null);
  }

  function useGitInsight(insight: GitInsight) {
    setContentType(initialData.contentTypes.some((item) => item.id === "build_in_public") ? "build_in_public" : fallbackType);
    setTopicId(undefined);
    setSourceKind("git");
    setCommitHashes(insight.commitHashes);
    setMaterial([
      `Build update: ${insight.title}`,
      `What changed: ${insight.whatChanged}`,
      `Why it matters: ${insight.whyItMatters}`,
      insight.lesson ? `Lesson: ${insight.lesson}` : "",
      `Commits: ${insight.commitHashes.join(", ")}`,
    ].filter(Boolean).join("\n"));
    document.getElementById("source-material")?.focus();
  }

  return (
    <main className="page-shell studio-page">
      <section className="page-intro studio-intro"><div><p className="eyebrow">X STUDIO · @DATEXRAY</p><h1>Write with a<br /><em>point of view.</em></h1><p className="lede">Bring the facts. Pick the format. DeepSeek returns three editable English drafts—nothing reaches X until you post it yourself.</p></div></section>

      <div className="studio-layout">
        <section className="composer-panel">
          <div className="form-section">
            <div className="form-number">01</div><div><p className="eyebrow">CHOOSE THE JOB</p><h2>What should this post do?</h2></div>
            <div className="type-grid">
              {initialData.contentTypes.map((type) => <button type="button" key={type.id} className={contentType === type.id ? "selected" : ""} onClick={() => setContentType(type.id)}><strong>{type.shortName}</strong><span>{type.description}</span></button>)}
            </div>
          </div>

          <div className="form-section">
            <div className="form-number">02</div><div><p className="eyebrow">ADD THE SOURCE</p><h2>Give it something true.</h2></div>
            {initialData.topics.length ? <label className="field-label">Use a saved topic<select value={topicId ?? ""} onChange={(event) => event.target.value && chooseTopic(event.target.value)}><option value="">Choose from topic pool</option>{initialData.topics.filter((topic) => topic.status !== "archived").map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select></label> : null}
            <label className="field-label" htmlFor="source-material">Source material<textarea id="source-material" aria-label="Source material" value={material} onChange={(event) => { setMaterial(event.target.value); if (sourceKind === "manual") setTopicId(undefined); }} rows={8} placeholder="Paste a fact, product update, reviewed statistic, or story fragment…" /><small>{Array.from(material).length} / 12,000</small></label>
            <label className="field-label">Optional operator goal<input value={goal} onChange={(event) => setGoal(event.target.value)} maxLength={500} placeholder="e.g. Start a thoughtful debate, no hashtags" /></label>
          </div>

          <div className="generate-bar"><div><span className="signal-light" />{selectedType?.name}<small>English · 3 versions · ≤280 characters</small></div><button type="button" aria-label="Generate 3 drafts" onClick={generate} disabled={busy || material.trim().length < 3}>{busy ? "Generating…" : "Generate 3 drafts"}<span>→</span></button></div>
          {error ? <div className="studio-alert error" role="alert"><span>!</span><p>{error}</p>{pendingLog ? <button type="button" onClick={() => saveLedger(pendingLog)}>Retry ledger save</button> : null}</div> : null}
          {message ? <div className="studio-alert success" role="status"><span>✓</span><p>{message}</p></div> : null}
        </section>

        <aside className="voice-card"><p className="eyebrow">VOICE CHECK</p><h2>Evidence,<br />not verdicts.</h2><ul><li>Professional without sounding clinical</li><li>Useful without fear bait</li><li>A clear opinion with room for context</li><li>Reference actions, never relationship decisions</li></ul><div>YOUR LINE<br /><strong>“Here is what this pattern may signal—and what you can verify next.”</strong></div></aside>
      </div>

      {generation ? <section className="drafts-section"><div className="section-heading"><div><p className="eyebrow">03 · EDIT BEFORE YOU COPY</p><h2>Three angles on the same truth.</h2></div><span className="generation-id">ID {generation.generationId.slice(0, 8)}</span></div><div className="draft-grid">{generation.drafts.map((draft, index) => <DraftCard key={`${generation.generationId}-${index}`} draft={draft} index={index} text={editedDrafts[index] ?? ""} busy={copyingIndex === index} onChange={(text) => setEditedDrafts((current) => current.map((value, currentIndex) => currentIndex === index ? text : value))} onCopy={() => copyDraft(index)} />)}</div></section> : null}

      <GitImporter api={api} onSelect={useGitInsight} />
    </main>
  );
}
