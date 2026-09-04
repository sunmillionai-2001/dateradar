import { runtimeDataDir } from "@/lib/data/paths";
import { dataResponse, errorResponse, readJsonBody } from "@/lib/http";
import { readLedger, upsertCopiedEntry } from "@/lib/ledger/ledger";
import { CONTENT_TYPE_IDS, type ContentTypeId, type CopyLedgerInput, type LedgerSource } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseCopyInput(body: Record<string, unknown>): CopyLedgerInput {
  const source = body.source && typeof body.source === "object" && !Array.isArray(body.source)
    ? body.source as Record<string, unknown>
    : {};
  const generation = body.generation && typeof body.generation === "object" && !Array.isArray(body.generation)
    ? body.generation as Record<string, unknown>
    : {};
  const contentType = body.contentType as ContentTypeId;
  if (body.channel !== "x" || !CONTENT_TYPE_IDS.includes(contentType)) throw new Error("Invalid ledger entry.");
  if (typeof body.finalText !== "string" || !body.finalText.trim() || Array.from(body.finalText.trim()).length > 280) {
    throw new Error("Final text must contain between 1 and 280 characters.");
  }
  if (!["manual", "topic", "git", "reuse"].includes(String(source.kind))) throw new Error("Invalid ledger entry.");
  if (typeof source.material !== "string" || !source.material.trim()) throw new Error("Invalid ledger entry.");
  if (!Array.isArray(source.commitHashes) || source.commitHashes.some((hash) => typeof hash !== "string")) {
    throw new Error("Invalid ledger entry.");
  }
  if (typeof generation.generationId !== "string" || !generation.generationId.trim()
    || !Number.isInteger(generation.variantIndex) || typeof generation.originalText !== "string") {
    throw new Error("Invalid ledger entry.");
  }
  return {
    channel: "x",
    contentType,
    source: {
      kind: source.kind as LedgerSource["kind"],
      topicId: typeof source.topicId === "string" ? source.topicId : null,
      material: source.material.trim().slice(0, 12_000),
      commitHashes: source.commitHashes as string[],
    },
    generation: {
      generationId: generation.generationId.trim(),
      variantIndex: generation.variantIndex as number,
      originalText: generation.originalText.slice(0, 280),
    },
    finalText: body.finalText.trim(),
  };
}

export async function GET() {
  try {
    return dataResponse(await readLedger({ dataDir: runtimeDataDir() }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const entry = await upsertCopiedEntry(parseCopyInput(await readJsonBody(request)), { dataDir: runtimeDataDir() });
    return dataResponse(entry, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
