import { normalizeTranscript } from "@/lib/transcript";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const TRANSCRIPTION_TIMEOUT_MS = 55_000;
const MOCK_TRANSCRIPT = `Alex: I had a great time last night.
Jordan: Me too. Want to meet again this weekend?
Alex: Saturday works for me.
Jordan: Perfect. Let's pick a public place downtown.`;

type OpenAITranscriptionResponse = {
  text?: unknown;
  error?: {
    message?: unknown;
  };
};

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

export async function POST(request: Request) {
  let requestBody: FormData | null = null;

  try {
    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return json({ error: "Choose an audio recording to transcribe." }, { status: 400 });
    }

    requestBody = await request.formData();
    const audio = requestBody.get("audio");

    if (!(audio instanceof File)) {
      return json({ error: "Choose an audio recording to transcribe." }, { status: 400 });
    }

    if (!audio.type.startsWith("audio/")) {
      return json({ error: "The selected file is not a supported audio recording." }, { status: 415 });
    }

    if (audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
      return json({ error: "Audio must be between 1 byte and 25 MB." }, { status: 413 });
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      return json({
        transcript: MOCK_TRANSCRIPT,
        mode: "mock",
      });
    }

    const openAIForm = new FormData();
    openAIForm.append("file", audio, audio.name);
    openAIForm.append("model", "whisper-1");
    openAIForm.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openAIForm,
      cache: "no-store",
      signal: AbortSignal.timeout(TRANSCRIPTION_TIMEOUT_MS),
    });
    const payload = (await response.json().catch(() => ({}))) as OpenAITranscriptionResponse;

    if (!response.ok) {
      const detail = typeof payload.error?.message === "string" ? payload.error.message : "OpenAI could not transcribe this recording.";
      return json({ error: detail }, { status: response.status });
    }

    if (typeof payload.text !== "string" || !payload.text.trim()) {
      return json({ error: "The recording did not produce a readable transcript." }, { status: 502 });
    }

    return json({
      transcript: normalizeTranscript(payload.text),
      mode: "whisper",
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return json({ error: "Transcription took longer than 55 seconds. Please try again." }, { status: 504 });
    }

    return json({ error: "The audio could not be transcribed. Please try another file." }, { status: 500 });
  } finally {
    // Audio is never written to disk. Dropping the multipart reference makes the
    // request-scoped file eligible for immediate cleanup after this response.
    requestBody?.delete("audio");
    requestBody = null;
  }
}
