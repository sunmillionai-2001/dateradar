import { generateXDrafts } from "@/lib/ai/generate";
import { errorResponse, dataResponse, readJsonBody } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const data = await generateXDrafts({
      contentType: typeof body.contentType === "string" ? body.contentType : "",
      material: typeof body.material === "string" ? body.material : "",
      topicId: typeof body.topicId === "string" ? body.topicId : undefined,
      context: body.context && typeof body.context === "object" && !Array.isArray(body.context)
        ? { goal: typeof (body.context as Record<string, unknown>).goal === "string" ? (body.context as Record<string, string>).goal : undefined }
        : undefined,
    });
    return dataResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}
