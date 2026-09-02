import styles from "./risk-radar.module.css";

type RadarStatus = "clean" | "notice" | "warning" | "alert";
type VitalityState = "healthy" | "low" | "medium" | "high" | "critical";

export type RadarDimension = {
  key: string;
  label: string;
  hits: number;
  containsHighRiskSignal?: boolean;
  containsScamSignal?: boolean;
};

type RiskRadarProps = {
  dimensions?: RadarDimension[];
  compact?: boolean;
};

type Point = {
  x: number;
  y: number;
};

const SAMPLE_DIMENSIONS: RadarDimension[] = [
  { key: "avoidant", label: "Avoidance", hits: 0 },
  { key: "extractive", label: "Taking", hits: 1 },
  { key: "breadcrumbing", label: "Mixed", hits: 0 },
  { key: "manipulative", label: "Manipulation", hits: 2 },
  { key: "deceptive", label: "Deception", hits: 0 },
  { key: "scam", label: "Scam risk", hits: 1, containsScamSignal: true },
];

const STATUS_STYLES: Record<
  RadarStatus,
  { color: string; softColor: string; textColor: string; label: string }
> = {
  clean: {
    color: "#3cff8f",
    softColor: "rgba(60, 255, 143, 0.075)",
    textColor: "#8dffbd",
    label: "Clean",
  },
  notice: {
    color: "#ffe45c",
    softColor: "rgba(255, 228, 92, 0.08)",
    textColor: "#fff0a3",
    label: "Notice",
  },
  warning: {
    color: "#ff8a3d",
    softColor: "rgba(255, 138, 61, 0.09)",
    textColor: "#ffbc8f",
    label: "Warning",
  },
  alert: {
    color: "#98234b",
    softColor: "rgba(152, 35, 75, 0.16)",
    textColor: "#f3a5bc",
    label: "Alert",
  },
};

const VITALITY_CONTENT: Record<
  VitalityState,
  { label: string; motion: string; color: string; isWilted: boolean; className: string }
> = {
  healthy: {
    label: "Healthy",
    motion: "Lively pulse",
    color: "#ff4f78",
    isWilted: false,
    className: styles.heartHealthy,
  },
  low: {
    label: "Steady",
    motion: "Normal pulse",
    color: "#ef496d",
    isWilted: false,
    className: styles.heartLow,
  },
  medium: {
    label: "Strained",
    motion: "Slower pulse",
    color: "#bd3f5e",
    isWilted: false,
    className: styles.heartMedium,
  },
  high: {
    label: "Fading",
    motion: "Barely moving",
    color: "#a68a50",
    isWilted: true,
    className: styles.heartHigh,
  },
  critical: {
    label: "Withered",
    motion: "Still",
    color: "#8b805f",
    isWilted: true,
    className: styles.heartCritical,
  },
};

const CENTER = 220;
const AXIS_RADIUS = 140;
const LABEL_RADIUS = 176;
const HEART_CLEAR_RADIUS = 34;
const VALUE_RADII = [56, 84, 112, 140];
const ANGLES = [-90, -30, 30, 90, 150, 210];

function getRadarStatus(dimension: RadarDimension): RadarStatus {
  if (dimension.containsScamSignal || dimension.hits >= 3) return "alert";
  if (dimension.hits >= 2 || dimension.containsHighRiskSignal) return "warning";
  if (dimension.hits === 1) return "notice";
  return "clean";
}

function getVitalityState(statuses: RadarStatus[], totalHits: number): VitalityState {
  if (statuses.includes("alert")) return "critical";

  const warningCount = statuses.filter((status) => status === "warning").length;
  if (totalHits >= 3 || warningCount >= 2) return "high";
  if (totalHits >= 2 || warningCount === 1) return "medium";
  if (totalHits === 1) return "low";
  return "healthy";
}

function pointAt(angle: number, radius: number): Point {
  const radians = (angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function polygonPoints(radius: number) {
  return ANGLES.map((angle) => {
    const point = pointAt(angle, radius);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function labelAnchor(angle: number): "start" | "middle" | "end" {
  const horizontal = Math.cos((angle * Math.PI) / 180);
  if (horizontal > 0.35) return "start";
  if (horizontal < -0.35) return "end";
  return "middle";
}

function legendDetail(dimension: RadarDimension, status: RadarStatus) {
  if (status === "alert" && dimension.containsScamSignal) return "Scam signal found";
  if (status === "warning" && dimension.containsHighRiskSignal) return "1 high-risk signal";
  return `${dimension.hits} ${dimension.hits === 1 ? "signal" : "signals"}`;
}

export function RiskRadar({ dimensions: radarDimensions = SAMPLE_DIMENSIONS, compact = false }: RiskRadarProps) {
  const dimensions = radarDimensions.slice(0, ANGLES.length).map((dimension, index) => {
    const angle = ANGLES[index];
    const status = getRadarStatus(dimension);
    const dataRadius = VALUE_RADII[Math.min(Math.max(dimension.hits, 0), 3)];

    return {
      ...dimension,
      angle,
      status,
      style: STATUS_STYLES[status],
      point: pointAt(angle, dataRadius),
      axisPoint: pointAt(angle, AXIS_RADIUS),
      alertEdgeStart: pointAt(angle, HEART_CLEAR_RADIUS),
      labelPoint: pointAt(angle, LABEL_RADIUS),
    };
  });

  const totalHits = dimensions.reduce((total, dimension) => total + Math.max(dimension.hits, 0), 0);
  const vitalityState = getVitalityState(
    dimensions.map((dimension) => dimension.status),
    totalHits,
  );
  const vitality = VITALITY_CONTENT[vitalityState];

  const accessibleSummary = dimensions
    .map(
      (dimension) =>
        `${dimension.label}: ${dimension.style.label.toLowerCase()}, ${legendDetail(dimension, dimension.status)}`,
    )
    .join("; ");

  return (
    <div className={`${styles.radarShell} ${compact ? styles.compact : ""}`}>
      <div className={styles.chartWrap}>
        <svg
          viewBox="0 0 440 440"
          className={styles.chart}
          role="img"
          aria-label={`Six-category relationship risk radar. Relationship vitality: ${vitality.label}, ${vitality.motion.toLowerCase()}. ${accessibleSummary}.`}
        >
          <defs>
            <linearGradient id="risk-radar-area-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={dimensions[0]?.style.color ?? STATUS_STYLES.clean.color} stopOpacity="0.16" />
              <stop offset="0.55" stopColor={dimensions[3]?.style.color ?? STATUS_STYLES.warning.color} stopOpacity="0.2" />
              <stop offset="1" stopColor={dimensions[5]?.style.color ?? STATUS_STYLES.alert.color} stopOpacity="0.25" />
            </linearGradient>
            <filter id="risk-radar-data-glow" x="-45%" y="-45%" width="190%" height="190%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation="3.5" result="dataBlur" />
              <feMerge>
                <feMergeNode in="dataBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="risk-radar-heart-glow" x="-90%" y="-90%" width="280%" height="280%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation="6" result="heartBlur" />
              <feMerge>
                <feMergeNode in="heartBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="risk-radar-heart-muted-glow" x="-45%" y="-45%" width="190%" height="190%" colorInterpolationFilters="sRGB">
              <feGaussianBlur stdDeviation="2" result="heartMutedBlur" />
              <feMerge>
                <feMergeNode in="heartMutedBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {dimensions.map((dimension, index) => {
              const next = dimensions[(index + 1) % dimensions.length];
              if (!next) return null;

              return (
                <linearGradient
                  key={dimension.key}
                  id={`risk-radar-edge-${dimension.key}`}
                  gradientUnits="userSpaceOnUse"
                  x1={dimension.point.x}
                  y1={dimension.point.y}
                  x2={next.point.x}
                  y2={next.point.y}
                >
                  <stop offset="0" stopColor={dimension.style.color} />
                  <stop offset="1" stopColor={next.style.color} />
                </linearGradient>
              );
            })}
          </defs>

          <g className={styles.web}>
            {VALUE_RADII.map((radius, index) => (
              <polygon
                key={radius}
                points={polygonPoints(radius)}
                fill="none"
                stroke={index === VALUE_RADII.length - 1 ? "#6680a2" : "#435674"}
                strokeWidth={index === VALUE_RADII.length - 1 ? 1.35 : 1}
                strokeDasharray="4 6"
                opacity={index === VALUE_RADII.length - 1 ? 0.82 : 0.68}
              />
            ))}
            {dimensions.map((dimension) => (
              <line
                key={`axis-${dimension.key}`}
                x1={CENTER}
                y1={CENTER}
                x2={dimension.axisPoint.x}
                y2={dimension.axisPoint.y}
                stroke="#526782"
                strokeWidth="1"
                opacity="0.64"
              />
            ))}
          </g>

          <g className={styles.ticks} aria-hidden="true">
            {VALUE_RADII.map((radius, index) => (
              <text key={radius} x={CENTER + 12} y={CENTER - radius + 4}>
                {index === VALUE_RADII.length - 1 ? "3+" : index}
              </text>
            ))}
          </g>

          <polygon
            points={dimensions.map((dimension) => `${dimension.point.x},${dimension.point.y}`).join(" ")}
            fill="url(#risk-radar-area-fill)"
            stroke="none"
          />

          <g filter="url(#risk-radar-data-glow)">
            {dimensions.map((dimension, index) => {
              const next = dimensions[(index + 1) % dimensions.length];
              if (!next) return null;

              return (
                <line
                  key={`edge-${dimension.key}`}
                  x1={dimension.point.x}
                  y1={dimension.point.y}
                  x2={next.point.x}
                  y2={next.point.y}
                  stroke={`url(#risk-radar-edge-${dimension.key})`}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}

            {dimensions
              .filter((dimension) => dimension.status === "alert")
              .map((dimension) => (
                <line
                  key={`alert-edge-${dimension.key}`}
                  x1={dimension.alertEdgeStart.x}
                  y1={dimension.alertEdgeStart.y}
                  x2={dimension.point.x}
                  y2={dimension.point.y}
                  stroke={dimension.style.color}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              ))}

            {dimensions.map((dimension) => (
              <g key={`point-${dimension.key}`} data-radar-point={dimension.key} data-status={dimension.status}>
                <circle
                  cx={dimension.point.x}
                  cy={dimension.point.y}
                  r={dimension.status === "alert" ? 16 : 12}
                  fill={dimension.style.color}
                  opacity={dimension.status === "alert" ? 0.23 : 0.18}
                />
                <circle
                  cx={dimension.point.x}
                  cy={dimension.point.y}
                  r={dimension.status === "alert" ? 10 : 7}
                  fill={dimension.style.color}
                  stroke="#0b1120"
                  strokeWidth={dimension.status === "alert" ? 4 : 3}
                />
              </g>
            ))}
          </g>

          <circle cx={CENTER} cy={CENTER} r={HEART_CLEAR_RADIUS} fill="#0b1120" />

          <g
            className={`${styles.heart} ${vitality.className}`}
            style={{ color: vitality.color }}
            filter={vitality.isWilted ? "url(#risk-radar-heart-muted-glow)" : "url(#risk-radar-heart-glow)"}
            aria-hidden="true"
          >
            {vitality.isWilted ? (
              <>
                <path d="M220 239 C210 232 196 221 199 207 C201 197 212 194 220 204 C225 194 239 198 241 208 C244 220 232 233 220 239 Z" fill="currentColor" />
                <path d="M220 238 C216 247 219 253 212 260" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <path d="m220 203-5 10 6 5-5 10" fill="none" stroke="#0b1120" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </>
            ) : (
              <>
                <path d="M220 245 C212 237 190 221 190 204 C190 190 205 184 220 199 C235 184 250 190 250 204 C250 221 228 237 220 245 Z" fill="currentColor" />
                <path d="M202 198 C207 193 213 194 216 199 C210 198 205 202 202 207 C200 204 200 201 202 198 Z" fill="rgba(255,255,255,0.82)" />
              </>
            )}
          </g>

          {dimensions.map((dimension) => {
            const anchor = labelAnchor(dimension.angle);
            const statusY = dimension.labelPoint.y + 17;

            return (
              <g key={`label-${dimension.key}`}>
                <text
                  className={styles.axisLabel}
                  x={dimension.labelPoint.x}
                  y={dimension.labelPoint.y}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                >
                  {dimension.label}
                </text>
                <text
                  className={styles.statusLabel}
                  x={dimension.labelPoint.x}
                  y={statusY}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill={dimension.style.textColor}
                >
                  {dimension.style.label.toUpperCase()} · {dimension.hits}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.vitalityRow} data-vitality-state={vitalityState}>
        <div>
          <p className={styles.vitalityEyebrow}>Relationship vitality</p>
          <p className={styles.vitalityLabel}>{vitality.label}</p>
        </div>
        <p className={styles.vitalityMotion}>{vitality.motion}</p>
      </div>

      <div className={styles.statusGrid}>
        {dimensions.map((dimension) => (
          <div
            key={`legend-${dimension.key}`}
            data-radar-legend={dimension.key}
            data-status={dimension.status}
            className={styles.statusCard}
            style={{
              backgroundColor: dimension.style.softColor,
              borderColor: `${dimension.style.color}55`,
            }}
          >
            <div className={styles.statusCardHeading}>
              <span
                className={dimension.status === "alert" ? styles.alertSwatch : styles.statusSwatch}
                style={{ backgroundColor: dimension.style.color, color: dimension.style.color }}
              />
              <span>{dimension.label}</span>
            </div>
            <p style={{ color: dimension.style.textColor }}>
              {dimension.style.label} · {legendDetail(dimension, dimension.status)}
            </p>
          </div>
        ))}
      </div>

      <p className={styles.legendCopy}>
        <span className={styles.legendScale} aria-hidden="true">
          {(["clean", "notice", "warning", "alert"] as const).map((status) => (
            <span key={status} style={{ backgroundColor: STATUS_STYLES[status].color }} />
          ))}
        </span>
        Darker color = more dangerous signals found in this category.
      </p>
    </div>
  );
}
