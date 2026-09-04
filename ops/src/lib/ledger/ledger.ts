import { randomUUID } from "node:crypto";

import { readRuntimeJson, updateRuntimeJson } from "@/lib/data/json-store";
import type {
  ContentMetrics,
  CopyLedgerInput,
  LedgerData,
  LedgerEntry,
  LedgerEntryPatch,
} from "@/lib/types";

const EMPTY_METRICS: ContentMetrics = {
  impressions: 0,
  likes: 0,
  replies: 0,
  reposts: 0,
  bookmarks: 0,
  linkClicks: 0,
};

type LedgerOptions = {
  dataDir?: string;
  now?: () => Date;
  idFactory?: () => string;
};

function timestamp(options: LedgerOptions) {
  return (options.now ?? (() => new Date()))().toISOString();
}

function nonNegativeInteger(value: number | undefined, fallback: number) {
  if (value === undefined) return fallback;
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export async function readLedger(options: LedgerOptions = {}): Promise<LedgerData> {
  return readRuntimeJson<LedgerData>(
    "content-ledger.json",
    "content-ledger.example.json",
    options.dataDir,
  );
}

export async function upsertCopiedEntry(input: CopyLedgerInput, options: LedgerOptions = {}): Promise<LedgerEntry> {
  const now = timestamp(options);
  let saved: LedgerEntry | undefined;
  await updateRuntimeJson<LedgerData>(
    "content-ledger.json",
    "content-ledger.example.json",
    (ledger) => {
      const existingIndex = ledger.entries.findIndex(
        (entry) => entry.generation.generationId === input.generation.generationId
          && entry.generation.variantIndex === input.generation.variantIndex,
      );

      if (existingIndex >= 0) {
        const existing = ledger.entries[existingIndex];
        saved = {
          ...existing,
          ...input,
          copyCount: existing.copyCount + 1,
          lastCopiedAt: now,
          updatedAt: now,
        };
        const entries = [...ledger.entries];
        entries[existingIndex] = saved;
        return { ...ledger, entries };
      }

      saved = {
        id: (options.idFactory ?? randomUUID)(),
        ...input,
        status: "copied",
        copyCount: 1,
        firstCopiedAt: now,
        lastCopiedAt: now,
        publishedAt: null,
        postUrl: null,
        metrics: { ...EMPTY_METRICS },
        isTopPerformer: false,
        reviewNotes: "",
        createdAt: now,
        updatedAt: now,
      };
      return { ...ledger, entries: [saved, ...ledger.entries] };
    },
    options.dataDir,
  );
  if (!saved) throw new Error("Unable to save copied content.");
  return saved;
}

export async function updateLedgerEntry(
  id: string,
  patch: LedgerEntryPatch,
  options: LedgerOptions = {},
): Promise<LedgerEntry> {
  const now = timestamp(options);
  let saved: LedgerEntry | undefined;
  await updateRuntimeJson<LedgerData>(
    "content-ledger.json",
    "content-ledger.example.json",
    (ledger) => {
      const index = ledger.entries.findIndex((entry) => entry.id === id);
      if (index < 0) throw new Error("Ledger entry not found.");
      const existing = ledger.entries[index];
      const metrics = patch.metrics
        ? {
            impressions: nonNegativeInteger(patch.metrics.impressions, existing.metrics.impressions),
            likes: nonNegativeInteger(patch.metrics.likes, existing.metrics.likes),
            replies: nonNegativeInteger(patch.metrics.replies, existing.metrics.replies),
            reposts: nonNegativeInteger(patch.metrics.reposts, existing.metrics.reposts),
            bookmarks: nonNegativeInteger(patch.metrics.bookmarks, existing.metrics.bookmarks),
            linkClicks: nonNegativeInteger(patch.metrics.linkClicks, existing.metrics.linkClicks),
          }
        : existing.metrics;
      const publishedAt = patch.publishedAt === undefined ? existing.publishedAt : patch.publishedAt;
      const postUrl = patch.postUrl === undefined ? existing.postUrl : patch.postUrl;
      const status = patch.status ?? (publishedAt || postUrl ? "published" : existing.status);
      saved = {
        ...existing,
        ...patch,
        finalText: patch.finalText?.trim() || existing.finalText,
        status,
        publishedAt,
        postUrl,
        metrics,
        reviewNotes: patch.reviewNotes === undefined ? existing.reviewNotes : patch.reviewNotes.trim(),
        updatedAt: now,
      };
      const entries = [...ledger.entries];
      entries[index] = saved;
      return { ...ledger, entries };
    },
    options.dataDir,
  );
  if (!saved) throw new Error("Ledger entry not found.");
  return saved;
}
