import { runtimeDataDir } from "@/lib/data/paths";
import { dataResponse, errorResponse, readJsonBody } from "@/lib/http";
import { deleteTopic, updateTopic } from "@/lib/topics/topics";
import type { ContentTypeId, TopicStatus } from "@/lib/types";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const body = await readJsonBody(request);
    const { id } = await params;
    const topic = await updateTopic(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      angle: typeof body.angle === "string" ? body.angle : undefined,
      contentTypes: Array.isArray(body.contentTypes) ? body.contentTypes as ContentTypeId[] : undefined,
      tags: Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      status: typeof body.status === "string" ? body.status as TopicStatus : undefined,
      lastUsedAt: body.lastUsedAt === null || typeof body.lastUsedAt === "string" ? body.lastUsedAt : undefined,
    }, { dataDir: runtimeDataDir() });
    return dataResponse(topic);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { id } = await params;
    await deleteTopic(id, { dataDir: runtimeDataDir() });
    return dataResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
