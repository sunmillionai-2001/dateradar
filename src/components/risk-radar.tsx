type RadarStatus = "clean" | "notice" | "warning" | "danger";

export type RadarDimension = {
  key: string;
  label: string;
  hits: number;
  containsHighRiskSignal?: boolean;
  containsScamSignal?: boolean;
};

type RiskRadarProps = {
  dimensions?: RadarDimension[];
};

type Point = {
  x: number;
  y: number;
};

const SAMPLE_DIMENSIONS: RadarDimension[] = [
  { key: "avoidant", label: "Avoidance", hits: 0 },
  { key: "extractive", label: "Taking", hits: 1 },
  { key: "breadcrumbing", label: "Mixed signals", hits: 0 },
  { key: "manipulative", label: "Manipulation", hits: 1, containsHighRiskSignal: true },
  { key: "deceptive", label: "Deception", hits: 0 },
  { key: "scam", label: "Scam risk", hits: 1, containsScamSignal: true },
];

const STATUS_STYLES: Record<
  RadarStatus,
  { color: string; softColor: string; textColor: string; label: string }
> = {
  clean: {
    color: "#65a30d",
    softColor: "#ecfccb",
    textColor: "#3f6212",
    label: "Clean",
  },
  notice: {
    color: "#d4a20b",
    softColor: "#fef9c3",
    textColor: "#854d0e",
    label: "Notice",
  },
  warning: {
    color: "#f97316",
    softColor: "#ffedd5",
    textColor: "#9a3412",
    label: "Warning",
  },
  danger: {
    color: "#dc2626",
    softColor: "#fee2e2",
    textColor: "#991b1b",
    label: "Danger",
  },
};

const CENTER = 260;
const AXIS_RADIUS = 152;
const LABEL_RADIUS = 190;
const VALUE_RADII = [32, 72, 112, 152];
const ANGLES = [-90, -30, 30, 90, 150, 210];

function getRadarStatus(dimension: RadarDimension): RadarStatus {
  if (dimension.containsScamSignal || dimension.hits >= 3) return "danger";
  if (dimension.hits >= 2 || dimension.containsHighRiskSignal) return "warning";
  if (dimension.hits === 1) return "notice";
  return "clean";
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
  if (status === "danger" && dimension.containsScamSignal) return "Scam signal found";
  if (status === "warning" && dimension.containsHighRiskSignal) return "1 high-risk signal";
  return `${dimension.hits} ${dimension.hits === 1 ? "signal" : "signals"}`;
}

export function RiskRadar({ dimensions: radarDimensions = SAMPLE_DIMENSIONS }: RiskRadarProps) {
  const dimensions = radarDimensions.map((dimension, index) => {
    const status = getRadarStatus(dimension);
    const dataRadius = VALUE_RADII[Math.min(dimension.hits, 3)];

    return {
      ...dimension,
      angle: ANGLES[index],
      status,
      style: STATUS_STYLES[status],
      point: pointAt(ANGLES[index], dataRadius),
      axisPoint: pointAt(ANGLES[index], AXIS_RADIUS),
      labelPoint: pointAt(ANGLES[index], LABEL_RADIUS),
    };
  });

  const accessibleSummary = dimensions
    .map((dimension) => `${dimension.label}: ${dimension.style.label.toLowerCase()}, ${legendDetail(dimension, dimension.status)}`)
    .join("; ");

  return (
    <div>
      <div className="relative mx-auto aspect-square w-full max-w-[500px]">
        <svg
          viewBox="0 0 520 520"
          className="relative size-full overflow-visible"
          role="img"
          aria-label={`Sample six-category risk radar. ${accessibleSummary}.`}
        >
          <defs>
            <linearGradient id="radar-area-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b9f227" stopOpacity="0.14" />
              <stop offset="0.68" stopColor="#f97316" stopOpacity="0.12" />
              <stop offset="1" stopColor="#dc2626" stopOpacity="0.2" />
            </linearGradient>
            {dimensions.map((dimension, index) => {
              const next = dimensions[(index + 1) % dimensions.length];
              return (
                <linearGradient
                  key={dimension.key}
                  id={`radar-edge-${dimension.key}`}
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
            {dimensions
              .filter((dimension) => dimension.status === "danger")
              .map((dimension) => (
                <radialGradient
                  key={`glow-${dimension.key}`}
                  id={`radar-danger-glow-${dimension.key}`}
                  gradientUnits="userSpaceOnUse"
                  cx={dimension.point.x}
                  cy={dimension.point.y}
                  r="112"
                >
                  <stop offset="0" stopColor={dimension.style.color} stopOpacity="0.28" />
                  <stop offset="0.56" stopColor={dimension.style.color} stopOpacity="0.09" />
                  <stop offset="1" stopColor={dimension.style.color} stopOpacity="0" />
                </radialGradient>
              ))}
          </defs>

          <circle cx={CENTER} cy={CENTER} r="205" fill="#fff" stroke="#e2e8f0" />
          {dimensions
            .filter((dimension) => dimension.status === "danger")
            .map((dimension) => (
              <circle
                key={`glow-area-${dimension.key}`}
                cx={dimension.point.x}
                cy={dimension.point.y}
                r="112"
                fill={`url(#radar-danger-glow-${dimension.key})`}
              />
            ))}

          {VALUE_RADII.map((radius, index) => (
            <g key={radius}>
              <polygon
                points={polygonPoints(radius)}
                fill={index === 0 ? "#f8fafc" : "none"}
                stroke={index === VALUE_RADII.length - 1 ? "#cbd5e1" : "#dbe3ec"}
                strokeDasharray={index === 0 ? undefined : "4 7"}
              />
              <text
                x={CENTER + 7}
                y={CENTER - radius + 4}
                fill="#94a3b8"
                fontSize="10"
                fontWeight="700"
              >
                {index === 3 ? "3+" : index}
              </text>
            </g>
          ))}

          {dimensions.map((dimension) => (
            <line
              key={`axis-${dimension.key}`}
              data-radar-axis={dimension.key}
              data-status={dimension.status}
              x1={CENTER}
              y1={CENTER}
              x2={dimension.axisPoint.x}
              y2={dimension.axisPoint.y}
              stroke={dimension.status === "danger" ? dimension.style.color : "#cbd5e1"}
              strokeWidth={dimension.status === "danger" ? 3 : 1.2}
              strokeDasharray={dimension.status === "danger" ? "8 7" : undefined}
              opacity={dimension.status === "danger" ? 0.82 : 0.75}
            />
          ))}

          <polygon
            points={dimensions.map((dimension) => `${dimension.point.x},${dimension.point.y}`).join(" ")}
            fill="url(#radar-area-fill)"
            stroke="none"
          />

          {dimensions.map((dimension, index) => {
            const next = dimensions[(index + 1) % dimensions.length];
            return (
              <line
                key={`edge-${dimension.key}`}
                x1={dimension.point.x}
                y1={dimension.point.y}
                x2={next.point.x}
                y2={next.point.y}
                stroke={`url(#radar-edge-${dimension.key})`}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            );
          })}

          {dimensions.map((dimension) => (
            <g key={`point-${dimension.key}`} data-radar-point={dimension.key} data-status={dimension.status}>
              {dimension.status === "danger" && (
                <circle
                  cx={dimension.point.x}
                  cy={dimension.point.y}
                  r="17"
                  fill={dimension.style.softColor}
                  stroke={dimension.style.color}
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              )}
              <circle
                cx={dimension.point.x}
                cy={dimension.point.y}
                r={dimension.status === "danger" ? 9 : 7}
                fill={dimension.style.color}
                stroke="#fff"
                strokeWidth="3"
              />
            </g>
          ))}

          {dimensions.map((dimension) => {
            const anchor = labelAnchor(dimension.angle);
            const statusY = dimension.labelPoint.y + 17;

            return (
              <g key={`label-${dimension.key}`}>
                <text
                  x={dimension.labelPoint.x}
                  y={dimension.labelPoint.y}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill="#0f172a"
                  fontSize="17"
                  fontWeight="800"
                >
                  {dimension.label}
                </text>
                <text
                  x={dimension.labelPoint.x}
                  y={statusY}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill={dimension.style.textColor}
                  fontSize="12"
                  fontWeight="800"
                  letterSpacing="0.06em"
                >
                  {dimension.style.label.toUpperCase()} · {dimension.hits}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-x-[27%] top-[47%] text-center">
          <span className="rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 shadow-sm">
            Signals found
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-5 sm:grid-cols-3">
        {dimensions.map((dimension) => (
          <div
            key={`legend-${dimension.key}`}
            data-radar-legend={dimension.key}
            data-status={dimension.status}
            className="rounded-xl border px-3 py-2.5"
            style={{
              backgroundColor: dimension.style.softColor,
              borderColor: `${dimension.style.color}38`,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className={`shrink-0 rounded-full ${dimension.status === "danger" ? "size-3 ring-2 ring-red-200" : "size-2.5"}`}
                style={{ backgroundColor: dimension.style.color }}
              />
              <span className="truncate text-[11px] font-extrabold text-slate-800">{dimension.label}</span>
            </div>
            <p className="mt-1 pl-[18px] text-[10px] font-bold" style={{ color: dimension.style.textColor }}>
              {dimension.style.label} · {legendDetail(dimension, dimension.status)}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500">
        <span className="mt-1 flex shrink-0 items-center gap-0.5" aria-hidden="true">
          {(["clean", "notice", "warning", "danger"] as const).map((status) => (
            <span key={status} className="size-2 rounded-full" style={{ backgroundColor: STATUS_STYLES[status].color }} />
          ))}
        </span>
        Darker color = more dangerous signals found in this category.
      </p>
    </div>
  );
}
