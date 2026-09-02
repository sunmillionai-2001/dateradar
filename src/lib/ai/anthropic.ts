import { ANALYSIS_SYSTEM_PROMPT, buildTranscriptPrompt } from "@/lib/ai/prompt";
import { REPORT_JSON_SCHEMA } from "@/lib/ai/schema";

const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
const REQUEST_TIMEOUT_MS = 55_000;

type AnthropicResponse = {
  content?: Array<{ type?: unknown; text?: unknown }>;
};

export async function analyzeWithAnthropic(transcript: string, apiKey: string): Promise<unknown> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      temperature: 0,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildTranscriptPrompt(transcript) }],
      output_config: {
        format: { type: "json_schema", schema: REPORT_JSON_SCHEMA },
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Anthropic analysis failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as AnthropicResponse;
  const text = payload.content?.find((block) => block.type === "text")?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Anthropic returned no structured report.");
  }

  return JSON.parse(text) as unknown;
}
