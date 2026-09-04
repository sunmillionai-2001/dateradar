"use client";

import { useState } from "react";

import { contentTypeLabel, VISUAL_TEMPLATE_ZH } from "@/lib/i18n/zh-cn";
import type { VisualTemplate } from "@/lib/types";

export function VisualTemplateCard({ template }: { template: VisualTemplate }) {
  const [copied, setCopied] = useState(false);
  const display = VISUAL_TEMPLATE_ZH[template.id] ?? { name: template.name, layout: template.layout };
  const brief = `${template.name} (${template.aspectRatio})\nLayout: ${template.layout}\nSlots: ${template.copySlots.join(", ")}\nExample:\n${Object.entries(template.exampleContent).map(([key, value]) => `${key}: ${value}`).join("\n")}`;
  async function copyBrief() {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
  }
  return (
    <article className="template-card">
      <div className={`template-preview preview-${template.id}`} style={{ "--preview-accent": template.colors[1] } as React.CSSProperties}>
        <span>{template.aspectRatio}</span>
        <p>{Object.values(template.exampleContent)[0]}</p>
        <small>DATEXRAY · 参考设计</small>
      </div>
      <div className="template-copy"><p className="eyebrow">{template.recommendedTypes.map((id) => contentTypeLabel(id)).join(" · ")}</p><h3>{display.name}</h3><p>{display.layout}</p><button type="button" onClick={copyBrief}>{copied ? "制作说明已复制" : "复制英文制作说明"}</button></div>
    </article>
  );
}
