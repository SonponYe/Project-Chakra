"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { bookingAvailabilityDataSchema } from "@/lib/modules/schemas";
import type { Slot } from "@/lib/booking/slots";
import { requestBookingAction } from "@/app/services/[slug]/[workerId]/actions";

export default function BookingAvailabilityPublicView({
  data,
  workerId,
  slots,
  isSignedIn,
}: {
  data: unknown;
  workerId: string;
  slots: Slot[];
  isSignedIn: boolean;
}) {
  const parsed = bookingAvailabilityDataSchema.safeParse(data);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setMessage(null);

    const result = await requestBookingAction({
      workerId,
      requesterName: name,
      requesterContact: contact,
      note: note || undefined,
      requestedSlot: selected.start.toISOString(),
    });

    setSubmitting(false);
    setMessage(result.ok ? "Request sent! The worker will confirm soon." : result.error);
    if (result.ok) setSelected(null);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">Book a slot</h2>
      {parsed.success && parsed.data.note && (
        <p className="mt-1 text-sm text-neutral-500">{parsed.data.note}</p>
      )}

      {slots.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No open slots right now.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {slots.map((s) => (
            <motion.button
              key={s.start.toISOString()}
              type="button"
              onClick={() => setSelected(s)}
              whileTap={{ scale: 0.97 }}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                selected?.start.getTime() === s.start.getTime()
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              {s.start.toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </motion.button>
          ))}
        </div>
      )}

      {selected && (
        <form onSubmit={handleSubmit} className="mt-4 flex max-w-sm flex-col gap-2">
          {!isSignedIn && (
            <p className="text-sm text-amber-700">
              You&apos;ll need to{" "}
              <a href="/login" className="underline">
                sign in
              </a>{" "}
              first to submit a request.
            </p>
          )}
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <input
            placeholder="Phone or WhatsApp"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
          <textarea
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="rounded border border-neutral-300 px-2 py-1.5 text-sm"
          />
          {message && <p className="text-sm text-neutral-600">{message}</p>}
          <button
            type="submit"
            disabled={submitting || !isSignedIn}
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Request booking"}
          </button>
        </form>
      )}
    </section>
  );
}
