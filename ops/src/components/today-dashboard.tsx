import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { deriveDailyCadence } from "@/lib/ledger/cadence";
import type { ContentTypeId, LedgerEntry } from "@/lib/types";

const TYPE_LABELS: Record<ContentTypeId, string> = {
  anti_fraud: "Anti-fraud",
  product_demo: "Product demo",
  build_in_public: "Build progress",
  opinion: "Opinion",
  interaction: "Interaction",
  founder_pov: "Founder POV",
};

function displayDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(parsed);
}

export function TodayDashboard({ entries, today }: { entries: LedgerEntry[]; today: string }) {
  const cadence = deriveDailyCadence(entries, today);
  const published = entries.filter((entry) => entry.status === "published");
  const topPerformers = entries.filter((entry) => entry.isTopPerformer);
  const recent = entries.slice(0, 4);
  const completedCount = cadence.filter((item) => item.status !== "empty").length;

  return (
    <main className="page-shell">
      <section className="page-intro dashboard-intro">
        <div>
          <p className="eyebrow">TODAY · {displayDate(today).toUpperCase()}</p>
          <h1>Your publishing<br /><em>control room.</em></h1>
          <p className="lede">One useful anti-fraud lesson. One honest build update. One real conversation.</p>
        </div>
        <Link href="/channels/x" className="primary-button"><span>＋</span> Create today&apos;s post</Link>
      </section>

      <section className="cadence-section" aria-labelledby="cadence-title">
        <div className="section-heading">
          <div><p className="eyebrow">DAILY RHYTHM</p><h2 id="cadence-title">Three beats. No filler.</h2></div>
          <span className="progress-count">{completedCount}<small>/ 3 prepared</small></span>
        </div>
        <div className="cadence-grid">
          {cadence.map((item, index) => (
            <article key={item.id} data-testid={`cadence-${item.id}`} className={`cadence-card cadence-card-${item.status}`}>
              <div className="cadence-top"><span className="cadence-number">0{index + 1}</span><StatusPill status={item.status} /></div>
              <div>
                <p className="cadence-kicker">{item.id === "anti_fraud" ? "EDUCATE" : item.id === "build_in_public" ? "DOCUMENT" : "LISTEN"}</p>
                <h3>{item.label}</h3>
                <p>{item.id === "anti_fraud"
                  ? "Make one observable scam pattern easier to recognize."
                  : item.id === "build_in_public"
                    ? "Share what shipped, why it matters, and what changed your mind."
                    : "Ask one question worth answering."}</p>
              </div>
              <Link href={`/channels/x?type=${item.id}`}>{item.status === "empty" ? "Start draft" : "Create another"}<span>→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-lower">
        <div className="recent-panel">
          <div className="section-heading compact"><div><p className="eyebrow">RECENT WORK</p><h2>From the ledger</h2></div><Link href="/ledger">View all →</Link></div>
          {recent.length ? (
            <div className="recent-list">
              {recent.map((entry) => (
                <article key={entry.id}>
                  <div><span className="type-chip">{TYPE_LABELS[entry.contentType]}</span><time>{entry.lastCopiedAt.slice(0, 10)}</time></div>
                  <p>{entry.finalText}</p>
                  <small>{entry.status === "published" ? "Published" : "Copied"}{entry.isTopPerformer ? " · Top performer" : ""}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-panel"><span>✦</span><h3>Your ledger is ready.</h3><p>Copy your first generated draft and it will appear here automatically.</p></div>
          )}
        </div>

        <aside className="score-panel">
          <p className="eyebrow">SIGNAL CHECK</p>
          <div className="score-number">{published.length.toString().padStart(2, "0")}</div>
          <p>published posts in your local ledger</p>
          <div className="score-rule" />
          <strong>{topPerformers.length} top performer{topPerformers.length === 1 ? "" : "s"}</strong>
          <p>marked manually after review</p>
          <Link href="/review">Open performance review <span>↗</span></Link>
        </aside>
      </section>
    </main>
  );
}
