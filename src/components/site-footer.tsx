import Link from "next/link";

import { LEGAL_CONTACT_EMAIL, PRIVACY_PROCESSING_NOTICE } from "@/lib/privacy";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-7 text-xs text-slate-500 sm:px-8 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:px-10">
        <span className="font-bold text-slate-700">© 2026 DATEXRAY</span>
        <p className="max-w-2xl leading-5 lg:justify-self-center lg:text-center">{PRIVACY_PROCESSING_NOTICE}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 font-bold" aria-label="Legal">
          <Link className="transition hover:text-slate-950" href="/legal/terms">Terms</Link>
          <Link className="transition hover:text-slate-950" href="/legal/privacy">Privacy</Link>
          <Link className="transition hover:text-slate-950" href="/legal/disclaimer">Disclaimer</Link>
          <a className="transition hover:text-slate-950" href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=DateXray%20report%20or%20removal%20request`}>Report / removal</a>
        </nav>
      </div>
    </footer>
  );
}
