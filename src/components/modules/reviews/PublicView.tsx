"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { reviewsDataSchema } from "@/lib/modules/schemas";
import { submitReviewAction } from "@/app/services/[slug]/[workerId]/actions";
import { btnClass } from "@/components/ui/button";
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
    <div>
      {showRating && average && (
        <div className="mb-8 flex items-baseline gap-3.5">
          <p className="font-display text-4xl tabular-nums">{average}</p>
          <div>
            <p className="text-[14px] text-emerald">{"★".repeat(Math.round(Number(average)))}</p>
            <p className="text-[13px] text-muted">{reviews.length} reviews</p>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {reviews.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.02, duration: 0.4 }}
            className="border-t border-hairline py-5 first:border-t-0"
          >
            {showRating && <p className="text-[13px] text-emerald">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>}
            {r.text && <p className="mt-1.5 text-[14px] leading-relaxed text-ink/90">{r.text}</p>}
            {r.workerResponse && (
              <div className="mt-3 rounded-r border-l-2 border-emerald-dim bg-elevated px-3.5 py-3 text-[13px] text-muted">
                <b className="font-semibold text-ink">Response: </b>
                {r.workerResponse}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-7 flex max-w-sm flex-col gap-3 border-t border-hairline pt-7">
        {!isSignedIn && (
          <p className="text-[13px] text-amber-400">
            <a href="/login" className="underline">
              Sign in
            </a>{" "}
            to leave a review.
          </p>
        )}
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-md border border-hairline bg-elevated px-3 py-2 text-sm text-ink focus:border-emerald focus:outline-none"
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
          className="rounded-md border border-hairline bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-emerald focus:outline-none"
        />
        {message && <p className="text-[13px] text-muted">{message}</p>}
        <button type="submit" disabled={submitting || !isSignedIn} className={`${btnClass("solid", "md")} self-start`}>
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </div>
  );
}
