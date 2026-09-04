import { runtimeDataDir } from "@/lib/data/paths";
import { dataResponse, errorResponse, readJsonBody } from "@/lib/http";
import { updateLedgerEntry } from "@/lib/ledger/ledger";
import type { ContentMetrics, LedgerEntryPatch, LedgerStatus } from "@/lib/types";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const body = await readJsonBody(request);
    const { id } = await params;
    const patch: LedgerEntryPatch = {
      finalText: typeof body.finalText === "string" ? body.finalText : undefined,
      status: typeof body.status === "string" ? body.status as LedgerStatus : undefined,
      publishedAt: body.publishedAt === null || typeof body.publishedAt === "string" ? body.publishedAt : undefined,
      postUrl: body.postUrl === null || typeof body.postUrl === "string" ? body.postUrl : undefined,
      metrics: body.metrics && typeof body.metrics === "object" && !Array.isArray(body.metrics)
        ? body.metrics as Partial<ContentMetrics>
        : undefined,
      isTopPerformer: typeof body.isTopPerformer === "boolean" ? body.isTopPerformer : undefined,
      reviewNotes: typeof body.reviewNotes === "string" ? body.reviewNotes : undefined,
    };
    return dataResponse(await updateLedgerEntry(id, patch, { dataDir: runtimeDataDir() }));
  } catch (error) {
    return errorResponse(error);
  }
}
