import { randomUUID } from "node:crypto";

import { requestDeepSeekJson, type DeepSeekDependencies } from "@/lib/ai/deepseek";
import { buildGitPrompts, buildRepairPrompt, buildXPrompts, type XGenerationInput } from "@/lib/ai/prompt";
import { parseGitInsights, parseXDrafts } from "@/lib/ai/schema";
import { CONTENT_TYPE_IDS, type GenerationResult, type GitCommit, type GitInsight } from "@/lib/types";

type GenerationDependencies = DeepSeekDependencies & {
  idFactory?: () => string;
};

function validateInput(input: XGenerationInput) {
  if (!CONTENT_TYPE_IDS.includes(input.contentType as (typeof CONTENT_TYPE_IDS)[number])) {
    throw new Error("Choose one of the six supported content types.");
  }
  const length = Array.from(input.material.trim()).length;
  if (length < 3) throw new Error("Source material must contain at least 3 characters.");
  if (length > 12_000) throw new Error("Source material must contain at most 12000 characters.");
  if (Array.from(input.context?.goal?.trim() ?? "").length > 500) {
    throw new Error("Operator goal must contain at most 500 characters.");
  }
}

async function requestWithOneRepair<T>(
  system: string,
  user: string,
  parse: (value: unknown) => T,
  failureMessage: string,
  dependencies: DeepSeekDependencies,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await requestDeepSeekJson(system, user, dependencies);
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes("not configured") || error.message.includes("request failed")
    )) throw error;
    raw = { malformedResponse: error instanceof Error ? error.message : "Unknown provider response" };
  }

  try {
    return parse(raw);
  } catch (firstError) {
    const repaired = await requestDeepSeekJson(
      system,
      buildRepairPrompt(raw, firstError instanceof Error ? firstError.message : "Invalid output"),
      dependencies,
    );
    try {
      return parse(repaired);
    } catch {
      throw new Error(failureMessage);
    }
  }
}

export async function generateXDrafts(
  input: XGenerationInput,
  dependencies: GenerationDependencies = {},
): Promise<GenerationResult> {
  validateInput(input);
  const { system, user } = await buildXPrompts(input);
  const drafts = await requestWithOneRepair(
    system,
    user,
    parseXDrafts,
    "DeepSeek returned invalid X drafts after one repair attempt.",
    dependencies,
  );
  return {
    generationId: (dependencies.idFactory ?? randomUUID)(),
    drafts,
  };
}

export async function generateGitInsights(
  commits: GitCommit[],
  dependencies: DeepSeekDependencies = {},
): Promise<{ insights: GitInsight[] }> {
  if (commits.length < 1) throw new Error("No commits were found in the selected range.");
  const { system, user } = buildGitPrompts(commits);
  const allowedHashes = new Set(commits.map((commit) => commit.hash));
  const insights = await requestWithOneRepair(
    system,
    user,
    (value) => parseGitInsights(value, allowedHashes),
    "DeepSeek returned invalid Git insights after one repair attempt.",
    dependencies,
  );
  return { insights };
}
