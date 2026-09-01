import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

type SiteHeaderProps = {
  showAnalyzeAction?: boolean;
};

export function SiteHeader({ showAnalyzeAction = true }: SiteHeaderProps) {
  return (
    <header className="border-b border-slate-200/75 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:inline-flex">
            <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
              <path d="M5.5 8V6.5a4.5 4.5 0 0 1 9 0V8" stroke="currentColor" strokeWidth="1.5" />
              <rect x="3.5" y="8" width="13" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Private by design
          </span>
          {showAnalyzeAction && (
            <Link
              href="/analyze"
              className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 sm:px-5"
            >
              Check a conversation
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
