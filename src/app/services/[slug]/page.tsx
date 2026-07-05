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

  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-2xl font-semibold">{serviceType.name}</h1>

      {workers?.length ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {workers.map((w) => (
            <Link
              key={w.id}
              href={`/services/${serviceType.slug}/${w.id}`}
              className="rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
            >
              <p className="font-medium">{w.display_name}</p>
              {w.bio && <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{w.bio}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-neutral-500">No workers listed here yet.</p>
      )}
    </main>
  );
}
