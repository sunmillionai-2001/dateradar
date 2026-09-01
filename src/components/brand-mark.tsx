type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="DateRadar home">
      <span className="relative grid size-8 place-items-center rounded-full border border-slate-950 bg-slate-950 text-white shadow-[0_4px_12px_rgba(15,23,42,0.18)]">
        <span className="absolute size-4 rounded-full border border-white/55" />
        <span className="absolute h-px w-5 rotate-45 bg-lime-300" />
        <span className="size-1.5 rounded-full bg-lime-300" />
      </span>
      {!compact && (
        <span className="font-display text-[0.95rem] font-extrabold tracking-[0.17em] text-slate-950">
          DATERADAR
        </span>
      )}
    </span>
  );
}
