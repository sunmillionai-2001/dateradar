"use client";

import { useState } from "react";

import type { VisualTemplate } from "@/lib/types";

export function VisualTemplateCard({ template }: { template: VisualTemplate }) {
  const [copied, setCopied] = useState(false);
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
        <small>DATEXRAY · REFERENCE DESIGN</small>
      </div>
      <div className="template-copy"><p className="eyebrow">{template.recommendedTypes.join(" · ").replaceAll("_", " ")}</p><h3>{template.name}</h3><p>{template.layout}</p><button type="button" onClick={copyBrief}>{copied ? "Brief copied" : "Copy production brief"}</button></div>
    </article>
  );
}
