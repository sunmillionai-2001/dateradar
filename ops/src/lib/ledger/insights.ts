import type { ContentMetrics, ContentTypeId, LedgerEntry, LedgerStatus } from "@/lib/types";

export type LedgerFilters = {
  query?: string;
  contentType?: ContentTypeId;
  status?: LedgerStatus;
  isTopPerformer?: boolean;
  date?: string;
};

export function searchLedger(entries: LedgerEntry[], filters: LedgerFilters): LedgerEntry[] {
  const query = filters.query?.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    if (filters.contentType && entry.contentType !== filters.contentType) return false;
    if (filters.status && entry.status !== filters.status) return false;
    if (filters.isTopPerformer !== undefined && entry.isTopPerformer !== filters.isTopPerformer) return false;
    if (filters.date) {
      const dates = [entry.lastCopiedAt, entry.publishedAt].filter(Boolean).map((value) => value!.slice(0, 10));
      if (!dates.includes(filters.date)) return false;
    }
    if (query) {
      const searchable = [entry.finalText, entry.source.material, entry.reviewNotes].join(" ").toLocaleLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
}

export function engagementRate(metrics: ContentMetrics): number {
  if (metrics.impressions <= 0) return 0;
  return (metrics.likes + metrics.replies + metrics.reposts + metrics.bookmarks) / metrics.impressions;
}
