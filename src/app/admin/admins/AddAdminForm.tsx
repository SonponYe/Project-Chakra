"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { createAdminAction } from "./actions";
import type { AdminRole } from "@/lib/supabase/database.types";
import { btnClass } from "@/components/ui/button";
import { CARD, FIELD_SM } from "@/components/ui/card";

export default function AddAdminForm({ serviceTypes }: { serviceTypes: { id: string; name: string }[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("service_manager");
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

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
    setCopied(false);
    setEmail("");
    setAssignedIds([]);
    router.refresh();
  }

  function handleCopy() {
    if (!created) return;
    navigator.clipboard.writeText(created.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className={`${CARD} flex flex-col gap-2.5`}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Add an admin</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={FIELD_SM}
        />
        <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)} className={FIELD_SM}>
          <option value="service_manager">Service manager (scoped)</option>
          <option value="super_admin">Super admin (full access)</option>
        </select>

        {role === "service_manager" && (
          <div className="flex flex-wrap gap-2.5">
            {serviceTypes.map((st) => (
              <label key={st.id} className="flex items-center gap-1.5 text-[12.5px] text-muted">
                <input
                  type="checkbox"
                  checked={assignedIds.includes(st.id)}
                  onChange={() => toggleServiceType(st.id)}
                  className="accent-emerald"
                />
                {st.name}
              </label>
            ))}
          </div>
        )}

        {error && <p className="text-[13px] text-red-400">{error}</p>}
        <button type="submit" disabled={submitting} className={`${btnClass("solid", "md")} self-start`}>
          {submitting ? "Creating…" : "Add admin"}
        </button>
      </form>

      {created && (
        <div className="rounded-md border border-emerald-dim bg-emerald-tint p-4 text-[13.5px]">
          <p className="font-medium text-emerald">Share these with the admin — shown only once</p>
          <p className="mt-2 text-ink">
            Email: <span className="font-mono">{created.email}</span>
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-ink">
              Password: <span className="font-mono">{created.tempPassword}</span>
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[12px] text-muted transition-colors hover:text-emerald"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
