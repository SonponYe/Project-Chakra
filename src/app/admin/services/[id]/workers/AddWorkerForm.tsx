"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { createWorkerAction } from "@/app/admin/services/actions";
import { btnClass } from "@/components/ui/button";
import { CARD, FIELD_SM } from "@/components/ui/card";

export default function AddWorkerForm({ serviceTypeId }: { serviceTypeId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createWorkerAction({ serviceTypeId, email, displayName, bio: bio || undefined });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreated({ email, tempPassword: result.data.tempPassword });
    setCopied(false);
    setEmail("");
    setDisplayName("");
    setBio("");
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
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Add a worker</p>
        <input
          type="email"
          placeholder="Worker's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={FIELD_SM}
        />
        <input
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className={FIELD_SM}
        />
        <textarea
          placeholder="Bio (optional)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          className={FIELD_SM}
        />
        {error && <p className="text-[13px] text-red-400">{error}</p>}
        <button type="submit" disabled={submitting} className={`${btnClass("solid", "md")} self-start`}>
          {submitting ? "Creating…" : "Add worker"}
        </button>
      </form>

      {created && (
        <div className="rounded-md border border-emerald-dim bg-emerald-tint p-4 text-[13.5px]">
          <p className="font-medium text-emerald">Share these with the worker — shown only once</p>
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
          <p className="mt-2 text-[12px] text-muted">This won&apos;t be shown again — copy it now.</p>
        </div>
      )}
    </div>
  );
}
