export const REPORT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
    summary: { type: "string" },
    radar: {
      type: "object",
      additionalProperties: false,
      properties: {
        avoidant: { type: "integer", minimum: 0 },
        extractive: { type: "integer", minimum: 0 },
        breadcrumbing: { type: "integer", minimum: 0 },
        manipulative: { type: "integer", minimum: 0 },
        deceptive: { type: "integer", minimum: 0 },
        scam: { type: "integer", minimum: 0 },
      },
      required: ["avoidant", "extractive", "breadcrumbing", "manipulative", "deceptive", "scam"],
    },
    signal_hits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          signal_id: { type: "string" },
          signal_name: { type: "string" },
          matched_quote: { type: "string" },
          timestamp_sec: { type: ["number", "null"] },
          explanation: { type: "string" },
          advice: { type: "string" },
        },
        required: ["signal_id", "signal_name", "matched_quote", "timestamp_sec", "explanation", "advice"],
      },
    },
    next_checklist: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3 },
    disclaimers: { type: "string" },
  },
  required: ["risk_level", "summary", "radar", "signal_hits", "next_checklist", "disclaimers"],
} as const;
