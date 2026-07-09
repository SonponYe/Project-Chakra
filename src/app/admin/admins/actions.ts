"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserRole } from "@/lib/auth";
import { generateTempPassword } from "@/lib/password";
import type { ActionResult } from "@/app/admin/services/actions";
import type { AdminRole } from "@/lib/supabase/database.types";

export async function createAdminAction(input: {
  email: string;
  role: AdminRole;
  assignedServiceTypeIds: string[];
}): Promise<ActionResult<{ tempPassword: string }>> {
  const currentRole = await getCurrentUserRole();
  if (currentRole.kind !== "admin" || currentRole.role !== "super_admin") {
    return { ok: false, error: "Only super admins can add admins." };
  }

  const tempPassword = generateTempPassword();
  const adminClient = createAdminClient();
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: tempPassword,
    email_confirm: true,
  });
  if (createError) return { ok: false, error: createError.message };
  if (!created.user) return { ok: false, error: "Account creation succeeded but no user was returned." };

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("admins").insert({
    user_id: created.user.id,
    role: input.role,
    assigned_service_type_ids: input.role === "service_manager" ? input.assignedServiceTypeIds : null,
  });

  if (insertError) return { ok: false, error: insertError.message };
  return { ok: true, data: { tempPassword } };
}

export async function deleteAdminAction(adminId: string): Promise<ActionResult<true>> {
  const currentRole = await getCurrentUserRole();
  if (currentRole.kind !== "admin" || currentRole.role !== "super_admin") {
    return { ok: false, error: "Only super admins can remove admins." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: target, error: fetchError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("id", adminId)
    .single();
  if (fetchError || !target) return { ok: false, error: fetchError?.message ?? "Admin not found." };

  if (target.user_id === user?.id) {
    return { ok: false, error: "You can't remove your own admin access." };
  }

  const adminClient = createAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(target.user_id);
  if (deleteError) return { ok: false, error: deleteError.message };

  return { ok: true, data: true };
}
