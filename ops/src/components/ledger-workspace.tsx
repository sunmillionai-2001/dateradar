"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { contentTypeLabel, LEDGER_STATUS_ZH } from "@/lib/i18n/zh-cn";
import { searchLedger } from "@/lib/ledger/insights";
import type { ContentTypeId, LedgerEntry, LedgerStatus } from "@/lib/types";

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
      <section className="page-intro"><div><p className="eyebrow">内容台账 · 本地文件</p><h1>找到过去<br /><em>真正有效的内容。</em></h1><p className="lede">每条复制过的推文都会记录在这里。搜索表达、复用角度，同时避免账号重复自己。</p></div><span className="ledger-total">{initialEntries.length}<small>条内容</small></span></section>
      <section className="ledger-toolbar"><label>搜索<input aria-label="搜索台账" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索推文、素材或复盘笔记" /></label><label>内容类型<select aria-label="内容类型筛选" value={contentType} onChange={(event) => setContentType(event.target.value as ContentTypeId | "")}><option value="">全部类型</option>{(["anti_fraud", "product_demo", "build_in_public", "opinion", "interaction", "founder_pov"] as ContentTypeId[]).map((id) => <option key={id} value={id}>{contentTypeLabel(id)}</option>)}</select></label><label>状态<select aria-label="状态筛选" value={status} onChange={(event) => setStatus(event.target.value as LedgerStatus | "")}><option value="">全部状态</option><option value="copied">已复制</option><option value="published">已发布</option><option value="archived">已归档</option></select></label><label>日期<input aria-label="日期筛选" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="check-filter"><input type="checkbox" checked={topOnly} onChange={(event) => setTopOnly(event.target.checked)} />仅看高表现</label></section>
      <div className="ledger-result-line"><span>{filtered.length} 条结果</span>{query || contentType || status || date || topOnly ? <button type="button" onClick={() => { setQuery(""); setContentType(""); setStatus(""); setDate(""); setTopOnly(false); }}>清除筛选</button> : null}</div>
      <section className="ledger-list">{filtered.length ? filtered.map((entry) => <article key={entry.id}><div className="ledger-meta"><span>{contentTypeLabel(entry.contentType)}</span><b className={`ledger-status ${entry.status}`}>{LEDGER_STATUS_ZH[entry.status]}</b><time>{entry.lastCopiedAt.slice(0, 10)}</time>{entry.isTopPerformer ? <strong>★ 高表现</strong> : null}</div><p>{entry.finalText}</p>{entry.source.material.trim() !== entry.finalText.trim() ? <div className="ledger-source"><small>原始素材</small><span>{entry.source.material}</span></div> : null}<footer><span>已复制 {entry.copyCount} 次</span><Link href={`/channels/x?reuse=${entry.id}`}>在 X 生成器中复用</Link></footer></article>) : <div className="empty-panel"><span>⌕</span><h3>没有匹配的内容。</h3><p>可以清除筛选条件，或先在 X 生成器中复制一条新推文。</p></div>}</section>
    </main>
  );
}
