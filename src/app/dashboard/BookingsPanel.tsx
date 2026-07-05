"use client";

import { useState } from "react";
import { respondToBookingAction } from "./actions";
import type { BookingStatus } from "@/lib/supabase/database.types";

export interface BookingRow {
  id: string;
  requesterName: string;
  requesterContact: string;
  note: string | null;
  requestedSlot: string;
  status: BookingStatus;
}

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
    return <p className="text-sm text-neutral-500">No booking requests yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {message && <p className="text-sm text-red-600">{message}</p>}
      {rows.map((b) => (
        <div key={b.id} className="rounded-md border border-neutral-200 bg-white p-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">{b.requesterName}</p>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-600">
              {b.status}
            </span>
          </div>
          <p className="text-neutral-500">{new Date(b.requestedSlot).toLocaleString()}</p>
          <p className="text-neutral-500">{b.requesterContact}</p>
          {b.note && <p className="mt-1 text-neutral-600">{b.note}</p>}

          {b.status === "pending" && (
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => respond(b, "accepted")}
                disabled={busyId === b.id}
                className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => respond(b, "declined")}
                disabled={busyId === b.id}
                className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium disabled:opacity-50"
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
              className="mt-2 rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              Mark completed
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
