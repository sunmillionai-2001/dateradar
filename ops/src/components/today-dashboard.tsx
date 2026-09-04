import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import { contentTypeLabel, LEDGER_STATUS_ZH } from "@/lib/i18n/zh-cn";
import { deriveDailyCadence } from "@/lib/ledger/cadence";
import type { LedgerEntry } from "@/lib/types";

function displayDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("zh-CN", { weekday: "long", month: "long", day: "numeric" }).format(parsed);
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
          <p className="eyebrow">今日 · {displayDate(today)}</p>
          <h1>你的内容发布<br /><em>控制室。</em></h1>
          <p className="lede">一条实用的反诈知识，一次坦诚的构建进展，一场真实的互动。</p>
        </div>
        <Link href="/channels/x" className="primary-button"><span>＋</span> 创建今日推文</Link>
      </section>

      <section className="cadence-section" aria-labelledby="cadence-title">
        <div className="section-heading">
          <div><p className="eyebrow">今日节奏</p><h2 id="cadence-title">三个动作，不凑数。</h2></div>
          <span className="progress-count">{completedCount}<small>/ 3 已准备</small></span>
        </div>
        <div className="cadence-grid">
          {cadence.map((item, index) => (
            <article key={item.id} data-testid={`cadence-${item.id}`} className={`cadence-card cadence-card-${item.status}`}>
              <div className="cadence-top"><span className="cadence-number">0{index + 1}</span><StatusPill status={item.status} /></div>
              <div>
                <p className="cadence-kicker">{item.id === "anti_fraud" ? "教育" : item.id === "build_in_public" ? "记录" : "倾听"}</p>
                <h3>{contentTypeLabel(item.id)}</h3>
                <p>{item.id === "anti_fraud"
                  ? "讲清一个可观察的诈骗模式，让它更容易被识别。"
                  : item.id === "build_in_public"
                    ? "分享上线了什么、为什么重要，以及什么改变了你的判断。"
                    : "提出一个值得回答的问题。"}</p>
              </div>
              <Link href={`/channels/x?type=${item.id}`}>{item.status === "empty" ? "开始创作" : "再写一条"}<span>→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-lower">
        <div className="recent-panel">
          <div className="section-heading compact"><div><p className="eyebrow">最近内容</p><h2>来自内容台账</h2></div><Link href="/ledger">查看全部 →</Link></div>
          {recent.length ? (
            <div className="recent-list">
              {recent.map((entry) => (
                <article key={entry.id}>
                  <div><span className="type-chip">{contentTypeLabel(entry.contentType)}</span><time>{entry.lastCopiedAt.slice(0, 10)}</time></div>
                  <p>{entry.finalText}</p>
                  <small>{LEDGER_STATUS_ZH[entry.status]}{entry.isTopPerformer ? " · 高表现内容" : ""}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-panel"><span>✦</span><h3>内容台账已准备好。</h3><p>复制第一条生成的推文后，它会自动出现在这里。</p></div>
          )}
        </div>

        <aside className="score-panel">
          <p className="eyebrow">数据概览</p>
          <div className="score-number">{published.length.toString().padStart(2, "0")}</div>
          <p>条推文已在本地台账标记发布</p>
          <div className="score-rule" />
          <strong>{topPerformers.length} 条高表现内容</strong>
          <p>由你在复盘后手动标记</p>
          <Link href="/review">打开数据复盘 <span>↗</span></Link>
        </aside>
      </section>
    </main>
  );
}
