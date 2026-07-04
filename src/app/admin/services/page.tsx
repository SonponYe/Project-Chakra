import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const { data: serviceTypes } = await supabase
    .from("service_types")
    .select("id, name, slug, archetype, status")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Service types</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Draft types lock the moment their first worker&apos;s data is saved.
          </p>
        </div>
        <Link
          href="/admin/services/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          New service type
        </Link>
      </div>

      <ul className="mt-6 divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
        {serviceTypes?.length ? (
          serviceTypes.map((st) => (
            <li key={st.id}>
              <Link
                href={`/admin/services/${st.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50"
              >
                <span>{st.name}</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-600">
                  {st.status}
                </span>
              </Link>
            </li>
          ))
        ) : (
          <li className="px-4 py-6 text-sm text-neutral-500">No service types yet.</li>
        )}
      </ul>
    </main>
  );
}
