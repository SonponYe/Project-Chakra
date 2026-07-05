"use client";

import { useState } from "react";
import { saveWorkerModuleDataAction, respondToReviewAction } from "@/app/dashboard/actions";
import { reviewsDataSchema } from "@/lib/modules/schemas";

export interface ReviewRow {
  id: string;
  rating: number;
  text: string | null;
  workerResponse: string | null;
  createdAt: string;
}

export default function ReviewsAdminForm({
  workerId,
  initialData,
  reviews,
}: {
  workerId: string;
  initialData: unknown;
  reviews: ReviewRow[];
}) {
  const parsed = reviewsDataSchema.safeParse(initialData);
  const [showRatingPublicly, setShowRatingPublicly] = useState(parsed.success ? parsed.data.showRatingPublicly : true);
  const [responses, setResponses] = useState<Record<string, string>>(
    Object.fromEntries(reviews.map((r) => [r.id, r.workerResponse ?? ""]))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function handleSaveSettings() {
    setSaving(true);
    setMessage(null);
    const result = await saveWorkerModuleDataAction({
      workerId,
      moduleKey: "reviews",
      data: { showRatingPublicly },
    });
    setSaving(false);
    setMessage(result.ok ? "Saved." : result.error);
  }

  async function handleRespond(reviewId: string) {
    setRespondingId(reviewId);
    const result = await respondToReviewAction({ reviewId, response: responses[reviewId] ?? "" });
    setRespondingId(null);
    if (!result.ok) setMessage(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={showRatingPublicly}
          onChange={(e) => setShowRatingPublicly(e.target.checked)}
        />
        Show star ratings publicly
      </label>
      <button
        type="button"
        onClick={handleSaveSettings}
        disabled={saving}
        className="self-start rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save setting"}
      </button>

      <div className="flex flex-col gap-3">
        {reviews.length === 0 && <p className="text-sm text-neutral-500">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-md border border-neutral-200 bg-white p-3">
            <p className="text-sm font-medium">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
            {r.text && <p className="mt-1 text-sm text-neutral-600">{r.text}</p>}
            <textarea
              placeholder="Respond…"
              value={responses[r.id] ?? ""}
              onChange={(e) => setResponses((prev) => ({ ...prev, [r.id]: e.target.value }))}
              rows={2}
              className="mt-2 w-full rounded border border-neutral-200 px-2 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => handleRespond(r.id)}
              disabled={respondingId === r.id}
              className="mt-1 rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              {respondingId === r.id ? "Saving…" : "Save response"}
            </button>
          </div>
        ))}
      </div>

      {message && <p className="text-sm text-neutral-600">{message}</p>}
    </div>
  );
}
