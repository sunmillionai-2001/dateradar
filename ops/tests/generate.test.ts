import { describe, expect, test, vi } from "vitest";

import { generateGitInsights, generateXDrafts } from "@/lib/ai/generate";

const input = {
  contentType: "anti_fraud" as const,
  material: "Repeatedly avoiding live video while introducing an urgent crypto investment request.",
  context: { goal: "Teach one observable pattern without making a verdict." },
};

function deepSeekResponse(payload: unknown) {
  return new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify(payload) } }],
  }), { status: 200, headers: { "content-type": "application/json" } });
}

const validDrafts = {
  drafts: [
    {
      angle: "Evidence first",
      text: "A crypto pitch is not the only signal. Pair it with repeated video-call avoidance and sudden urgency, and the pattern deserves a slower, independent check—not a snap verdict.",
      whyItWorks: "Connects observable clues without labeling a person.",
    },
    {
      angle: "Story led",
      text: "The message changed from “I miss you” to “invest today.” That shift matters. Pause before irreversible payments, verify the person independently, and keep account access private.",
      whyItWorks: "Turns the source pattern into a compact narrative.",
    },
    {
      angle: "Conversation starter",
      text: "Which would make you pause first: a month of avoided video calls, an urgent crypto pitch, or affection that suddenly becomes financial pressure? Patterns matter more than one line.",
      whyItWorks: "Invites useful discussion while reinforcing pattern-based judgment.",
    },
  ],
};

describe("X draft generation", () => {
  test("returns three distinct English drafts within 280 code points", async () => {
    const result = await generateXDrafts(input, {
      fetch: async () => deepSeekResponse(validDrafts),
      apiKey: "test-key",
      idFactory: () => "generation-one",
    });

    expect(result.generationId).toBe("generation-one");
    expect(result.drafts).toHaveLength(3);
    expect(new Set(result.drafts.map((draft) => draft.text)).size).toBe(3);
    expect(result.drafts.every((draft) => Array.from(draft.text).length <= 280)).toBe(true);
  });

  test("sends the approved brand boundary and selected type to DeepSeek", async () => {
    const requestBodies: unknown[] = [];
    await generateXDrafts(input, {
      fetch: async (_url, init) => {
        requestBodies.push(JSON.parse(String(init?.body)));
        return deepSeekResponse(validDrafts);
      },
      apiKey: "test-key",
    });

    const body = requestBodies[0] as { messages: Array<{ content: string }> };
    expect(body.messages[0].content).toContain("Never tell readers whether to leave, stay, date, trust, or reject someone.");
    expect(body.messages[0].content).toContain("Anti-fraud education");
    expect(body.messages[1].content).toContain(input.material);
  });

  test("makes one repair request after malformed output", async () => {
    const provider = vi.fn()
      .mockResolvedValueOnce(deepSeekResponse({ drafts: [{ angle: "Only one" }] }))
      .mockResolvedValueOnce(deepSeekResponse(validDrafts));

    const result = await generateXDrafts(input, { fetch: provider, apiKey: "test-key" });

    expect(result.drafts).toHaveLength(3);
    expect(provider).toHaveBeenCalledTimes(2);
  });

  test("rejects a second invalid response after one repair attempt", async () => {
    const invalid = {
      drafts: [
        { angle: "A", text: "相同内容", whyItWorks: "A" },
        { angle: "B", text: "相同内容", whyItWorks: "B" },
        { angle: "C", text: "相同内容", whyItWorks: "C" },
      ],
    };

    await expect(generateXDrafts(input, {
      fetch: async () => deepSeekResponse(invalid),
      apiKey: "test-key",
    })).rejects.toThrow("DeepSeek returned invalid X drafts after one repair attempt");
  });

  test("fails clearly when the server key is absent", async () => {
    await expect(generateXDrafts(input, { apiKey: "" })).rejects.toThrow("DEEPSEEK_API_KEY is not configured");
  });
});

describe("Git insight generation", () => {
  test("keeps every cited hash inside the supplied commit set", async () => {
    const commits = [{
      hash: "ae3e92d",
      date: "2026-09-04T08:00:00+08:00",
      subject: "docs: switch audio transcription plan",
      files: ["product-spec.md"],
    }];
    const providerPayload = {
      insights: [{
        title: "A smaller integration decision",
        whatChanged: "The audio transcription plan moved to Alibaba Cloud Paraformer.",
        whyItMatters: "It aligns the planned provider with the available account setup.",
        lesson: "Infrastructure choices should reflect the accounts a small team can actually operate.",
        commitHashes: ["ae3e92d"],
      }],
    };

    const result = await generateGitInsights(commits, {
      fetch: async () => deepSeekResponse(providerPayload),
      apiKey: "test-key",
    });

    expect(result.insights[0].commitHashes).toEqual(["ae3e92d"]);
  });

  test("rejects an insight that cites a commit not supplied to the model", async () => {
    const commits = [{ hash: "known", date: "2026-09-04", subject: "Known", files: ["README.md"] }];
    const invalid = {
      insights: [{
        title: "Invented",
        whatChanged: "Something unsupported changed.",
        whyItMatters: "Unsupported impact.",
        lesson: "Unsupported lesson.",
        commitHashes: ["unknown"],
      }],
    };

    await expect(generateGitInsights(commits, {
      fetch: async () => deepSeekResponse(invalid),
      apiKey: "test-key",
    })).rejects.toThrow("DeepSeek returned invalid Git insights after one repair attempt");
  });
});
