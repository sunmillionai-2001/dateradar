import type { ContentTypeId, LedgerEntry } from "@/lib/types";

export type CadenceStatus = "empty" | "copied" | "published";

export type CadenceItem = {
  id: ContentTypeId;
  label: string;
  status: CadenceStatus;
  count: number;
};

const CADENCE = [
  { id: "anti_fraud", label: "Anti-fraud" },
  { id: "build_in_public", label: "Build progress" },
  { id: "interaction", label: "Interaction" },
] as const;

export function deriveDailyCadence(entries: LedgerEntry[], date: string): CadenceItem[] {
  return CADENCE.map(({ id, label }) => {
    const matching = entries.filter((entry) => entry.contentType === id && (
      entry.lastCopiedAt.startsWith(date) || entry.publishedAt?.startsWith(date)
    ));
    const status: CadenceStatus = matching.some(
      (entry) => entry.status === "published" && entry.publishedAt?.startsWith(date),
    )
      ? "published"
      : matching.length > 0
        ? "copied"
        : "empty";
    return { id, label, status, count: matching.length };
  });
}
