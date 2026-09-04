import type { GenerationDraft } from "@/lib/types";

export function DraftCard({
  draft,
  index,
  text,
  busy,
  onChange,
  onCopy,
}: {
  draft: GenerationDraft;
  index: number;
  text: string;
  busy: boolean;
  onChange: (text: string) => void;
  onCopy: () => void;
}) {
  const length = Array.from(text).length;
  return (
    <article className="draft-card">
      <header><span>VERSION {String.fromCharCode(65 + index)}</span><strong>{draft.angle}</strong></header>
      <textarea
        aria-label={`Edit draft ${index + 1}`}
        value={text}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
      />
      <div className="draft-meta"><span className={length > 280 ? "over-limit" : undefined}>{length} / 280</span><p>{draft.whyItWorks}</p></div>
      <button
        type="button"
        aria-label={`Copy and log draft ${index + 1}`}
        onClick={onCopy}
        disabled={busy || !text.trim() || length > 280}
      >
        {busy ? "Saving…" : `Copy and log draft ${index + 1}`} <span aria-hidden="true">↗</span>
      </button>
    </article>
  );
}
