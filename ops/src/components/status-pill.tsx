import type { CadenceStatus } from "@/lib/ledger/cadence";

const LABELS: Record<CadenceStatus, string> = {
  empty: "Not prepared",
  copied: "Copied",
  published: "Published",
};

export function StatusPill({ status }: { status: CadenceStatus }) {
  return <span className={`status-pill status-${status}`}><span aria-hidden="true" />{LABELS[status]}</span>;
}
