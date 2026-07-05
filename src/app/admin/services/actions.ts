"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserRole } from "@/lib/auth";
import { generateTempPassword } from "@/lib/password";
import { buildModuleConfig } from "@/lib/modules/registry";
import type { ModuleKey, ServiceTypeArchetype } from "@/lib/supabase/database.types";
import type { CustomFieldDefinition } from "@/lib/modules/schemas";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function settingsFor(moduleKeys: ModuleKey[], customFieldDefinitions?: CustomFieldDefinition[]) {
  if (!customFieldDefinitions?.length || !moduleKeys.includes("custom_fields")) return undefined;
  return { custom_fields: { fields: customFieldDefinitions } };
}

export async function createServiceTypeAction(input: {
  name: string;
  slug: string;
  archetype: ServiceTypeArchetype;
  moduleKeys: ModuleKey[];
  customFieldDefinitions?: CustomFieldDefinition[];
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("cb_create_service_type_draft", {
    p_name: input.name,
    p_slug: input.slug,
    p_archetype: input.archetype,
    p_module_config: buildModuleConfig(input.moduleKeys, settingsFor(input.moduleKeys, input.customFieldDefinitions)),
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
  customFieldDefinitions?: CustomFieldDefinition[];
}): Promise<ActionResult<true>> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("cb_update_service_type_draft_modules", {
    p_service_type_id: input.serviceTypeId,
    p_module_config: buildModuleConfig(input.moduleKeys, settingsFor(input.moduleKeys, input.customFieldDefinitions)),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: true };
}

export async function createServiceTypeVersionAction(input: {
  serviceTypeId: string;
  moduleKeys: ModuleKey[];
  customFieldDefinitions?: CustomFieldDefinition[];
}): Promise<ActionResult<true>> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("cb_create_service_type_version", {
    p_service_type_id: input.serviceTypeId,
    p_module_config: buildModuleConfig(input.moduleKeys, settingsFor(input.moduleKeys, input.customFieldDefinitions)),
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: true };
}

export async function createWorkerAction(input: {
  serviceTypeId: string;
  email: string;
  displayName: string;
  bio?: string;
}): Promise<ActionResult<{ id: string; tempPassword: string }>> {
  const role = await getCurrentUserRole();
  const isAuthorized =
    role.kind === "admin" &&
    (role.role === "super_admin" || (role.assignedServiceTypeIds?.includes(input.serviceTypeId) ?? false));

  if (!isAuthorized) return { ok: false, error: "Not authorized to add workers to this service type." };

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
  const { data: worker, error: insertError } = await supabase
    .from("workers")
    .insert({
      user_id: created.user.id,
      service_type_id: input.serviceTypeId,
      display_name: input.displayName,
      bio: input.bio,
    })
    .select("id")
    .single();

  if (insertError) return { ok: false, error: insertError.message };
  return { ok: true, data: { id: worker.id, tempPassword } };
}
