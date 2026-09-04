"use client";

import { useState } from "react";

import { contentTypeLabel, LEDGER_STATUS_ZH, localizeErrorMessage, METRIC_LABELS_ZH } from "@/lib/i18n/zh-cn";
import { engagementRate } from "@/lib/ledger/insights";
import type { ContentMetrics, LedgerEntry, LedgerEntryPatch } from "@/lib/types";

export type ReviewApi = {
  update: (id: string, patch: LedgerEntryPatch) => Promise<LedgerEntry>;
};

async function updateEntry(id: string, patch: LedgerEntryPatch) {
  const response = await fetch(`/api/ledger/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
  const payload = await response.json() as { data?: LedgerEntry; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error || "无法保存复盘。");
  return payload.data;
}

const defaultApi: ReviewApi = { update: updateEntry };

function ReviewCard({ entry, api, onUpdate }: { entry: LedgerEntry; api: ReviewApi; onUpdate: (entry: LedgerEntry) => void }) {
  const [postUrl, setPostUrl] = useState(entry.postUrl ?? "");
  const [publishedAt, setPublishedAt] = useState(entry.publishedAt?.slice(0, 16) ?? "");
  const [metrics, setMetrics] = useState<ContentMetrics>(entry.metrics);
  const [top, setTop] = useState(entry.isTopPerformer);
  const [notes, setNotes] = useState(entry.reviewNotes);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function metric(name: keyof ContentMetrics, value: string) {
    setMetrics((current) => ({ ...current, [name]: Math.max(0, Math.trunc(Number(value) || 0)) }));
  }

  async function save() {
    setError("");
    setMessage("");
    try {
      const updated = await api.update(entry.id, {
        postUrl: postUrl.trim() || null,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
        metrics,
        isTopPerformer: top,
        reviewNotes: notes,
      });
      onUpdate(updated);
      setMessage("复盘已保存到本地。");
    } catch (reason) {
      setError(reason instanceof Error ? localizeErrorMessage(reason.message) : "无法保存复盘。");
    }
  }

  return <article className="review-card"><div className="review-copy"><span>{contentTypeLabel(entry.contentType)}</span><p>{entry.finalText}</p><small>{LEDGER_STATUS_ZH[entry.status]} · 已复制 {entry.copyCount} 次</small></div><div className="publication-fields"><label>X 推文链接<input aria-label="X 推文链接" value={postUrl} onChange={(event) => setPostUrl(event.target.value)} placeholder="https://x.com/DateXray/status/…" /></label><label>发布时间<input aria-label="发布时间" type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} /></label></div><div className="metrics-grid">{(["impressions", "likes", "replies", "reposts", "bookmarks", "linkClicks"] as const).map((name) => <label key={name}>{METRIC_LABELS_ZH[name]}<input aria-label={METRIC_LABELS_ZH[name]} type="number" min="0" value={metrics[name]} onChange={(event) => metric(name, event.target.value)} /></label>)}</div><div className="review-score"><div><strong>{(engagementRate(metrics) * 100).toFixed(2)}%</strong><span>互动率</span></div><label><input type="checkbox" checked={top} onChange={(event) => setTop(event.target.checked)} />高表现内容</label></div><label className="review-notes">复盘笔记<textarea aria-label="复盘笔记" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="这条内容为什么值得复用？" /></label><button type="button" className="save-review" onClick={save}>保存复盘</button>{message ? <p className="form-message">{message}</p> : null}{error ? <p className="inline-error">{error}</p> : null}</article>;
}

export function ReviewWorkspace({ initialEntries, api = defaultApi }: { initialEntries: LedgerEntry[]; api?: ReviewApi }) {
  const [entries, setEntries] = useState(initialEntries);
  const publishedCount = entries.filter((entry) => entry.status === "published").length;
  const topCount = entries.filter((entry) => entry.isTopPerformer).length;
  return <main className="page-shell review-page"><section className="page-intro"><div><p className="eyebrow">内容表现复盘</p><h1>把真实反馈<br /><em>变成下一次判断。</em></h1><p className="lede">发布后回填数据，标记值得研究的内容，让受众的真实行为帮助你优化下一条推文。</p></div></section><section className="review-summary"><article><strong>{publishedCount}</strong><span>已发布</span></article><article><strong>{topCount}</strong><span>高表现内容</span></article><article><strong>{entries.length - publishedCount}</strong><span>待补发布信息</span></article></section><section className="review-list">{entries.length ? entries.map((entry) => <ReviewCard key={entry.id} entry={entry} api={api} onUpdate={(updated) => setEntries((current) => current.map((item) => item.id === updated.id ? updated : item))} />) : <div className="empty-panel"><span>↗</span><h3>暂无可复盘内容。</h3><p>在 X 生成器中复制一条推文后，即可在这里补充发布信息。</p></div>}</section></main>;
}
