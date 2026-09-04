import { runtimeDataDir } from "@/lib/data/paths";
import { readStaticJson } from "@/lib/data/static";
import { dataResponse, errorResponse } from "@/lib/http";
import { readLedger } from "@/lib/ledger/ledger";
import { readTopics } from "@/lib/topics/topics";
import type { BrandVoice, ContentType, VisualTemplate } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dataDir = runtimeDataDir();
    const [brand, contentTypeData, templateData, ledger, topicData] = await Promise.all([
      readStaticJson<BrandVoice>("brand-voice.json"),
      readStaticJson<{ contentTypes: ContentType[] }>("content-types.json"),
      readStaticJson<{ templates: VisualTemplate[] }>("visual-templates.json"),
      readLedger({ dataDir }),
      readTopics({ dataDir }),
    ]);
    return dataResponse({
      brand,
      contentTypes: contentTypeData.contentTypes,
      templates: templateData.templates,
      ledger,
      topics: topicData.topics,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
