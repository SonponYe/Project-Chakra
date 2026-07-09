"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminAction } from "./actions";

export interface AdminRow {
  id: string;
  email: string;
  role: "super_admin" | "service_manager";
  scopeLabel: string;
  isSelf: boolean;
}

export default function AdminsTable({ admins }: { admins: AdminRow[] }) {
  const [rows, setRows] = useState(admins);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(a: AdminRow) {
    if (!confirm(`Remove ${a.email} as an admin? This deletes their account.`)) return;
    setDeletingId(a.id);
    setError(null);
    const result = await deleteAdminAction(a.id);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== a.id));
  }

  return (
    <div className="mt-8 overflow-hidden rounded-md border border-hairline">
      {error && <p className="border-b border-hairline px-4 py-2 text-[13px] text-red-400">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-hairline text-left text-[11px] uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5 font-medium">Email</th>
            <th className="px-4 py-2.5 font-medium">Role</th>
            <th className="px-4 py-2.5 font-medium">Scope</th>
            <th className="px-4 py-2.5 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-b border-hairline last:border-b-0">
              <td className="px-4 py-3 text-ink">{a.email}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-ink">
                  <span className={`h-[6px] w-[6px] rounded-full ${a.role === "super_admin" ? "bg-emerald" : "bg-muted"}`} />
                  {a.role === "super_admin" ? "Super admin" : "Service manager"}
                </span>
              </td>
              <td className="px-4 py-3 text-muted">{a.scopeLabel}</td>
              <td className="px-4 py-3 text-right">
                {!a.isSelf && (
                  <button
                    type="button"
                    onClick={() => handleDelete(a)}
                    disabled={deletingId === a.id}
                    className="text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                    aria-label={`Remove ${a.email}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
