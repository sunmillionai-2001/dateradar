import { analyze } from "@/lib/ai";
import { normalizeTranscript } from "@/lib/transcript";

export const runtime = "nodejs";

const MAX_TRANSCRIPT_CHARACTERS = 60_000;

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return json({ error: "Send the transcript as JSON." }, { status: 415 });
    }

    const body = (await request.json().catch(() => null)) as { transcript?: unknown } | null;
    const transcript = typeof body?.transcript === "string" ? normalizeTranscript(body.transcript) : "";

    if (transcript.length < 20) {
      return json({ error: "Add at least a few lines of conversation before analyzing." }, { status: 400 });
    }
    if (transcript.length > MAX_TRANSCRIPT_CHARACTERS) {
      return json({ error: "This transcript is over the 60,000-character limit." }, { status: 413 });
    }

    const { report, provider } = await analyze(transcript);
    return json(report, { headers: { "X-DateXray-Analysis-Provider": provider } });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return json({ error: "Analysis took too long. Please try again." }, { status: 504 });
    }
    return json(
      { error: error instanceof Error ? error.message : "The conversation could not be analyzed." },
      { status: 502 },
    );
  }
}
