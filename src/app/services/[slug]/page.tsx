import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: serviceType } = await supabase
    .from("service_types")
    .select("id, name, slug, status")
    .eq("slug", slug)
    .eq("status", "standardized")
    .maybeSingle();

  if (!serviceType) notFound();

  const { data: workers } = await supabase
    .from("workers")
    .select("id, display_name, bio")
    .eq("service_type_id", serviceType.id)
    .eq("status", "active")
    .order("display_name", { ascending: true });

  const workerIds = (workers ?? []).map((w) => w.id);
  const { data: reviews } = workerIds.length
    ? await supabase.from("reviews").select("worker_id, rating").in("worker_id", workerIds)
    : { data: [] as { worker_id: string; rating: number }[] };

  const ratingByWorker = new Map<string, { avg: number; count: number }>();
  for (const id of workerIds) {
    const mine = (reviews ?? []).filter((r) => r.worker_id === id);
    if (mine.length) {
      ratingByWorker.set(id, {
        avg: mine.reduce((s, r) => s + r.rating, 0) / mine.length,
        count: mine.length,
      });
    }
  }

  return (
    <main className="flex-1 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-[13px] text-muted transition-colors hover:text-ink">
          ← All categories
        </Link>
        <h1 className="mt-4 font-display text-3xl font-medium">{serviceType.name}</h1>

        <div className="mt-10 flex flex-col gap-3">
          {workers?.length ? (
            workers.map((w) => {
              const rating = ratingByWorker.get(w.id);
              return (
                <Link
                  key={w.id}
                  href={`/services/${serviceType.slug}/${w.id}`}
                  className="rounded-md border border-hairline bg-surface p-5 transition-colors hover:border-emerald-dim"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-display text-base font-medium">{w.display_name}</p>
                    {rating && (
                      <p className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-emerald">
                        ★ {rating.avg.toFixed(1)}{" "}
                        <span className="text-muted">({rating.count})</span>
                      </p>
                    )}
                  </div>
                  {w.bio && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{w.bio}</p>}
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-muted">No workers listed here yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
