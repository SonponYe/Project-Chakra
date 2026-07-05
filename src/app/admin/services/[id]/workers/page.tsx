import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddWorkerForm from "./AddWorkerForm";

export default async function ServiceTypeWorkersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: serviceType } = await supabase
    .from("service_types")
    .select("id, name, status")
    .eq("id", id)
    .maybeSingle();

  if (!serviceType) notFound();

  const { data: workers } = await supabase
    .from("workers")
    .select("id, display_name, status, created_at")
    .eq("service_type_id", id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Workers — {serviceType.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {serviceType.status === "draft"
          ? "Saving the first worker's profile data locks this service type's module layout."
          : "This service type is standardized — every worker here shares the same profile shape."}
      </p>

      <div className="mt-6">
        <AddWorkerForm serviceTypeId={serviceType.id} />
      </div>

      <ul className="mt-8 divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
        {workers?.length ? (
          workers.map((w) => (
            <li key={w.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{w.display_name}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-600">
                {w.status}
              </span>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-sm text-neutral-500">No workers yet.</li>
        )}
      </ul>
    </main>
  );
}
