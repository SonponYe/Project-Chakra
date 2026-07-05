import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getArchetypeDefinition } from "@/lib/modules/registry";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();
  const { data: serviceTypes } = await supabase
    .from("service_types")
    .select("id, name, slug, archetype")
    .eq("status", "standardized")
    .order("name", { ascending: true });

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Capital Business</h1>
        <p className="mt-2 text-neutral-500">Find and book skilled workers across every service category.</p>
      </div>

      {serviceTypes?.length ? (
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {serviceTypes.map((st) => {
            const archetype = getArchetypeDefinition(st.archetype);
            return (
              <Link
                key={st.id}
                href={`/services/${st.slug}`}
                className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
              >
                <p className="font-medium">{st.name}</p>
                <p className="mt-1 text-sm text-neutral-500">{archetype.description}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-10 text-center text-neutral-500">No categories are live yet — check back soon.</p>
      )}
    </main>
  );
}
