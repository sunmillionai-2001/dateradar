import { generateGitInsights } from "@/lib/ai/generate";
import { readGitHistory } from "@/lib/git/history";
import { errorResponse, dataResponse, readJsonBody } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const rangeDays = typeof body.rangeDays === "number" ? body.rangeDays : Number.NaN;
    const commits = await readGitHistory(rangeDays);
    const generated = await generateGitInsights(commits);
    return dataResponse({ commits, insights: generated.insights });
  } catch (error) {
    return errorResponse(error);
  }
}
