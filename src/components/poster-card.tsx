import type { CSSProperties, Ref } from "react";

import { reportToRadarDimensions, type AnalysisReport, type RiskLevel } from "@/lib/analysis-report";
import { POSTER_RISK_CONTENT, selectPosterSignals, type PosterSignal } from "@/lib/poster-report";

import styles from "./poster-card.module.css";

export const POSTER_WIDTH = 720;
export const POSTER_HEIGHT = 800;

type PosterCardProps = {
  report: AnalysisReport;
  qrCodeDataUrl: string | null;
  posterRef?: Ref<HTMLDivElement>;
};

type PosterStatus = "clean" | "notice" | "warning" | "alert";

const CATEGORY_LABELS = ["Avoidance", "Taking", "Mixed", "Manipulation", "Deception", "Scam risk"];
const ANGLES = [-90, -30, 30, 90, 150, 210];
const CENTER = 150;
const GRID_RADII = [38, 58, 78, 98];
const LABEL_RADIUS = 121;
const STATUS_COLORS: Record<PosterStatus, string> = {
  clean: "#3cff8f",
  notice: "#ffe45c",
  warning: "#ff8a3d",
  alert: "#98234b",
};
const SEVERITY_COLORS: Record<PosterSignal["severity"], string> = {
  medium: "#ffe45c",
  high: "#ff8a3d",
  critical: "#98234b",
};

function pointAt(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) };
}

function polygonPoints(radius: number) {
  return ANGLES.map((angle) => {
    const point = pointAt(angle, radius);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function statusFor(hits: number, containsHighRiskSignal?: boolean, containsScamSignal?: boolean): PosterStatus {
  if (containsScamSignal || hits >= 3) return "alert";
  if (hits >= 2 || containsHighRiskSignal) return "warning";
  if (hits === 1) return "notice";
  return "clean";
}

function StaticHeart({ riskLevel }: { riskLevel: RiskLevel }) {
  if (riskLevel === "high" || riskLevel === "critical") {
    const color = riskLevel === "critical" ? "#8b805f" : "#a68a50";
    return (
      <g transform={riskLevel === "critical" ? "translate(150 150) scale(.84) rotate(7) translate(-150 -150)" : undefined}>
        <path d="M150 169 C139 161 126 150 129 136 C131 125 142 122 150 133 C156 122 169 126 172 137 C175 150 162 163 150 169 Z" fill={color} />
        <path d="M150 168 C146 177 149 184 141 191" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
        <path d="m150 132-6 11 7 6-6 11" fill="none" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }

  const color = riskLevel === "medium" ? "#bd3f5e" : "#ff4f78";
  const scale = riskLevel === "medium" ? 0.9 : 1.08;
  return (
    <g transform={`translate(150 150) scale(${scale}) translate(-150 -150)`}>
      <path d="M150 174 C141 165 120 150 120 133 C120 119 135 113 150 128 C165 113 180 119 180 133 C180 150 159 165 150 174 Z" fill={color} />
      <path d="M132 127 C137 122 144 123 147 128 C141 127 136 131 132 136 C130 133 130 130 132 127 Z" fill="rgba(255,255,255,.8)" />
    </g>
  );
}

export function PosterCard({ report, qrCodeDataUrl, posterRef }: PosterCardProps) {
  const risk = POSTER_RISK_CONTENT[report.risk_level];
  const signals = selectPosterSignals(report);
  const dimensions = reportToRadarDimensions(report).map((dimension, index) => {
    const status = statusFor(dimension.hits, dimension.containsHighRiskSignal, dimension.containsScamSignal);
    const point = pointAt(ANGLES[index], GRID_RADII[Math.min(Math.max(dimension.hits, 0), 3)]);
    return { ...dimension, status, color: STATUS_COLORS[status], point };
  });
  const signalCount = report.signal_hits.length.toString().padStart(2, "0");

  return (
    <div
      ref={posterRef}
      className={styles.poster}
      style={{ "--poster-accent": risk.accent, "--poster-soft-accent": risk.softAccent } as CSSProperties}
      data-poster-card
    >
      <div className={styles.grain} aria-hidden="true" />

      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Conversation signal report</p>
          <h2 className={styles.riskLabel}>{risk.label}</h2>
          <p className={styles.riskEyebrow}>{risk.eyebrow}</p>
        </div>
        <div className={styles.signalCount} aria-label={`${report.signal_hits.length} signals found`}>
          <strong>{signalCount}</strong>
          <span>signals</span>
        </div>
      </header>

      <div className={styles.middle}>
        <svg className={styles.radar} viewBox="0 0 300 300" role="img" aria-label="Static six-category risk radar">
          <defs>
            <filter id="poster-data-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="poster-heart-glow" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation={report.risk_level === "low" ? "5" : "2"} result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {GRID_RADII.map((radius, index) => (
            <polygon key={radius} points={polygonPoints(radius)} className={index === GRID_RADII.length - 1 ? styles.outerWeb : styles.web} />
          ))}
          {ANGLES.map((angle) => {
            const outer = pointAt(angle, GRID_RADII[3]);
            return <line key={angle} x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} className={styles.axis} />;
          })}

          <polygon points={dimensions.map((dimension) => `${dimension.point.x},${dimension.point.y}`).join(" ")} className={styles.dataFill} />
          <g filter="url(#poster-data-glow)">
            {dimensions.map((dimension, index) => {
              const next = dimensions[(index + 1) % dimensions.length];
              return <line key={dimension.key} x1={dimension.point.x} y1={dimension.point.y} x2={next.point.x} y2={next.point.y} stroke={dimension.color} strokeWidth="2.7" strokeLinecap="round" />;
            })}
            {dimensions.map((dimension) => (
              <circle key={dimension.key} cx={dimension.point.x} cy={dimension.point.y} r={dimension.status === "alert" ? 6.5 : 5} fill={dimension.color} stroke="#0b1120" strokeWidth="2.5" />
            ))}
          </g>

          <circle cx={CENTER} cy={CENTER} r="31" fill="#0b1120" />
          <g filter="url(#poster-heart-glow)" aria-hidden="true"><StaticHeart riskLevel={report.risk_level} /></g>

          {ANGLES.map((angle, index) => {
            const label = pointAt(angle, LABEL_RADIUS);
            const anchor = Math.cos((angle * Math.PI) / 180) > 0.35 ? "start" : Math.cos((angle * Math.PI) / 180) < -0.35 ? "end" : "middle";
            return <text key={angle} x={label.x} y={label.y} textAnchor={anchor} dominantBaseline="middle" className={styles.axisLabel}>{CATEGORY_LABELS[index]}</text>;
          })}
        </svg>

        <section className={styles.highlights} aria-label="Top signal highlights">
          <p className={styles.sectionLabel}>Top signal highlights</p>
          {signals.length ? signals.map((signal, index) => (
            <article key={signal.signal_id} className={styles.signalCard} style={{ "--signal-accent": SEVERITY_COLORS[signal.severity] } as CSSProperties}>
              <div className={styles.signalHeading}>
                <span>{(index + 1).toString().padStart(2, "0")}</span>
                <strong>{signal.signal_name}</strong>
                <small>{signal.categoryLabel}</small>
              </div>
              <blockquote>“{signal.matched_quote}”</blockquote>
            </article>
          )) : (
            <article className={styles.cleanCard}>
              <strong>No evidence-backed signals found</strong>
              <p>One conversation is only one input. Context and consistency over time still matter.</p>
            </article>
          )}
        </section>
      </div>

      <section className={styles.summary} aria-label="Summary and reference guidance">
        <p className={styles.conclusion}>{risk.conclusion}</p>
        <p className={styles.guidance}>{risk.guidance}</p>
      </section>

      <footer className={styles.footer}>
        <div>
          <div className={styles.brandRow}>
            <div className={styles.logo} aria-hidden="true">DX</div>
            <div className={styles.brandCopy}>
              <strong>Generated by DateXray</strong>
              <span>Scan or visit to check your own conversation</span>
            </div>
          </div>
          <p className={styles.url}>www.datexray.com</p>
        </div>
        <div className={styles.qrRow}>
          <span>Scan to view the<br />read-only report</span>
          <div className={styles.qrCode}>
            {qrCodeDataUrl ? (
              <svg viewBox="0 0 120 120" role="img" aria-label="QR code linking to the read-only report">
                <image href={qrCodeDataUrl} width="120" height="120" />
              </svg>
            ) : <span className={styles.qrLoading}>DX</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}
