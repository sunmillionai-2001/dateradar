import { ANALYSIS_SYSTEM_PROMPT, buildTranscriptPrompt } from "@/lib/ai/prompt";

const DEEPSEEK_MODEL = "deepseek-v4-pro";
const REQUEST_TIMEOUT_MS = 55_000;

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: unknown } }>;
};

export async function analyzeWithDeepSeek(transcript: string, apiKey: string): Promise<unknown> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: buildTranscriptPrompt(transcript) },
      ],
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 4096,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek analysis failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as DeepSeekResponse;
  const text = payload.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("DeepSeek returned no structured report.");
  }

  return JSON.parse(text) as unknown;
}
