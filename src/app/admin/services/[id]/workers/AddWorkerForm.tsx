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
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await createWorkerAction({ serviceTypeId, email, displayName, bio: bio || undefined });

    setSubmitting(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setEmail("");
    setDisplayName("");
    setBio("");
    setMessage("Worker invited.");
    router.refresh();
  }

  return (
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
      {message && <p className="text-sm text-neutral-600">{message}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Inviting…" : "Invite worker"}
      </button>
    </form>
  );
}
