"use client";

import { useState } from "react";

import { localizeErrorMessage } from "@/lib/i18n/zh-cn";
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
      setError(reason instanceof Error ? localizeErrorMessage(reason.message) : "无法提炼 Git 素材。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="git-importer">
      <div className="git-title"><div><p className="eyebrow">本地 Git 素材</p><h2>把上线进展讲成故事。</h2></div><span>仅基于事实</span></div>
      <div className="git-controls">
        <label>提交时间范围
          <select value={rangeDays} onChange={(event) => setRangeDays(Number(event.target.value))}>
            <option value={7}>最近 7 天</option><option value={14}>最近 14 天</option><option value={30}>最近 30 天</option>
          </select>
        </label>
        <button type="button" onClick={extract} disabled={busy}>{busy ? "正在读取 Git…" : "提炼 Git 素材"}</button>
      </div>
      {error ? <p className="inline-error" role="alert">{error}</p> : null}
      {commits.length ? <details className="commit-details"><summary>{commits.length} 个来源提交</summary><div>{commits.map((commit) => <p key={commit.hash}><code>{commit.hash}</code><span>{commit.subject}</span><small>{commit.date.slice(0, 10)} · {commit.files.length} 个文件</small></p>)}</div></details> : null}
      {insights.length ? <div className="insight-grid">{insights.map((insight) => (
        <article key={`${insight.title}-${insight.commitHashes.join("-")}`}>
          <div><span>{insight.commitHashes.join(" · ")}</span><h3>{insight.title}</h3></div>
          <p>{insight.whatChanged}</p><small>{insight.whyItMatters}</small>
          <button type="button" onClick={() => onSelect(insight)}>使用：{insight.title}</button>
        </article>
      ))}</div> : null}
    </section>
  );
}
