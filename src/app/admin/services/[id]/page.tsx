import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getModuleDefinition } from "@/lib/modules/registry";
import EditDraftModules from "./EditDraftModules";
import ProposeNewVersion from "./ProposeNewVersion";
import { extractCustomFieldDefinitions } from "@/lib/modules/schemas";
import type { ModuleConfigEntry } from "@/lib/supabase/database.types";

export default async function ServiceTypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: serviceType } = await supabase
    .from("service_types")
    .select("id, name, slug, archetype, status, current_version_id")
    .eq("id", id)
    .maybeSingle();

  if (!serviceType) notFound();

  const { data: version } = serviceType.current_version_id
    ? await supabase
        .from("service_type_versions")
        .select("module_config")
        .eq("id", serviceType.current_version_id)
        .maybeSingle()
    : { data: null };

  const moduleConfig = (version?.module_config ?? []) as ModuleConfigEntry[];
  const customFieldDefinitions = extractCustomFieldDefinitions(moduleConfig);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{serviceType.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">/{serviceType.slug}</p>
        </div>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600">
          {serviceType.status}
        </span>
      </div>

      <Link
        href={`/admin/services/${serviceType.id}/workers`}
        className="mt-4 inline-block rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
      >
        Manage workers
      </Link>

      {serviceType.status === "draft" ? (
        <div className="mt-8">
          <EditDraftModules
            serviceTypeId={serviceType.id}
            initialModuleKeys={moduleConfig.map((m) => m.module_key)}
            initialCustomFieldDefinitions={customFieldDefinitions}
          />
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-sm font-medium text-neutral-700">Locked module layout</p>
          <p className="mt-1 text-xs text-neutral-500">
            This service type is standardized — every worker in it shares this exact profile shape.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {moduleConfig.map((m) => {
              const def = getModuleDefinition(m.module_key);
              return (
                <li
                  key={m.module_key}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
                >
                  <p className="font-medium">{def.label}</p>
                  <p className="text-xs text-neutral-500">{def.description}</p>
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            <ProposeNewVersion
              serviceTypeId={serviceType.id}
              currentModuleKeys={moduleConfig.map((m) => m.module_key)}
              currentCustomFieldDefinitions={customFieldDefinitions}
            />
          </div>
        </div>
      )}
    </main>
  );
}
