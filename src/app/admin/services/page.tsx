import { createClient } from "@/lib/supabase/server";

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data: serviceTypes } = await supabase
    .from("service_types")
    .select("id, name, slug, archetype, status")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Service types</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Archetype picker and module checklist land in Phase 2.
      </p>

      <ul className="mt-6 divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
        {serviceTypes?.length ? (
          serviceTypes.map((st) => (
            <li key={st.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{st.name}</span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-600">
                {st.status}
              </span>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-sm text-neutral-500">No service types yet.</li>
        )}
      </ul>
    </main>
  );
}
