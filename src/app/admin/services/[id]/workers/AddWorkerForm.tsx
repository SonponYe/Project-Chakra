"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createWorkerAction } from "@/app/admin/services/actions";

export default function AddWorkerForm({ serviceTypeId }: { serviceTypeId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

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
    setEmail("");
    setDisplayName("");
    setBio("");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-700">Add a worker</p>
        <input
          type="email"
          placeholder="Worker's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
        />
        <input
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
        />
        <textarea
          placeholder="Bio (optional)"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          className="rounded border border-neutral-200 px-2 py-1.5 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Add worker"}
        </button>
      </form>

      {created && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Share these with the worker — shown only once:</p>
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
