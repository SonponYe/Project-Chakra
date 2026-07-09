import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getArchetypeDefinition } from "@/lib/modules/registry";
import Seal from "@/components/ui/Seal";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();
  const { data: serviceTypes } = await supabase
    .from("service_types")
    .select("id, name, slug, archetype, status")
    .eq("status", "standardized")
    .order("name", { ascending: true });

  const { data: workerCounts } = await supabase.from("workers").select("service_type_id").eq("status", "active");
  const countByType = new Map<string, number>();
  for (const w of workerCounts ?? []) {
    countByType.set(w.service_type_id, (countByType.get(w.service_type_id) ?? 0) + 1);
  }

  return (
    <main className="flex-1">
      <section className="border-b border-hairline px-6 pb-16 pt-24 sm:pb-20 sm:pt-32">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Capital Business</p>
          <h1 className="mt-4 text-balance text-4xl font-medium leading-[1.15] sm:text-5xl">
            Find trusted people for real work.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Every worker below has a standardized, verified profile — browse a category, compare, and book
            directly.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl">
          {serviceTypes?.length ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {serviceTypes.map((st) => {
                const archetype = getArchetypeDefinition(st.archetype);
                const count = countByType.get(st.id) ?? 0;
                return (
                  <Link
                    key={st.id}
                    href={`/services/${st.slug}`}
                    className="group rounded-md border border-hairline bg-surface p-5 transition-colors hover:border-emerald-dim"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-display text-lg font-medium">{st.name}</p>
                      <Seal status={st.status} />
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">{archetype.description}</p>
                    <p className="mt-4 text-[12px] font-medium uppercase tracking-wide text-muted">
                      {count} {count === 1 ? "worker" : "workers"}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted">No categories are live yet — check back soon.</p>
          )}
        </div>
      </section>
    </main>
  );
}
