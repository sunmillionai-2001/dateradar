"use client";

import { useState } from "react";

import { engagementRate } from "@/lib/ledger/insights";
import type { ContentMetrics, LedgerEntry, LedgerEntryPatch } from "@/lib/types";

export type ReviewApi = {
  update: (id: string, patch: LedgerEntryPatch) => Promise<LedgerEntry>;
};

async function updateEntry(id: string, patch: LedgerEntryPatch) {
  const response = await fetch(`/api/ledger/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
  const payload = await response.json() as { data?: LedgerEntry; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error || "Unable to save the review.");
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
      setMessage("Review saved locally.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the review.");
    }
  }

  return <article className="review-card"><div className="review-copy"><span>{entry.contentType.replaceAll("_", " ")}</span><p>{entry.finalText}</p><small>{entry.status} · copied {entry.copyCount}×</small></div><div className="publication-fields"><label>X post URL<input aria-label="X post URL" value={postUrl} onChange={(event) => setPostUrl(event.target.value)} placeholder="https://x.com/DateXray/status/…" /></label><label>Published at<input aria-label="Published at" type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} /></label></div><div className="metrics-grid">{(["impressions", "likes", "replies", "reposts", "bookmarks", "linkClicks"] as const).map((name) => <label key={name}>{name === "linkClicks" ? "Link clicks" : `${name[0].toUpperCase()}${name.slice(1)}`}<input aria-label={name === "linkClicks" ? "Link clicks" : `${name[0].toUpperCase()}${name.slice(1)}`} type="number" min="0" value={metrics[name]} onChange={(event) => metric(name, event.target.value)} /></label>)}</div><div className="review-score"><div><strong>{(engagementRate(metrics) * 100).toFixed(2)}%</strong><span>engagement rate</span></div><label><input type="checkbox" checked={top} onChange={(event) => setTop(event.target.checked)} />Top performer</label></div><label className="review-notes">Review notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="What made this worth repeating?" /></label><button type="button" className="save-review" onClick={save}>Save review</button>{message ? <p className="form-message">{message}</p> : null}{error ? <p className="inline-error">{error}</p> : null}</article>;
}

export function ReviewWorkspace({ initialEntries, api = defaultApi }: { initialEntries: LedgerEntry[]; api?: ReviewApi }) {
  const [entries, setEntries] = useState(initialEntries);
  const publishedCount = entries.filter((entry) => entry.status === "published").length;
  const topCount = entries.filter((entry) => entry.isTopPerformer).length;
  return <main className="page-shell review-page"><section className="page-intro"><div><p className="eyebrow">PERFORMANCE REVIEW</p><h1>Turn response<br /><em>into judgment.</em></h1><p className="lede">Add the numbers after publishing. Mark the posts worth studying. Let actual audience behavior sharpen the next draft.</p></div></section><section className="review-summary"><article><strong>{publishedCount}</strong><span>published</span></article><article><strong>{topCount}</strong><span>top performers</span></article><article><strong>{entries.length - publishedCount}</strong><span>awaiting publish details</span></article></section><section className="review-list">{entries.length ? entries.map((entry) => <ReviewCard key={entry.id} entry={entry} api={api} onUpdate={(updated) => setEntries((current) => current.map((item) => item.id === updated.id ? updated : item))} />) : <div className="empty-panel"><span>↗</span><h3>No content to review yet.</h3><p>Copy a draft in X studio and it will be ready for publication details here.</p></div>}</section></main>;
}
