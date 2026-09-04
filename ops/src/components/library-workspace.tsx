"use client";

import Link from "next/link";
import { useState } from "react";

import { VisualTemplateCard } from "@/components/visual-template-card";
import type { BrandVoice, ContentType, ContentTypeId, Topic, VisualTemplate } from "@/lib/types";

export type LibraryApi = {
  createTopic: (input: { title: string; angle: string; contentTypes: ContentTypeId[]; tags: string[]; notes: string }) => Promise<Topic>;
  updateTopic: (id: string, patch: Partial<Topic>) => Promise<Topic>;
};

async function requestJson<T>(url: string, method: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json() as { data?: T; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error || "Unable to update the local library.");
  return payload.data;
}

const defaultApi: LibraryApi = {
  createTopic: (input) => requestJson<Topic>("/api/topics", "POST", input),
  updateTopic: (id, patch) => requestJson<Topic>(`/api/topics/${encodeURIComponent(id)}`, "PATCH", patch),
};

const TABS = [
  { id: "voice", label: "Brand voice" },
  { id: "types", label: "Content types" },
  { id: "topics", label: "Topic pool" },
  { id: "templates", label: "Visual templates" },
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
      setMessage("Topic saved locally.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save topic.");
    }
  }

  async function archiveTopic(topic: Topic) {
    try {
      const updated = await api.updateTopic(topic.id, { status: topic.status === "archived" ? "backlog" : "archived" });
      setTopics((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update topic.");
    }
  }

  return (
    <main className="page-shell library-page">
      <section className="page-intro"><div><p className="eyebrow">CONTENT SYSTEM</p><h1>Your editorial<br /><em>memory.</em></h1><p className="lede">Voice rules, repeatable formats, usable ideas, and visual briefs—kept close enough to shape every draft.</p></div></section>
      <div className="library-tabs" role="tablist" aria-label="Library sections">{TABS.map((item, index) => <button key={item.id} type="button" role="tab" aria-label={item.label} aria-selected={tab === item.id} onClick={() => setTab(item.id)}><small>0{index + 1}</small>{item.label}</button>)}</div>

      {tab === "voice" ? <section className="voice-library"><div className="voice-statement"><p className="eyebrow">WHO IS SPEAKING</p><h2>{brand.identity}</h2><span>VERSION {brand.version}</span></div><div className="principle-grid">{brand.principles.map((principle, index) => <article key={principle}><span>0{index + 1}</span><p>{principle}</p></article>)}</div><div className="boundary-callout"><strong>Decision boundary</strong><p>{brand.languageRules.decisionBoundary}</p><div>{brand.languageRules.tone.map((tone) => <span key={tone}>{tone}</span>)}</div></div></section> : null}

      {tab === "types" ? <section className="content-type-library">{contentTypes.map((type, index) => <article key={type.id}><div><span>0{index + 1}</span><p>{type.shortName}</p></div><h2>{type.name}</h2><p>{type.description}</p><dl><dt>GOAL</dt><dd>{type.goal}</dd><dt>EXAMPLE</dt><dd>“{type.example}”</dd><dt>CTA</dt><dd>{type.recommendedCta}</dd></dl><Link href={`/channels/x?type=${type.id}`}>Create this format →</Link></article>)}</section> : null}

      {tab === "topics" ? <section className="topic-workspace"><div className="topic-form"><p className="eyebrow">ADD AN IDEA</p><h2>Capture the angle before it disappears.</h2><label>Topic title<input aria-label="Topic title" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Topic angle<textarea aria-label="Topic angle" value={angle} onChange={(event) => setAngle(event.target.value)} rows={4} /></label><fieldset><legend>Useful formats</legend><div>{contentTypes.map((type) => <label key={type.id}><input type="checkbox" checked={selectedTypes.includes(type.id)} onChange={() => setSelectedTypes((current) => current.includes(type.id) ? current.filter((id) => id !== type.id) : [...current, type.id])} />{type.shortName}</label>)}</div></fieldset><label>Tags, comma separated<input value={tags} onChange={(event) => setTags(event.target.value)} /></label><label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></label><button type="button" onClick={saveTopic} disabled={!title.trim() || !angle.trim() || !selectedTypes.length}>Save topic</button>{message ? <p className="form-message">{message}</p> : null}{error ? <p className="inline-error">{error}</p> : null}</div><div className="topic-list"><div className="section-heading compact"><div><p className="eyebrow">LOCAL TOPIC POOL</p><h2>{topics.length} ideas</h2></div></div>{topics.length ? topics.map((topic) => <article key={topic.id} className={topic.status === "archived" ? "archived" : ""}><div><span>{topic.status}</span><small>{topic.tags.join(" · ") || "untagged"}</small></div><h3>{topic.title}</h3><p>{topic.angle}</p><footer><Link href={`/channels/x?topic=${topic.id}`}>Use in X studio</Link><button type="button" onClick={() => archiveTopic(topic)}>{topic.status === "archived" ? "Restore" : "Archive"}</button></footer></article>) : <div className="empty-panel"><span>＋</span><h3>No saved topics yet.</h3><p>Your first idea will be stored in the ignored local topics.json file.</p></div>}</div></section> : null}

      {tab === "templates" ? <section className="template-library"><div className="section-heading"><div><p className="eyebrow">VISUAL BRIEFS</p><h2>Three repeatable frames.</h2></div><span className="generation-id">CSS PREVIEWS · NO IMAGE GENERATION</span></div>{templates.map((template) => <VisualTemplateCard key={template.id} template={template} />)}</section> : null}
    </main>
  );
}
