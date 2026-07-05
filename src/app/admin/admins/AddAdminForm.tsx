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
  const [message, setMessage] = useState<string | null>(null);

  function toggleServiceType(id: string) {
    setAssignedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await createAdminAction({ email, role, assignedServiceTypeIds: assignedIds });

    setSubmitting(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setEmail("");
    setAssignedIds([]);
    setMessage("Admin invited.");
    router.refresh();
  }

  return (
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

      {message && <p className="text-sm text-neutral-600">{message}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Inviting…" : "Invite admin"}
      </button>
    </form>
  );
}
