"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ModuleKey, BookingStatus } from "@/lib/supabase/database.types";
import type { ActionResult } from "@/app/admin/services/actions";

export async function saveWorkerModuleDataAction(input: {
  workerId: string;
  moduleKey: ModuleKey;
  data: Record<string, unknown>;
}): Promise<ActionResult<true>> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cb_save_worker_module_data", {
    p_worker_id: input.workerId,
    p_module_key: input.moduleKey,
    p_data: input.data,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true, data: true };
}

export async function setWorkerAvailabilityAction(input: {
  workerId: string;
  blocks: { dayOfWeek: number; startTime: string; endTime: string }[];
}): Promise<ActionResult<true>> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("worker_availability")
    .delete()
    .eq("worker_id", input.workerId);
  if (deleteError) return { ok: false, error: deleteError.message };

  if (input.blocks.length > 0) {
    const { error: insertError } = await supabase.from("worker_availability").insert(
      input.blocks.map((b) => ({
        worker_id: input.workerId,
        day_of_week: b.dayOfWeek,
        start_time: b.startTime,
        end_time: b.endTime,
      }))
    );
    if (insertError) return { ok: false, error: insertError.message };
  }

  revalidatePath("/dashboard");
  return { ok: true, data: true };
}

export async function addBlockedDateAction(input: {
  workerId: string;
  date: string;
}): Promise<ActionResult<true>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("worker_blocked_dates")
    .insert({ worker_id: input.workerId, blocked_date: input.date });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true, data: true };
}

export async function removeBlockedDateAction(input: {
  id: string;
}): Promise<ActionResult<true>> {
  const supabase = await createClient();
  const { error } = await supabase.from("worker_blocked_dates").delete().eq("id", input.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true, data: true };
}

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["accepted", "declined"],
  accepted: ["completed", "declined"],
  declined: [],
  completed: [],
};

export async function respondToBookingAction(input: {
  bookingId: string;
  currentStatus: BookingStatus;
  nextStatus: BookingStatus;
}): Promise<ActionResult<true>> {
  if (!ALLOWED_TRANSITIONS[input.currentStatus].includes(input.nextStatus)) {
    return { ok: false, error: `Cannot move a ${input.currentStatus} booking to ${input.nextStatus}.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: input.nextStatus })
    .eq("id", input.bookingId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true, data: true };
}

export async function respondToReviewAction(input: {
  reviewId: string;
  response: string;
}): Promise<ActionResult<true>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ worker_response: input.response })
    .eq("id", input.reviewId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true, data: true };
}
