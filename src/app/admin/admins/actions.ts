"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserRole } from "@/lib/auth";
import type { ActionResult } from "@/app/admin/services/actions";
import type { AdminRole } from "@/lib/supabase/database.types";

export async function createAdminAction(input: {
  email: string;
  role: AdminRole;
  assignedServiceTypeIds: string[];
}): Promise<ActionResult<true>> {
  const currentRole = await getCurrentUserRole();
  if (currentRole.kind !== "admin" || currentRole.role !== "super_admin") {
    return { ok: false, error: "Only super admins can add admins." };
  }

  const adminClient = createAdminClient();
  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(input.email);
  if (inviteError) return { ok: false, error: inviteError.message };
  if (!invited.user) return { ok: false, error: "Invite succeeded but no user was returned." };

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("admins").insert({
    user_id: invited.user.id,
    role: input.role,
    assigned_service_type_ids: input.role === "service_manager" ? input.assignedServiceTypeIds : null,
  });

  if (insertError) return { ok: false, error: insertError.message };
  return { ok: true, data: true };
}
