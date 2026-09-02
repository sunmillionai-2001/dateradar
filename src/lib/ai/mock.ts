import signalLibrary from "../../../signals.json";

import type { AnalysisReport, SignalHit } from "@/lib/analysis-report";

const signalIndex = new Map(
  signalLibrary.signals.map((signal) => [signal.id, signal] as const),
);

function hit(signalId: string, matchedQuote: string, explanation: string, advice: string): SignalHit {
  const signal = signalIndex.get(signalId);
  if (!signal) throw new Error(`Unknown mock signal ${signalId}.`);

  return {
    signal_id: signal.id,
    signal_name: signal.name_en,
    matched_quote: matchedQuote,
    timestamp_sec: null,
    explanation,
    advice,
  };
}

export function analyzeWithMock(transcript: string): AnalysisReport {
  const lower = transcript.toLowerCase();
  const signalHits: SignalHit[] = [];

  if (lower.includes("crypto") && (lower.includes("return") || lower.includes("profit") || lower.includes("3x"))) {
    signalHits.push(hit(
      "S24",
      findQuote(transcript, ["I've been doing crypto trading, made 3x returns this month.", "crypto"]),
      "The conversation promotes crypto returns inside a dating context.",
      "Do not deposit money or follow investment links shared through the relationship.",
    ));
  }

  if ((lower.includes("oil rig") || lower.includes("overseas")) && (lower.includes("can't video") || lower.includes("cannot video") || lower.includes("security rules"))) {
    signalHits.push(hit(
      "S25",
      findQuote(transcript, ["Security rules are strict here, can't video call from the rig.", "oil rig"]),
      "A remote high-status persona is paired with an excuse that prevents video verification.",
      "Pause contact and independently verify the person's identity before taking any action.",
    ));
  }

  if ((lower.includes("my love") || lower.includes("our future")) && (lower.includes("send me") || lower.includes("transfer") || lower.includes("$"))) {
    signalHits.push(hit(
      "S23",
      findQuote(transcript, ["my love, you need to trust me", "my love", "our future"]),
      "Intimate language is being used alongside a direct financial request.",
      "Stop all transfers and speak with a trusted person or your bank before responding.",
    ));
  }

  if (!signalHits.length && lower.includes("go with the flow") && lower.includes("where this is going")) {
    signalHits.push(
      hit(
        "S01",
        findQuote(transcript, ["Let's not put pressure on things, go with the flow.", "go with the flow"]),
        "A direct question about the relationship is answered with a request to keep it undefined.",
        "Ask for a clear answer and notice whether the topic is repeatedly deflected.",
      ),
      hit(
        "S10",
        findQuote(transcript, ["I really like you though.", "I really like you"]),
        "Affection is offered immediately after commitment is avoided, which can keep the connection open without clarity.",
        "Decide what level of ambiguity works for you and state that boundary plainly.",
      ),
    );
  }

  return {
    risk_level: signalHits.some((item) => ["S23", "S24", "S25"].includes(item.signal_id)) ? "critical" : signalHits.length === 2 ? "medium" : "low",
    summary: signalHits.some((item) => ["S23", "S24", "S25"].includes(item.signal_id))
      ? "This conversation contains a direct financial scam pattern that calls for immediate caution."
      : signalHits.length
        ? "The conversation shows a pattern of preserving closeness while avoiding relationship clarity."
        : "No clear warning pattern is supported by the conversation provided.",
    radar: { avoidant: 0, extractive: 0, breadcrumbing: 0, manipulative: 0, deceptive: 0, scam: 0 },
    signal_hits: signalHits,
    next_checklist: signalHits.length
      ? ["Ask one direct question and note whether the answer is clear.", "Keep money and account access completely separate."]
      : ["Keep watching for consistency between words and actions.", "Recheck if the pattern changes over time."],
    disclaimers: "",
  };
}

function findQuote(transcript: string, candidates: string[]) {
  const lower = transcript.toLowerCase();
  for (const candidate of candidates) {
    const index = lower.indexOf(candidate.toLowerCase());
    if (index >= 0) return transcript.slice(index, index + candidate.length);
  }
  return "";
}
