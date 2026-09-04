"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { searchLedger } from "@/lib/ledger/insights";
import type { ContentTypeId, LedgerEntry, LedgerStatus } from "@/lib/types";

const TYPE_LABELS: Partial<Record<ContentTypeId, string>> = {
  anti_fraud: "Anti-fraud", product_demo: "Product demo", build_in_public: "Build progress",
  opinion: "Opinion", interaction: "Interaction", founder_pov: "Founder POV",
};

export function LedgerWorkspace({ initialEntries }: { initialEntries: LedgerEntry[] }) {
  const [query, setQuery] = useState("");
  const [contentType, setContentType] = useState<ContentTypeId | "">("");
  const [status, setStatus] = useState<LedgerStatus | "">("");
  const [topOnly, setTopOnly] = useState(false);
  const [date, setDate] = useState("");
  const filtered = useMemo(() => searchLedger(initialEntries, {
    query,
    contentType: contentType || undefined,
    status: status || undefined,
    isTopPerformer: topOnly ? true : undefined,
    date: date || undefined,
  }), [contentType, date, initialEntries, query, status, topOnly]);

  return (
    <main className="page-shell ledger-page">
      <section className="page-intro"><div><p className="eyebrow">CONTENT LEDGER · LOCAL FILE</p><h1>Find what<br /><em>worked before.</em></h1><p className="lede">Every copied draft lands here. Search the language, reuse the angle, and keep the account from repeating itself.</p></div><span className="ledger-total">{initialEntries.length}<small>total entries</small></span></section>
      <section className="ledger-toolbar"><label>Search<input aria-label="Search ledger" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search copy, source, or review notes" /></label><label>Type<select value={contentType} onChange={(event) => setContentType(event.target.value as ContentTypeId | "")}><option value="">All types</option>{Object.entries(TYPE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value as LedgerStatus | "")}><option value="">All statuses</option><option value="copied">Copied</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="check-filter"><input type="checkbox" checked={topOnly} onChange={(event) => setTopOnly(event.target.checked)} />Top only</label></section>
      <div className="ledger-result-line"><span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>{query || contentType || status || date || topOnly ? <button type="button" onClick={() => { setQuery(""); setContentType(""); setStatus(""); setDate(""); setTopOnly(false); }}>Clear filters</button> : null}</div>
      <section className="ledger-list">{filtered.length ? filtered.map((entry) => <article key={entry.id}><div className="ledger-meta"><span>{TYPE_LABELS[entry.contentType]}</span><b className={`ledger-status ${entry.status}`}>{entry.status}</b><time>{entry.lastCopiedAt.slice(0, 10)}</time>{entry.isTopPerformer ? <strong>★ TOP</strong> : null}</div><p>{entry.finalText}</p>{entry.source.material.trim() !== entry.finalText.trim() ? <div className="ledger-source"><small>SOURCE</small><span>{entry.source.material}</span></div> : null}<footer><span>Copied {entry.copyCount}×</span><Link href={`/channels/x?reuse=${entry.id}`}>Reuse in X studio</Link></footer></article>) : <div className="empty-panel"><span>⌕</span><h3>No matching content.</h3><p>Try clearing a filter or copying a new draft from X studio.</p></div>}</section>
    </main>
  );
}
