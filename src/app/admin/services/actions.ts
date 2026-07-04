"use server";

import { createClient } from "@/lib/supabase/server";
import { buildModuleConfig } from "@/lib/modules/registry";
import type { ModuleKey, ServiceTypeArchetype } from "@/lib/supabase/database.types";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function createServiceTypeAction(input: {
  name: string;
  slug: string;
  archetype: ServiceTypeArchetype;
  moduleKeys: ModuleKey[];
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("cb_create_service_type_draft", {
    p_name: input.name,
    p_slug: input.slug,
    p_archetype: input.archetype,
    p_module_config: buildModuleConfig(input.moduleKeys),
  });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "That slug is already taken." };
    return { ok: false, error: error.message };
  }

  return { ok: true, data: { id: data } };
}

export async function updateServiceTypeDraftModulesAction(input: {
  serviceTypeId: string;
  moduleKeys: ModuleKey[];
}): Promise<ActionResult<true>> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("cb_update_service_type_draft_modules", {
    p_service_type_id: input.serviceTypeId,
    p_module_config: buildModuleConfig(input.moduleKeys),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: true };
}
