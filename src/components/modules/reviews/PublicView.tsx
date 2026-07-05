"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { reviewsDataSchema } from "@/lib/modules/schemas";
import { submitReviewAction } from "@/app/services/[slug]/[workerId]/actions";
import type { ReviewRow } from "./AdminForm";

export default function ReviewsPublicView({
  data,
  workerId,
  reviews,
  isSignedIn,
}: {
  data: unknown;
  workerId: string;
  reviews: ReviewRow[];
  isSignedIn: boolean;
}) {
  const parsed = reviewsDataSchema.safeParse(data);
  const showRating = parsed.success ? parsed.data.showRatingPublicly : true;

  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const average =
    reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const result = await submitReviewAction({ workerId, rating, text: text || undefined });
    setSubmitting(false);
    setMessage(result.ok ? "Thanks for your review!" : result.error);
    if (result.ok) setText("");
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">
        Reviews {showRating && average && <span className="text-neutral-500">({average}★, {reviews.length})</span>}
      </h2>

      <div className="mt-3 flex flex-col gap-3">
        {reviews.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-md border border-neutral-200 bg-white p-3"
          >
            {showRating && (
              <p className="text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
            )}
            {r.text && <p className="mt-1 text-sm text-neutral-600">{r.text}</p>}
            {r.workerResponse && (
              <p className="mt-2 rounded bg-neutral-50 p-2 text-xs text-neutral-500">
                Response: {r.workerResponse}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex max-w-sm flex-col gap-2">
        {!isSignedIn && (
          <p className="text-sm text-amber-700">
            <a href="/login" className="underline">
              Sign in
            </a>{" "}
            to leave a review.
          </p>
        )}
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)} ({n})
            </option>
          ))}
        </select>
        <textarea
          placeholder="Share your experience (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
        />
        {message && <p className="text-sm text-neutral-600">{message}</p>}
        <button
          type="submit"
          disabled={submitting || !isSignedIn}
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </section>
  );
}
