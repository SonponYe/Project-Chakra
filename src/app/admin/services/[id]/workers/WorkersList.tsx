"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteWorkerAction } from "@/app/admin/services/actions";

export interface WorkerRow {
  id: string;
  displayName: string;
  status: string;
  filled: number;
}

export default function WorkersList({
  workers,
  totalModules,
  isSuperAdmin,
}: {
  workers: WorkerRow[];
  totalModules: number;
  isSuperAdmin: boolean;
}) {
  const [rows, setRows] = useState(workers);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(w: WorkerRow) {
    if (!confirm(`Remove ${w.displayName}? This deletes their account and all profile data.`)) return;
    setDeletingId(w.id);
    setError(null);
    const result = await deleteWorkerAction(w.id);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== w.id));
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-muted/30 px-5 py-6 text-center text-[13px] text-muted">
        No workers yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {error && <p className="text-[13px] text-red-400">{error}</p>}
      {rows.map((w) => {
        const pct = Math.min(100, Math.round((w.filled / totalModules) * 100));
        return (
          <div key={w.id} className="rounded-md border border-hairline bg-surface px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[14px] font-medium text-ink">{w.displayName}</p>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[11px] uppercase tracking-wide text-muted">{w.status}</span>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(w)}
                    disabled={deletingId === w.id}
                    className="text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                    aria-label={`Delete ${w.displayName}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
                <div className="h-full rounded-full bg-emerald" style={{ width: `${pct}%` }} />
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-muted">
                {w.filled}/{totalModules} modules
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
