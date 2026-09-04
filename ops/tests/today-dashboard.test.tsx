import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { TodayDashboard } from "@/components/today-dashboard";
import type { ContentTypeId, LedgerEntry, LedgerStatus } from "@/lib/types";

function entry(id: string, contentType: ContentTypeId, status: LedgerStatus): LedgerEntry {
  return {
    id,
    channel: "x",
    contentType,
    source: { kind: "manual", topicId: null, material: "Source material", commitHashes: [] },
    generation: { generationId: `generation-${id}`, variantIndex: 0, originalText: "Original" },
    finalText: `${contentType} final post`,
    status,
    copyCount: 1,
    firstCopiedAt: "2026-09-04T08:00:00.000Z",
    lastCopiedAt: "2026-09-04T08:00:00.000Z",
    publishedAt: status === "published" ? "2026-09-04T09:00:00.000Z" : null,
    postUrl: null,
    metrics: { impressions: 0, likes: 0, replies: 0, reposts: 0, bookmarks: 0, linkClicks: 0 },
    isTopPerformer: false,
    reviewNotes: "",
    createdAt: "2026-09-04T08:00:00.000Z",
    updatedAt: "2026-09-04T09:00:00.000Z",
  };
}

describe("today dashboard", () => {
  test("shows anti-fraud, progress, and interaction cadence states", () => {
    render(<TodayDashboard
      entries={[
        entry("anti", "anti_fraud", "published"),
        entry("build", "build_in_public", "copied"),
      ]}
      today="2026-09-04"
    />);

    expect(within(screen.getByTestId("cadence-anti_fraud")).getByText("Published")).toBeVisible();
    expect(within(screen.getByTestId("cadence-build_in_public")).getByText("Copied")).toBeVisible();
    expect(within(screen.getByTestId("cadence-interaction")).getByText("Not prepared")).toBeVisible();
  });

  test("surfaces recent and manually marked high-performing content", () => {
    const top = { ...entry("top", "opinion", "published"), isTopPerformer: true, finalText: "Evidence beats verdicts." };
    render(<TodayDashboard entries={[top]} today="2026-09-04" />);

    expect(screen.getByText("Evidence beats verdicts.")).toBeVisible();
    expect(screen.getByText("1 top performer")).toBeVisible();
  });
});
