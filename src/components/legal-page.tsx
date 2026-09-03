import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LEGAL_CONTACT_EMAIL } from "@/lib/privacy";

type LegalPageProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalPage({ title, description, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <SiteHeader />
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[220px_1fr] lg:px-10 lg:py-18">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Legal center</p>
          <nav className="mt-5 grid gap-2 text-sm font-extrabold" aria-label="Legal documents">
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-400" href="/legal/terms">Terms of Service</Link>
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-400" href="/legal/privacy">Privacy Policy</Link>
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-400" href="/legal/disclaimer">Disclaimer</Link>
          </nav>
          <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-lime-300">Report or removal</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">Send a notice identifying the content and why it should be reviewed or removed.</p>
            <a className="mt-4 inline-flex font-bold text-white underline decoration-lime-300 underline-offset-4" href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=DateXray%20report%20or%20removal%20request`}>{LEGAL_CONTACT_EMAIL}</a>
          </div>
        </aside>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:p-10 lg:p-12">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Effective September 3, 2026</p>
          <h1 className="font-display mt-4 text-5xl font-black tracking-[-0.055em] text-slate-950 sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{description}</p>
          <div className="legal-copy mt-10">{children}</div>
        </article>
      </div>
      <SiteFooter />
    </main>
  );
}
