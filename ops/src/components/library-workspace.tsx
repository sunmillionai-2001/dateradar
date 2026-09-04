"use client";

import Link from "next/link";
import { useState } from "react";

import { VisualTemplateCard } from "@/components/visual-template-card";
import { BRAND_VOICE_ZH, CONTENT_TYPE_ZH, contentTypeLabel, localizeErrorMessage, TOPIC_STATUS_ZH } from "@/lib/i18n/zh-cn";
import type { BrandVoice, ContentType, ContentTypeId, Topic, VisualTemplate } from "@/lib/types";

export type LibraryApi = {
  createTopic: (input: { title: string; angle: string; contentTypes: ContentTypeId[]; tags: string[]; notes: string }) => Promise<Topic>;
  updateTopic: (id: string, patch: Partial<Topic>) => Promise<Topic>;
};

async function requestJson<T>(url: string, method: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json() as { data?: T; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error || "无法更新本地内容库。");
  return payload.data;
}

const defaultApi: LibraryApi = {
  createTopic: (input) => requestJson<Topic>("/api/topics", "POST", input),
  updateTopic: (id, patch) => requestJson<Topic>(`/api/topics/${encodeURIComponent(id)}`, "PATCH", patch),
};

const TABS = [
  { id: "voice", label: "品牌声音" },
  { id: "types", label: "内容类型" },
  { id: "topics", label: "选题池" },
  { id: "templates", label: "配图模板" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function LibraryWorkspace({ brand, contentTypes, templates, initialTopics, api = defaultApi }: {
  brand: BrandVoice;
  contentTypes: ContentType[];
  templates: VisualTemplate[];
  initialTopics: Topic[];
  api?: LibraryApi;
}) {
  const [tab, setTab] = useState<TabId>("voice");
  const [topics, setTopics] = useState(initialTopics);
  const [title, setTitle] = useState("");
  const [angle, setAngle] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<ContentTypeId[]>([contentTypes[0]?.id ?? "anti_fraud"]);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveTopic() {
    setError("");
    try {
      const topic = await api.createTopic({ title, angle, contentTypes: selectedTypes, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), notes });
      setTopics((current) => [topic, ...current]);
      setTitle(""); setAngle(""); setTags(""); setNotes("");
      setMessage("选题已保存到本地。");
    } catch (reason) {
      setError(reason instanceof Error ? localizeErrorMessage(reason.message) : "无法保存选题。");
    }
  }

  async function archiveTopic(topic: Topic) {
    try {
      const updated = await api.updateTopic(topic.id, { status: topic.status === "archived" ? "backlog" : "archived" });
      setTopics((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? localizeErrorMessage(reason.message) : "无法更新选题。");
    }
  }

  return (
    <main className="page-shell library-page">
      <section className="page-intro"><div><p className="eyebrow">内容系统</p><h1>你的运营<br /><em>内容记忆。</em></h1><p className="lede">把品牌声音、可复用类型、选题和配图说明放在一起，让它们持续影响每一版推文。</p></div></section>
      <div className="library-tabs" role="tablist" aria-label="内容库分区">{TABS.map((item, index) => <button key={item.id} type="button" role="tab" aria-label={item.label} aria-selected={tab === item.id} onClick={() => setTab(item.id)}><small>0{index + 1}</small>{item.label}</button>)}</div>

      {tab === "voice" ? <section className="voice-library"><div className="voice-statement"><p className="eyebrow">谁在发声</p><h2>{BRAND_VOICE_ZH.identity}</h2><span>版本 {brand.version}</span></div><div className="principle-grid">{BRAND_VOICE_ZH.principles.map((principle, index) => <article key={principle}><span>0{index + 1}</span><p>{principle}</p></article>)}</div><div className="boundary-callout"><strong>决策边界</strong><p>{BRAND_VOICE_ZH.decisionBoundary}</p><div>{BRAND_VOICE_ZH.tones.map((tone) => <span key={tone}>{tone}</span>)}</div></div></section> : null}

      {tab === "types" ? <section className="content-type-library">{contentTypes.map((type, index) => <article key={type.id}><div><span>0{index + 1}</span><p>{contentTypeLabel(type.id)}</p></div><h2>{CONTENT_TYPE_ZH[type.id].name}</h2><p>{CONTENT_TYPE_ZH[type.id].description}</p><dl><dt>目标</dt><dd>{CONTENT_TYPE_ZH[type.id].goal}</dd><dt>英文推文示例</dt><dd>“{type.example}”</dd><dt>建议行动引导</dt><dd>{CONTENT_TYPE_ZH[type.id].recommendedCta}</dd></dl><Link href={`/channels/x?type=${type.id}`}>用此类型创作 →</Link></article>)}</section> : null}

      {tab === "topics" ? <section className="topic-workspace"><div className="topic-form"><p className="eyebrow">添加选题</p><h2>在灵感消失前记下角度。</h2><label>选题标题<input aria-label="选题标题" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>选题角度<textarea aria-label="选题角度" value={angle} onChange={(event) => setAngle(event.target.value)} rows={4} /></label><fieldset><legend>适用内容类型</legend><div>{contentTypes.map((type) => <label key={type.id}><input type="checkbox" checked={selectedTypes.includes(type.id)} onChange={() => setSelectedTypes((current) => current.includes(type.id) ? current.filter((id) => id !== type.id) : [...current, type.id])} />{contentTypeLabel(type.id)}</label>)}</div></fieldset><label>标签（用英文逗号分隔）<input aria-label="选题标签" value={tags} onChange={(event) => setTags(event.target.value)} /></label><label>备注<textarea aria-label="选题备注" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></label><button type="button" onClick={saveTopic} disabled={!title.trim() || !angle.trim() || !selectedTypes.length}>保存选题</button>{message ? <p className="form-message">{message}</p> : null}{error ? <p className="inline-error">{error}</p> : null}</div><div className="topic-list"><div className="section-heading compact"><div><p className="eyebrow">本地选题池</p><h2>{topics.length} 个选题</h2></div></div>{topics.length ? topics.map((topic) => <article key={topic.id} className={topic.status === "archived" ? "archived" : ""}><div><span>{TOPIC_STATUS_ZH[topic.status]}</span><small>{topic.tags.join(" · ") || "无标签"}</small></div><h3>{topic.title}</h3><p>{topic.angle}</p><footer><Link href={`/channels/x?topic=${topic.id}`}>用于 X 生成器</Link><button type="button" onClick={() => archiveTopic(topic)}>{topic.status === "archived" ? "恢复" : "归档"}</button></footer></article>) : <div className="empty-panel"><span>＋</span><h3>还没有保存选题。</h3><p>第一个选题会存入已被 Git 忽略的本地 topics.json 文件。</p></div>}</div></section> : null}

      {tab === "templates" ? <section className="template-library"><div className="section-heading"><div><p className="eyebrow">配图制作说明</p><h2>三种可复用的视觉框架。</h2></div><span className="generation-id">CSS 预览 · 不生成图片</span></div>{templates.map((template) => <VisualTemplateCard key={template.id} template={template} />)}</section> : null}
    </main>
  );
}
