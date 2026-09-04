"use client";

import { useState } from "react";

import type { GitCommit, GitInsight } from "@/lib/types";
import type { XGeneratorApi } from "@/components/x-generator";

export function GitImporter({ api, onSelect }: {
  api: XGeneratorApi;
  onSelect: (insight: GitInsight) => void;
}) {
  const [rangeDays, setRangeDays] = useState(7);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [insights, setInsights] = useState<GitInsight[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function extract() {
    setBusy(true);
    setError("");
    try {
      const result = await api.gitInsights(rangeDays);
      setCommits(result.commits);
      setInsights(result.insights);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to extract Git insights.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="git-importer">
      <div className="git-title"><div><p className="eyebrow">LOCAL GIT SOURCE</p><h2>Turn shipping into a story.</h2></div><span>facts only</span></div>
      <div className="git-controls">
        <label>Commit range
          <select value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))}>
            <option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option>
          </select>
        </label>
        <button type="button" onClick={extract} disabled={busy}>{busy ? "Reading Git…" : "Extract Git insights"}</button>
      </div>
      {error ? <p className="inline-error" role="alert">{error}</p> : null}
      {commits.length ? <details className="commit-details"><summary>{commits.length} source commits</summary><div>{commits.map((commit) => <p key={commit.hash}><code>{commit.hash}</code><span>{commit.subject}</span><small>{commit.date.slice(0, 10)} · {commit.files.length} file{commit.files.length === 1 ? "" : "s"}</small></p>)}</div></details> : null}
      {insights.length ? <div className="insight-grid">{insights.map((insight) => (
        <article key={`${insight.title}-${insight.commitHashes.join("-")}`}>
          <div><span>{insight.commitHashes.join(" · ")}</span><h3>{insight.title}</h3></div>
          <p>{insight.whatChanged}</p><small>{insight.whyItMatters}</small>
          <button type="button" onClick={() => onSelect(insight)}>Use {insight.title}</button>
        </article>
      ))}</div> : null}
    </section>
  );
}
