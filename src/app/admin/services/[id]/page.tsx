import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getModuleDefinition } from "@/lib/modules/registry";
import EditDraftModules from "./EditDraftModules";
import ProposeNewVersion from "./ProposeNewVersion";
import { extractCustomFieldDefinitions } from "@/lib/modules/schemas";
import type { ModuleConfigEntry } from "@/lib/supabase/database.types";
import Seal from "@/components/ui/Seal";
import { btnClass } from "@/components/ui/button";

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
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-2 font-display text-2xl font-medium">{serviceType.name}</h1>
          <p className="mt-1 text-[13px] text-muted">/{serviceType.slug}</p>
        </div>
        <Seal status={serviceType.status} />
      </div>

      <Link href={`/admin/services/${serviceType.id}/workers`} className={`${btnClass("ghost", "sm")} mt-5`}>
        Manage workers
      </Link>

      {serviceType.status === "draft" ? (
        <div className="mt-9">
          <EditDraftModules
            serviceTypeId={serviceType.id}
            initialModuleKeys={moduleConfig.map((m) => m.module_key)}
            initialCustomFieldDefinitions={customFieldDefinitions}
          />
        </div>
      ) : (
        <div className="mt-9">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Locked module layout</p>
          <p className="mt-1.5 text-[13px] text-muted">
            Every worker in this category shares this exact profile shape.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {moduleConfig.map((m) => {
              const def = getModuleDefinition(m.module_key);
              return (
                <li
                  key={m.module_key}
                  className="rounded-md border border-dashed border-muted/25 px-3.5 py-2.5 text-[13.5px] opacity-80"
                >
                  <p className="font-medium text-ink">{def.label}</p>
                  <p className="text-[12px] text-muted">{def.description}</p>
                </li>
              );
            })}
          </ul>

          <div className="mt-5">
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
