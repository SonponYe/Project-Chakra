import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/auth";
import Seal from "@/components/ui/Seal";
import { btnClass } from "@/components/ui/button";

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const role = await getCurrentUserRole();

  const { data: serviceTypes } = await supabase
    .from("service_types")
    .select("id, name, slug, archetype, status")
    .order("created_at", { ascending: false });

  const { data: workerCounts } = await supabase.from("workers").select("service_type_id");
  const countByType = new Map<string, number>();
  for (const w of workerCounts ?? []) {
    countByType.set(w.service_type_id, (countByType.get(w.service_type_id) ?? 0) + 1);
  }

  const isSuperAdmin = role.kind === "admin" && role.role === "super_admin";

  const stats = isSuperAdmin
    ? await Promise.all([
        supabase.from("workers").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }),
      ])
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Admin</p>
          <h1 className="mt-2 font-display text-2xl font-medium">Service types</h1>
          <p className="mt-1.5 text-[13.5px] text-muted">
            Draft types lock the moment their first worker&apos;s data is saved.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isSuperAdmin && (
            <Link href="/admin/admins" className={btnClass("ghost", "sm")}>
              Admins
            </Link>
          )}
          <Link href="/admin/services/new" className={btnClass("solid", "sm")}>
            New service type
          </Link>
        </div>
      </div>

      {stats && (
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="rounded-md border border-hairline bg-surface p-4 text-center">
            <p className="font-display text-xl tabular-nums">{stats[0].count ?? 0}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">Workers</p>
          </div>
          <div className="rounded-md border border-hairline bg-surface p-4 text-center">
            <p className="font-display text-xl tabular-nums">{stats[1].count ?? 0}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">Bookings</p>
          </div>
          <div className="rounded-md border border-hairline bg-surface p-4 text-center">
            <p className="font-display text-xl tabular-nums">{stats[2].count ?? 0}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted">Reviews</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2.5">
        {serviceTypes?.length ? (
          serviceTypes.map((st) => (
            <Link
              key={st.id}
              href={`/admin/services/${st.id}`}
              className="flex items-center justify-between gap-4 rounded-md border border-hairline bg-surface px-5 py-4 transition-colors hover:border-emerald-dim"
            >
              <div>
                <p className="text-[14.5px] font-medium text-ink">{st.name}</p>
                <p className="mt-0.5 text-[12px] tabular-nums text-muted">
                  {countByType.get(st.id) ?? 0} {countByType.get(st.id) === 1 ? "worker" : "workers"}
                </p>
              </div>
              <Seal status={st.status} />
            </Link>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-muted/30 px-5 py-6 text-center text-[13px] text-muted">
            No service types yet.
          </p>
        )}
      </div>
    </main>
  );
}
