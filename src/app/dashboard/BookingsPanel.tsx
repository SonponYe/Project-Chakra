"use client";

import { useState } from "react";
import { respondToBookingAction } from "./actions";
import { btnClass } from "@/components/ui/button";
import { CARD } from "@/components/ui/card";
import type { BookingStatus } from "@/lib/supabase/database.types";

export interface BookingRow {
  id: string;
  requesterName: string;
  requesterContact: string;
  note: string | null;
  requestedSlot: string;
  status: BookingStatus;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};

export default function BookingsPanel({ bookings }: { bookings: BookingRow[] }) {
  const [rows, setRows] = useState(bookings);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function respond(booking: BookingRow, nextStatus: BookingStatus) {
    setBusyId(booking.id);
    setMessage(null);
    const result = await respondToBookingAction({
      bookingId: booking.id,
      currentStatus: booking.status,
      nextStatus,
    });
    setBusyId(null);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === booking.id ? { ...r, status: nextStatus } : r)));
  }

  if (rows.length === 0) {
    return <p className="text-[13px] text-muted">No bookings yet — your public profile link is above.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {message && <p className="text-[13px] text-red-400">{message}</p>}
      {rows.map((b) => (
        <div key={b.id} className={CARD}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] font-semibold text-ink">{b.requesterName}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                b.status === "accepted"
                  ? "bg-emerald-tint text-emerald"
                  : b.status === "pending"
                    ? "border border-dashed border-muted/40 text-muted"
                    : "text-muted"
              }`}
            >
              {STATUS_LABEL[b.status]}
            </span>
          </div>
          <p className="mt-1 text-[13px] tabular-nums text-muted">{new Date(b.requestedSlot).toLocaleString()}</p>
          <p className="text-[13px] text-muted">{b.requesterContact}</p>
          {b.note && <p className="mt-1.5 text-[13px] text-ink/80">{b.note}</p>}

          {b.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => respond(b, "accepted")}
                disabled={busyId === b.id}
                className={btnClass("solid", "sm")}
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => respond(b, "declined")}
                disabled={busyId === b.id}
                className={btnClass("ghost", "sm")}
              >
                Decline
              </button>
            </div>
          )}
          {b.status === "accepted" && (
            <button
              type="button"
              onClick={() => respond(b, "completed")}
              disabled={busyId === b.id}
              className={`${btnClass("ghost", "sm")} mt-3`}
            >
              Mark completed
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
