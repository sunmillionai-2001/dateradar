import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { LedgerWorkspace } from "@/components/ledger-workspace";
import { LibraryWorkspace, type LibraryApi } from "@/components/library-workspace";
import { ReviewWorkspace, type ReviewApi } from "@/components/review-workspace";
import type { BrandVoice, ContentType, ContentTypeId, LedgerEntry, VisualTemplate } from "@/lib/types";

function ledgerEntry(id: string, finalText: string, contentType: ContentTypeId, published = false): LedgerEntry {
  return {
    id,
    channel: "x",
    contentType,
    source: { kind: "manual", topicId: null, material: finalText, commitHashes: [] },
    generation: { generationId: `generation-${id}`, variantIndex: 0, originalText: finalText },
    finalText,
    status: published ? "published" : "copied",
    copyCount: 1,
    firstCopiedAt: "2026-09-04T08:00:00.000Z",
    lastCopiedAt: "2026-09-04T08:00:00.000Z",
    publishedAt: published ? "2026-09-04T09:00:00.000Z" : null,
    postUrl: published ? `https://x.com/DateXray/status/${id}` : null,
    metrics: { impressions: 0, likes: 0, replies: 0, reposts: 0, bookmarks: 0, linkClicks: 0 },
    isTopPerformer: false,
    reviewNotes: "",
    createdAt: "2026-09-04T08:00:00.000Z",
    updatedAt: "2026-09-04T09:00:00.000Z",
  };
}

const brand: BrandVoice = {
  version: 1,
  identity: "A professional, opinionated, story-driven dating safety builder.",
  principles: ["Lead with observable evidence."],
  languageRules: { language: "en-US", tone: ["clear"], avoid: ["diagnosis"], decisionBoundary: "Never make the decision." },
};

const contentTypes: ContentType[] = [{
  id: "anti_fraud",
  name: "Anti-fraud education",
  shortName: "Anti-fraud",
  description: "Explain patterns.",
  goal: "Educate",
  example: "A reviewed example.",
  recommendedCta: "Save this.",
}];

const templates: VisualTemplate[] = [{
  id: "scam-pattern-card",
  name: "Scam pattern card",
  aspectRatio: "4:5",
  recommendedTypes: ["anti_fraud"],
  layout: "Signal and checkpoints",
  copySlots: ["signal"],
  colors: ["#11110f", "#d7ff63"],
  exampleContent: { signal: "Pattern, not proof" },
}];

describe("operations workspaces", () => {
  test("filters ledger text and exposes reuse by stable entry id", async () => {
    const user = userEvent.setup();
    render(<LedgerWorkspace initialEntries={[
      ledgerEntry("video", "Repeated video-call avoidance can be part of a larger pattern.", "anti_fraud"),
      ledgerEntry("poster", "We shipped a cleaner report poster.", "build_in_public"),
    ]} />);

    await user.type(screen.getByLabelText("搜索台账"), "video-call");

    expect(screen.getByText(/Repeated video-call avoidance/i)).toBeVisible();
    expect(screen.queryByText(/cleaner report poster/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "在 X 生成器中复用" })).toHaveAttribute("href", "/channels/x?reuse=video");
  });

  test("creates a topic from the library form", async () => {
    const user = userEvent.setup();
    const api: LibraryApi = {
      createTopic: vi.fn().mockResolvedValue({
        id: "topic-one", title: "Video-call avoidance", angle: "Explain the pattern", contentTypes: ["anti_fraud"], tags: ["video-call"], notes: "", source: "manual", status: "backlog", createdAt: "2026-09-04", updatedAt: "2026-09-04", lastUsedAt: null,
      }),
      updateTopic: vi.fn(),
    };
    render(<LibraryWorkspace brand={brand} contentTypes={contentTypes} templates={templates} initialTopics={[]} api={api} />);

    await user.click(screen.getByRole("tab", { name: "选题池" }));
    await user.type(screen.getByLabelText("选题标题"), "Video-call avoidance");
    await user.type(screen.getByLabelText("选题角度"), "Explain the pattern");
    await user.click(screen.getByRole("button", { name: "保存选题" }));

    expect(api.createTopic).toHaveBeenCalledWith(expect.objectContaining({
      title: "Video-call avoidance",
      angle: "Explain the pattern",
      contentTypes: ["anti_fraud"],
    }));
    expect(screen.getByText("Video-call avoidance")).toBeVisible();
  });

  test("updates metrics and marks a published post as a top performer", async () => {
    const user = userEvent.setup();
    const published = ledgerEntry("published", "Evidence beats verdicts.", "opinion", true);
    const update = vi.fn().mockImplementation(async (_id, patch) => ({ ...published, ...patch, metrics: patch.metrics }));
    const api: ReviewApi = { update };
    render(<ReviewWorkspace initialEntries={[published]} api={api} />);

    await user.clear(screen.getByLabelText("浏览量"));
    await user.type(screen.getByLabelText("浏览量"), "1000");
    await user.clear(screen.getByLabelText("点赞"));
    await user.type(screen.getByLabelText("点赞"), "20");
    await user.click(screen.getByRole("checkbox", { name: "高表现内容" }));
    await user.click(screen.getByRole("button", { name: "保存复盘" }));

    expect(update).toHaveBeenCalledWith("published", expect.objectContaining({
      metrics: expect.objectContaining({ impressions: 1000, likes: 20 }),
      isTopPerformer: true,
    }));
    expect(screen.getByText("复盘已保存到本地。")).toBeVisible();
  });
});
