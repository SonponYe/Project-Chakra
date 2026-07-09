import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/auth";
import AddWorkerForm from "./AddWorkerForm";
import WorkersList from "./WorkersList";
import type { ModuleConfigEntry } from "@/lib/supabase/database.types";

export default async function ServiceTypeWorkersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const role = await getCurrentUserRole();
  const isSuperAdmin = role.kind === "admin" && role.role === "super_admin";

  const { data: serviceType } = await supabase
    .from("service_types")
    .select("id, name, status, current_version_id")
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
  const totalModules = ((version?.module_config ?? []) as ModuleConfigEntry[]).length || 1;

  const { data: workers } = await supabase
    .from("workers")
    .select("id, display_name, status, created_at")
    .eq("service_type_id", id)
    .order("created_at", { ascending: false });

  const workerIds = (workers ?? []).map((w) => w.id);
  const { data: moduleDataRows } = workerIds.length
    ? await supabase.from("worker_module_data").select("worker_id").in("worker_id", workerIds)
    : { data: [] as { worker_id: string }[] };

  const filledCountByWorker = new Map<string, number>();
  for (const row of moduleDataRows ?? []) {
    filledCountByWorker.set(row.worker_id, (filledCountByWorker.get(row.worker_id) ?? 0) + 1);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Admin</p>
      <h1 className="mt-2 font-display text-2xl font-medium">Workers — {serviceType.name}</h1>
      <p className="mt-1.5 text-[13.5px] text-muted">
        {serviceType.status === "draft"
          ? "Saving the first worker's profile data locks this service type's module layout."
          : "Standardized — every worker here shares the same profile shape."}
      </p>

      <div className="mt-8">
        <AddWorkerForm serviceTypeId={serviceType.id} />
      </div>

      <div className="mt-8">
        <WorkersList
          workers={(workers ?? []).map((w) => ({
            id: w.id,
            displayName: w.display_name,
            status: w.status,
            filled: filledCountByWorker.get(w.id) ?? 0,
          }))}
          totalModules={totalModules}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </main>
  );
}
