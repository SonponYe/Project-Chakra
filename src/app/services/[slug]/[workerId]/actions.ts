"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/app/admin/services/actions";

export async function requestBookingAction(input: {
  workerId: string;
  requesterName: string;
  requesterContact: string;
  note?: string;
  requestedSlot: string;
}): Promise<ActionResult<true>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Please sign in to request a booking." };

  const { error } = await supabase.from("bookings").insert({
    worker_id: input.workerId,
    requester_user_id: user.id,
    requester_name: input.requesterName,
    requester_contact: input.requesterContact,
    note: input.note,
    requested_slot: input.requestedSlot,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: true };
}

export async function submitReviewAction(input: {
  workerId: string;
  rating: number;
  text?: string;
  bookingId?: string;
}): Promise<ActionResult<true>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Please sign in to leave a review." };

  const { error } = await supabase.from("reviews").insert({
    worker_id: input.workerId,
    reviewer_user_id: user.id,
    rating: input.rating,
    text: input.text,
    booking_id: input.bookingId,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: true };
}
