"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { bookingAvailabilityDataSchema } from "@/lib/modules/schemas";
import type { Slot } from "@/lib/booking/slots";
import { requestBookingAction } from "@/app/services/[slug]/[workerId]/actions";
import { btnClass } from "@/components/ui/button";

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
    setMessage(result.ok ? "Request sent — you'll hear back soon." : result.error);
    if (result.ok) setSelected(null);
  }

  return (
    <div>
      {parsed.success && parsed.data.note && <p className="mb-5 text-[13.5px] text-muted">{parsed.data.note}</p>}

      {slots.length === 0 ? (
        <p className="text-[13.5px] text-muted">No open slots right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {slots.map((s) => {
            const isSelected = selected?.start.getTime() === s.start.getTime();
            return (
              <motion.button
                key={s.start.toISOString()}
                type="button"
                onClick={() => setSelected(s)}
                whileTap={{ scale: 0.97 }}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 rounded-md border px-3 py-2.5 text-left text-[13px] tabular-nums transition-colors ${
                  isSelected
                    ? "border-emerald bg-emerald-tint text-emerald"
                    : "border-hairline text-ink hover:border-emerald-dim hover:bg-emerald-tint/40"
                }`}
              >
                <span className={`h-[5px] w-[5px] shrink-0 rounded-full ${isSelected ? "bg-emerald" : "bg-emerald/70"}`} />
                {s.start.toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </motion.button>
            );
          })}
        </div>
      )}

      {selected && (
        <form onSubmit={handleSubmit} className="mt-7 flex max-w-sm flex-col gap-3 border-t border-hairline pt-7">
          <p className="text-[13px] text-muted">
            Requesting{" "}
            <b className="font-semibold text-ink">
              {selected.start.toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </b>
          </p>
          {!isSignedIn && (
            <p className="text-[13px] text-amber-400">
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
            className="rounded-md border border-hairline bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-emerald focus:outline-none"
          />
          <input
            placeholder="Phone or WhatsApp"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            className="rounded-md border border-hairline bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-emerald focus:outline-none"
          />
          <textarea
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="rounded-md border border-hairline bg-elevated px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-emerald focus:outline-none"
          />
          {message && <p className="text-[13px] text-muted">{message}</p>}
          <button type="submit" disabled={submitting || !isSignedIn} className={`${btnClass("solid", "md")} self-start`}>
            {submitting ? "Sending…" : "Request booking"}
          </button>
        </form>
      )}
    </div>
  );
}
