import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { deriveDailyCadence } from "@/lib/ledger/cadence";
import {
  readLedger,
  updateLedgerEntry,
  upsertCopiedEntry,
} from "@/lib/ledger/ledger";
import { engagementRate, searchLedger } from "@/lib/ledger/insights";

const tempDirs: string[] = [];
let dataDir = "";

const copyInput = {
  channel: "x" as const,
  contentType: "build_in_public" as const,
  source: {
    kind: "git" as const,
    topicId: null,
    material: "Shipped a safer report unlock flow.",
    commitHashes: ["df723e7"],
  },
  generation: {
    generationId: "generation-one",
    variantIndex: 1,
    originalText: "Original generated post",
  },
  finalText: "Final copied post",
};

beforeEach(async () => {
  dataDir = await mkdtemp(path.join(os.tmpdir(), "datexray-ops-ledger-"));
  tempDirs.push(dataDir);
  await writeFile(path.join(dataDir, "content-ledger.example.json"), '{"version":1,"entries":[]}\n');
});

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("content ledger", () => {
  test("re-copy updates one entry instead of creating a duplicate", async () => {
    await upsertCopiedEntry(copyInput, {
      dataDir,
      now: () => new Date("2026-09-04T08:00:00.000Z"),
      idFactory: () => "entry-one",
    });
    await upsertCopiedEntry(
      { ...copyInput, finalText: "Edited after another read" },
      { dataDir, now: () => new Date("2026-09-04T09:00:00.000Z"), idFactory: () => "unused" },
    );

    const ledger = await readLedger({ dataDir });
    expect(ledger.entries).toHaveLength(1);
    expect(ledger.entries[0]).toMatchObject({
      id: "entry-one",
      finalText: "Edited after another read",
      copyCount: 2,
      firstCopiedAt: "2026-09-04T08:00:00.000Z",
      lastCopiedAt: "2026-09-04T09:00:00.000Z",
    });
  });

  test("publishing and review updates preserve generation evidence", async () => {
    const created = await upsertCopiedEntry(copyInput, {
      dataDir,
      now: () => new Date("2026-09-04T08:00:00.000Z"),
      idFactory: () => "entry-one",
    });

    const updated = await updateLedgerEntry(
      created.id,
      {
        postUrl: "https://x.com/DateXray/status/123",
        publishedAt: "2026-09-04T10:00:00.000Z",
        metrics: { impressions: 1000, likes: 20, replies: 5, reposts: 4, bookmarks: 6, linkClicks: 3 },
        isTopPerformer: true,
        reviewNotes: "Clear hook brought useful replies.",
      },
      { dataDir, now: () => new Date("2026-09-04T11:00:00.000Z") },
    );

    expect(updated).toMatchObject({
      status: "published",
      isTopPerformer: true,
      generation: copyInput.generation,
      source: copyInput.source,
    });
  });

  test("searches text and filters status and top performers", async () => {
    const first = await upsertCopiedEntry(copyInput, {
      dataDir,
      now: () => new Date("2026-09-04T08:00:00.000Z"),
      idFactory: () => "entry-one",
    });
    await updateLedgerEntry(
      first.id,
      { publishedAt: "2026-09-04T10:00:00.000Z", isTopPerformer: true },
      { dataDir, now: () => new Date("2026-09-04T10:00:00.000Z") },
    );
    await upsertCopiedEntry(
      {
        ...copyInput,
        contentType: "interaction",
        generation: { ...copyInput.generation, generationId: "generation-two" },
        finalText: "Which video-call excuse would make you pause?",
      },
      { dataDir, now: () => new Date("2026-09-03T08:00:00.000Z"), idFactory: () => "entry-two" },
    );

    const entries = (await readLedger({ dataDir })).entries;
    expect(searchLedger(entries, { query: "safer report", status: "published", isTopPerformer: true })).toHaveLength(1);
    expect(searchLedger(entries, { query: "video-call", contentType: "interaction" })).toHaveLength(1);
    expect(searchLedger(entries, { date: "2026-09-03" })).toHaveLength(1);
  });

  test("calculates engagement safely", () => {
    expect(engagementRate({ impressions: 0, likes: 9, replies: 2, reposts: 1, bookmarks: 1, linkClicks: 0 })).toBe(0);
    expect(engagementRate({ impressions: 1000, likes: 20, replies: 5, reposts: 4, bookmarks: 6, linkClicks: 3 })).toBe(0.035);
  });

  test("derives published, copied, and empty daily cadence states", async () => {
    const antiFraud = await upsertCopiedEntry(
      { ...copyInput, contentType: "anti_fraud", generation: { ...copyInput.generation, generationId: "anti" } },
      { dataDir, now: () => new Date("2026-09-04T08:00:00.000Z"), idFactory: () => "anti-entry" },
    );
    await updateLedgerEntry(
      antiFraud.id,
      { publishedAt: "2026-09-04T08:30:00.000Z" },
      { dataDir, now: () => new Date("2026-09-04T08:30:00.000Z") },
    );
    await upsertCopiedEntry(copyInput, {
      dataDir,
      now: () => new Date("2026-09-04T09:00:00.000Z"),
      idFactory: () => "build-entry",
    });

    const cadence = deriveDailyCadence((await readLedger({ dataDir })).entries, "2026-09-04");
    expect(cadence).toEqual([
      { id: "anti_fraud", label: "Anti-fraud", status: "published", count: 1 },
      { id: "build_in_public", label: "Build progress", status: "copied", count: 1 },
      { id: "interaction", label: "Interaction", status: "empty", count: 0 },
    ]);
  });
});
