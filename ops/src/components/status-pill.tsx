import type { CadenceStatus } from "@/lib/ledger/cadence";

const LABELS: Record<CadenceStatus, string> = {
  empty: "未准备",
  copied: "已复制",
  published: "已发布",
};

export function StatusPill({ status }: { status: CadenceStatus }) {
  return <span className={`status-pill status-${status}`}><span aria-hidden="true" />{LABELS[status]}</span>;
}
