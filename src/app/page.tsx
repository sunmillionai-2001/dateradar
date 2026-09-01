import Link from "next/link";

import { RiskRadar } from "@/components/risk-radar";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f7f2]">
      <SiteHeader />

      <section className="hero-glow relative border-b border-slate-200">
        <div className="dot-grid absolute inset-0 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
        <div className="relative mx-auto grid min-h-[720px] w-full max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-600 shadow-sm">
              <span className="size-2 rounded-full bg-[#ff6b5f]" />
              Built for clearer dating decisions
            </div>
            <h1 className="font-display text-[clamp(3.6rem,8.5vw,7.5rem)] font-black leading-[0.82] tracking-[-0.075em] text-slate-950">
              See the signals.
              <span className="mt-3 block text-slate-400">Trust your read.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Paste a dating conversation or upload a recording. DateRadar checks for observable relationship risk signals—and shows you the evidence without labels or snap judgments.
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/analyze"
                className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-slate-950 px-7 text-base font-extrabold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
              >
                Analyze a conversation
                <span className="transition group-hover:translate-x-1" aria-hidden="true">→</span>
              </Link>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                <svg viewBox="0 0 20 20" className="size-4" fill="none" aria-hidden="true">
                  <path d="M10 2.5 16 5v4.5c0 3.5-2.3 6.5-6 8-3.7-1.5-6-4.5-6-8V5l6-2.5Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m7.5 10 1.6 1.6 3.7-4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Private, evidence-based, judgment-free
              </span>
            </div>
          </div>

          <div className="relative lg:pl-4">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-lime-300/40 blur-3xl" />
            <div className="absolute -bottom-10 left-4 size-36 rounded-full bg-fuchsia-700/25 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-700/80 bg-[#0b1120] p-5 shadow-[0_34px_90px_rgba(15,23,42,0.34),0_0_0_1px_rgba(148,163,184,0.08)] sm:p-8">
              <div className="pointer-events-none absolute inset-x-12 top-28 h-56 rounded-full bg-blue-500/5 blur-3xl" />
              <div className="relative mb-4 flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">Relationship radar</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-50">Six behavior categories</p>
                </div>
                <span className="rounded-full bg-lime-300 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-950 shadow-[0_0_18px_rgba(185,242,39,0.32)]">Sample</span>
              </div>
              <div className="relative">
                <RiskRadar />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[0.7fr_1.3fr] md:items-center lg:px-10">
          <div className="border-b border-white/15 pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-8">
            <p className="font-display text-5xl font-black tracking-[-0.05em] text-lime-300 sm:text-6xl">$600M+</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.13em] text-slate-400">Lost to romance scams in a year</p>
          </div>
          <div className="md:pl-4">
            <p className="max-w-2xl text-xl font-bold leading-8 text-slate-100 sm:text-2xl">
              Warning signs are easier to see when they are laid out clearly. DateRadar turns a messy conversation into observable patterns you can evaluate.
            </p>
            <p className="mt-3 text-sm text-slate-400">Based on reported U.S. romance fraud losses. Results are informational, not a diagnosis.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-30">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">How it works</p>
          <h2 className="font-display mt-4 text-5xl font-black leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-6xl">
            A second look, in three steps.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            ["01", "Add the conversation", "Paste a chat transcript or upload an audio recording up to 10 minutes."],
            ["02", "Scan observable signals", "We compare the words against a structured library of 25 behavior patterns."],
            ["03", "Review the evidence", "Get a clear risk level, category radar, summary, and evidence you can revisit."],
          ].map(([number, title, copy]) => (
            <article key={number} className="group rounded-[1.75rem] border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-black tracking-[0.15em] text-slate-400">STEP {number}</span>
                <span className="grid size-9 place-items-center rounded-full bg-slate-100 text-lg transition group-hover:bg-lime-300" aria-hidden="true">↗</span>
              </div>
              <h3 className="mt-12 text-xl font-extrabold text-slate-950">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div>
            <p className="font-display text-3xl font-black tracking-[-0.04em] text-slate-950">Clarity starts with one conversation.</p>
            <p className="mt-2 text-slate-500">See what the pattern looks like—privately.</p>
          </div>
          <Link href="/analyze" className="inline-flex min-h-13 items-center rounded-full bg-lime-300 px-7 font-extrabold text-slate-950 transition hover:bg-lime-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950">
            Start a private check <span className="ml-3" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>© 2026 DATERADAR</span>
          <span>Informational guidance only. Not a substitute for professional advice.</span>
        </div>
      </footer>
    </main>
  );
}
