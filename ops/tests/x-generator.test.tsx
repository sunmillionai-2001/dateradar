import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { XGenerator, type XGeneratorApi } from "@/components/x-generator";
import type { BootstrapData, GenerationResult } from "@/lib/types";

const generation: GenerationResult = {
  generationId: "generation-one",
  drafts: [
    { angle: "Evidence first", text: "Draft one", whyItWorks: "Clear evidence." },
    { angle: "Story led", text: "Draft two", whyItWorks: "Compact story." },
    { angle: "Conversation", text: "Draft three", whyItWorks: "Invites replies." },
  ],
};

const initialData = {
  contentTypes: [
    {
      id: "anti_fraud" as const,
      name: "Anti-fraud education",
      shortName: "Anti-fraud",
      description: "Explain observable scam patterns.",
      goal: "Educate",
      example: "Example",
      recommendedCta: "Save this.",
    },
    {
      id: "build_in_public" as const,
      name: "Build in public",
      shortName: "Build progress",
      description: "Share factual progress.",
      goal: "Build trust",
      example: "Example",
      recommendedCta: "What next?",
    },
  ],
  topics: [],
} satisfies Pick<BootstrapData, "contentTypes" | "topics">;

function createApi(overrides: Partial<XGeneratorApi> = {}): XGeneratorApi {
  return {
    generate: vi.fn().mockResolvedValue(generation),
    log: vi.fn().mockResolvedValue({ id: "entry-one" }),
    gitInsights: vi.fn().mockResolvedValue({
      commits: [{ hash: "ae3e92d", date: "2026-09-04", subject: "docs: switch provider plan", files: ["product-spec.md"] }],
      insights: [{
        title: "Provider plan changed",
        whatChanged: "The planned audio provider moved to Alibaba Cloud Paraformer.",
        whyItMatters: "The setup matches the accounts available to the builder.",
        lesson: "Infrastructure choices must be operable.",
        commitHashes: ["ae3e92d"],
      }],
    }),
    ...overrides,
  };
}

describe("X generator", () => {
  test("records the edited draft only after clipboard success", async () => {
    const user = userEvent.setup();
    const api = createApi();
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    render(<XGenerator initialData={initialData} api={api} clipboard={clipboard} />);

    expect(screen.getByRole("button", { name: /反诈教育（anti_fraud）/ })).toBeVisible();
    await user.type(screen.getByLabelText("素材内容"), "A real product change");
    await user.click(screen.getByRole("button", { name: "生成 3 版推文" }));
    expect(screen.getByDisplayValue("Draft one")).toBeVisible();
    await user.clear(screen.getByLabelText("编辑第 1 版推文"));
    await user.type(screen.getByLabelText("编辑第 1 版推文"), "Edited final post");
    await user.click(screen.getByRole("button", { name: "复制并记入台账：第 1 版" }));

    expect(clipboard.writeText).toHaveBeenCalledWith("Edited final post");
    expect(api.log).toHaveBeenCalledOnce();
    expect(vi.mocked(api.log).mock.calls[0][0].finalText).toBe("Edited final post");
  });

  test("does not log when clipboard copying fails", async () => {
    const user = userEvent.setup();
    const api = createApi();
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error("denied")) };
    render(<XGenerator initialData={initialData} api={api} clipboard={clipboard} />);

    await user.type(screen.getByLabelText("素材内容"), "A real product change");
    await user.click(screen.getByRole("button", { name: "生成 3 版推文" }));
    await user.click(screen.getByRole("button", { name: "复制并记入台账：第 1 版" }));

    expect(api.log).not.toHaveBeenCalled();
    expect(screen.getByText("无法访问剪贴板，未写入台账。")).toBeVisible();
  });

  test("offers ledger retry without copying twice", async () => {
    const user = userEvent.setup();
    const log = vi.fn().mockRejectedValueOnce(new Error("disk busy")).mockResolvedValueOnce({ id: "entry-one" });
    const api = createApi({ log });
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    render(<XGenerator initialData={initialData} api={api} clipboard={clipboard} />);

    await user.type(screen.getByLabelText("素材内容"), "A real product change");
    await user.click(screen.getByRole("button", { name: "生成 3 版推文" }));
    await user.click(screen.getByRole("button", { name: "复制并记入台账：第 1 版" }));
    expect(screen.getByText("已复制，但未写入台账。")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "重试写入台账" }));

    expect(log).toHaveBeenCalledTimes(2);
    expect(clipboard.writeText).toHaveBeenCalledOnce();
    expect(screen.getByText("已复制并记录到本地台账。")).toBeVisible();
  });

  test("disables copying when an edit exceeds 280 code points", async () => {
    const user = userEvent.setup();
    const api = createApi();
    render(<XGenerator initialData={initialData} api={api} clipboard={{ writeText: vi.fn() }} />);

    await user.type(screen.getByLabelText("素材内容"), "A real product change");
    await user.click(screen.getByRole("button", { name: "生成 3 版推文" }));
    await user.clear(screen.getByLabelText("编辑第 1 版推文"));
    await user.type(screen.getByLabelText("编辑第 1 版推文"), "x".repeat(281));

    expect(screen.getByRole("button", { name: "复制并记入台账：第 1 版" })).toBeDisabled();
    expect(screen.getByText("281 / 280")).toBeVisible();
  });

  test("imports a fact-supported Git insight into source material", async () => {
    const user = userEvent.setup();
    const api = createApi();
    render(<XGenerator initialData={initialData} api={api} clipboard={{ writeText: vi.fn() }} />);

    await user.click(screen.getByRole("button", { name: "提炼 Git 素材" }));
    await user.click(screen.getByRole("button", { name: "使用：Provider plan changed" }));

    const source = (screen.getByLabelText("素材内容") as HTMLTextAreaElement).value;
    expect(source).toContain("The planned audio provider moved");
    expect(source).toContain("ae3e92d");
  });
});
