import { runtimeDataDir } from "@/lib/data/paths";
import { dataResponse, errorResponse, readJsonBody } from "@/lib/http";
import { createTopic, readTopics } from "@/lib/topics/topics";
import type { ContentTypeId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return dataResponse((await readTopics({ dataDir: runtimeDataDir() })).topics);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const topic = await createTopic({
      title: typeof body.title === "string" ? body.title : "",
      angle: typeof body.angle === "string" ? body.angle : "",
      contentTypes: Array.isArray(body.contentTypes) ? body.contentTypes as ContentTypeId[] : [],
      tags: Array.isArray(body.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string") : [],
      notes: typeof body.notes === "string" ? body.notes : "",
    }, { dataDir: runtimeDataDir() });
    return dataResponse(topic, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
