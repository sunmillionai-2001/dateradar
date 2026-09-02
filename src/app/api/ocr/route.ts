import sharp from "sharp";

import { normalizeTranscript } from "@/lib/transcript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALIYUN_OCR_ENDPOINT = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const ALIYUN_OCR_MODEL = "qwen3.5-ocr";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_BASE64_SOURCE_BYTES = 7 * 1024 * 1024;
const OCR_TIMEOUT_MS = 45_000;
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/bmp", "image/tiff"]);
const OCR_PROMPT = [
  "Extract every visible Chinese or English message from this chat screenshot.",
  "Preserve the visual reading order, line breaks, punctuation, and any speaker names already shown.",
  "Do not invent speaker names or missing words. Return only the extracted text without commentary or markdown fences.",
].join(" ");

type AliyunOcrResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

function json(body: Record<string, unknown>, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

function getAliyunText(payload: AliyunOcrResponse) {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") return normalizeTranscript(content);
  if (!Array.isArray(content)) return "";

  return normalizeTranscript(
    content
      .map((item) => {
        if (!item || typeof item !== "object" || !("text" in item)) return "";
        return typeof item.text === "string" ? item.text : "";
      })
      .filter(Boolean)
      .join("\n"),
  );
}

async function prepareImage(source: Buffer) {
  const pipeline = sharp(source, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" });
  let result = await pipeline.jpeg({ quality: 90, chromaSubsampling: "4:4:4" }).toBuffer();

  if (result.byteLength > MAX_BASE64_SOURCE_BYTES) {
    result = await sharp(source, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 3072, height: 3072, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 80, chromaSubsampling: "4:4:4" })
      .toBuffer();
  }

  if (result.byteLength > MAX_BASE64_SOURCE_BYTES) {
    throw new Error("normalized-image-too-large");
  }

  return result;
}

export async function GET() {
  return json({ provider: process.env.ALIYUN_OCR_API_KEY?.trim() ? "aliyun" : "local" });
}

export async function POST(request: Request) {
  let requestBody: FormData | null = null;
  let sourceBuffer: Buffer | null = null;
  let normalizedBuffer: Buffer | null = null;
  let imageDataUrl = "";

  try {
    const apiKey = process.env.ALIYUN_OCR_API_KEY?.trim();
    if (!apiKey) {
      return json({ error: "Alibaba Cloud OCR is not configured.", fallback: true }, { status: 503 });
    }

    if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
      return json({ error: "Choose a screenshot to process." }, { status: 400 });
    }

    requestBody = await request.formData();
    const image = requestBody.get("image");

    if (!(image instanceof File)) {
      return json({ error: "Choose a screenshot to process." }, { status: 400 });
    }

    if (!SUPPORTED_IMAGE_TYPES.has(image.type)) {
      return json({ error: "The selected screenshot format is not supported." }, { status: 415 });
    }

    if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
      return json({ error: "Each screenshot must be between 1 byte and 10 MB." }, { status: 413 });
    }

    sourceBuffer = Buffer.from(await image.arrayBuffer());
    normalizedBuffer = await prepareImage(sourceBuffer);
    imageDataUrl = `data:image/jpeg;base64,${normalizedBuffer.toString("base64")}`;

    const response = await fetch(ALIYUN_OCR_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ALIYUN_OCR_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageDataUrl } },
              { type: "text", text: OCR_PROMPT },
            ],
          },
        ],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(OCR_TIMEOUT_MS),
    });
    const payload = (await response.json().catch(() => ({}))) as AliyunOcrResponse;

    if (!response.ok) {
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      return json({ error: "Alibaba Cloud OCR could not process this screenshot. Check the API key and service region." }, { status });
    }

    const text = getAliyunText(payload);
    if (!text) {
      return json({ error: "No readable text was found in this screenshot." }, { status: 502 });
    }

    return json({ text, provider: "aliyun" });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      return json({ error: "Alibaba Cloud OCR took longer than 45 seconds. Please try again." }, { status: 504 });
    }

    if (error instanceof Error && error.message === "normalized-image-too-large") {
      return json({ error: "This screenshot is too complex to process securely. Try a smaller image." }, { status: 413 });
    }

    return json({ error: "The screenshot could not be processed. Please try another image." }, { status: 500 });
  } finally {
    requestBody?.delete("image");
    requestBody = null;
    sourceBuffer?.fill(0);
    normalizedBuffer?.fill(0);
    sourceBuffer = null;
    normalizedBuffer = null;
    imageDataUrl = "";
  }
}
