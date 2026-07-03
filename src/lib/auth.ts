import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/supabase/database.types";

export type CurrentUserRole =
  | { kind: "admin"; role: AdminRole; assignedServiceTypeIds: string[] | null }
  | { kind: "worker"; workerId: string; serviceTypeId: string }
  | { kind: "visitor" };

// Resolves the signed-in user's role by checking `admins` then `workers`.
// A user should only ever match one of these tables.
export async function getCurrentUserRole(): Promise<CurrentUserRole> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { kind: "visitor" };

  const { data: admin } = await supabase
    .from("admins")
    .select("role, assigned_service_type_ids")
    .eq("user_id", user.id)
    .maybeSingle();

  if (admin) {
    return {
      kind: "admin",
      role: admin.role,
      assignedServiceTypeIds: admin.assigned_service_type_ids,
    };
  }

  const { data: worker } = await supabase
    .from("workers")
    .select("id, service_type_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (worker) {
    return { kind: "worker", workerId: worker.id, serviceTypeId: worker.service_type_id };
  }

  return { kind: "visitor" };
}

export function homePathForRole(role: CurrentUserRole): string {
  switch (role.kind) {
    case "admin":
      return "/admin/services";
    case "worker":
      return "/dashboard";
    case "visitor":
      return "/";
  }
}
