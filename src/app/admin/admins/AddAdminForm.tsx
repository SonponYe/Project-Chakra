"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminAction } from "./actions";
import type { AdminRole } from "@/lib/supabase/database.types";

export default function AddAdminForm({ serviceTypes }: { serviceTypes: { id: string; name: string }[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("service_manager");
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  function toggleServiceType(id: string) {
    setAssignedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createAdminAction({ email, role, assignedServiceTypeIds: assignedIds });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreated({ email, tempPassword: result.data.tempPassword });
    setEmail("");
    setAssignedIds([]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-700">Add an admin</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
        >
          <option value="service_manager">Service manager (scoped)</option>
          <option value="super_admin">Super admin (full access)</option>
        </select>

        {role === "service_manager" && (
          <div className="flex flex-wrap gap-2">
            {serviceTypes.map((st) => (
              <label key={st.id} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={assignedIds.includes(st.id)}
                  onChange={() => toggleServiceType(st.id)}
                />
                {st.name}
              </label>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Add admin"}
        </button>
      </form>

      {created && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Share these with the admin — shown only once:</p>
          <p className="mt-1">
            Email: <span className="font-mono">{created.email}</span>
          </p>
          <p>
            Temporary password: <span className="font-mono">{created.tempPassword}</span>
          </p>
        </div>
      )}
    </div>
  );
}
