import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Legal center",
  description: "DateXray terms, privacy policy, disclaimer, and content reporting channel.",
};

const DOCUMENTS = [
  ["Terms of Service", "The rules for using DateXray and your responsibilities when submitting content.", "/legal/terms"],
  ["Privacy Policy", "What is processed, why it is needed, and how temporary data is handled.", "/legal/privacy"],
  ["Disclaimer", "Important limits: DateXray is an informational signal-screening tool, not a diagnosis or verdict.", "/legal/disclaimer"],
];

export default function LegalIndexPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <SiteHeader />
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Legal center</p>
        <h1 className="font-display mt-4 max-w-4xl text-6xl font-black tracking-[-0.06em] text-slate-950 sm:text-7xl">Clear rules. Careful handling.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Review how DateXray handles submitted conversations, the limits of its reports, and how to request review or removal.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {DOCUMENTS.map(([title, description, href]) => (
            <Link key={href} href={href} className="group rounded-[1.75rem] border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-slate-400 hover:shadow-xl">
              <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
              <span className="mt-8 inline-flex font-black text-slate-950 group-hover:underline">Read document →</span>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
