import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractCustomFieldDefinitions } from "@/lib/modules/schemas";
import { computeAvailableSlots } from "@/lib/booking/slots";
import { getModuleDefinition } from "@/lib/modules/registry";
import type { ModuleConfigEntry, ModuleKey } from "@/lib/supabase/database.types";
import Seal from "@/components/ui/Seal";
import Band, { Eyebrow } from "@/components/ui/Band";

import GalleryPublicView from "@/components/modules/gallery/PublicView";
import OfferingListPublicView from "@/components/modules/offering-list/PublicView";
import StatsTrackRecordPublicView from "@/components/modules/stats-track-record/PublicView";
import CaseStudiesPublicView from "@/components/modules/case-studies/PublicView";
import BookingAvailabilityPublicView from "@/components/modules/booking-availability/PublicView";
import ReviewsPublicView from "@/components/modules/reviews/PublicView";
import ContactPublicView from "@/components/modules/contact/PublicView";
import CustomFieldsPublicView from "@/components/modules/custom-fields/PublicView";

export const revalidate = 30;

const MODULES_WITH_OWN_HEADING: ModuleKey[] = ["contact"];

export default async function WorkerProfilePage({
  params,
}: {
  params: Promise<{ slug: string; workerId: string }>;
}) {
  const { slug, workerId } = await params;
  const supabase = await createClient();

  const { data: serviceType } = await supabase
    .from("service_types")
    .select("id, name, slug, status, current_version_id")
    .eq("slug", slug)
    .eq("status", "standardized")
    .maybeSingle();

  if (!serviceType) notFound();

  const { data: worker } = await supabase
    .from("workers")
    .select("id, display_name, bio, status, service_type_id, created_at")
    .eq("id", workerId)
    .eq("status", "active")
    .maybeSingle();

  if (!worker || worker.service_type_id !== serviceType.id) notFound();

  const { data: version } = serviceType.current_version_id
    ? await supabase
        .from("service_type_versions")
        .select("module_config")
        .eq("id", serviceType.current_version_id)
        .maybeSingle()
    : { data: null };

  const moduleConfig = (version?.module_config ?? []) as ModuleConfigEntry[];
  const moduleKeys = moduleConfig.map((m) => m.module_key);
  const customFieldDefinitions = extractCustomFieldDefinitions(moduleConfig);

  const { data: moduleDataRows } = await supabase
    .from("worker_module_data")
    .select("module_key, data")
    .eq("worker_id", worker.id);
  const dataByModule = new Map(moduleDataRows?.map((r) => [r.module_key, r.data]) ?? []);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasBooking = moduleKeys.includes("booking_availability");
  const hasReviews = moduleKeys.includes("reviews");

  const [availabilityResult, blockedDatesResult, acceptedBookingsResult, completedCountResult, reviewsResult] =
    await Promise.all([
      hasBooking
        ? supabase.from("worker_availability").select("day_of_week, start_time, end_time").eq("worker_id", worker.id)
        : Promise.resolve({ data: [] as { day_of_week: number; start_time: string; end_time: string }[] }),
      hasBooking
        ? supabase.from("worker_blocked_dates").select("blocked_date").eq("worker_id", worker.id)
        : Promise.resolve({ data: [] as { blocked_date: string }[] }),
      hasBooking
        ? supabase.from("bookings").select("requested_slot").eq("worker_id", worker.id).eq("status", "accepted")
        : Promise.resolve({ data: [] as { requested_slot: string }[] }),
      hasBooking
        ? supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("worker_id", worker.id)
            .eq("status", "completed")
        : Promise.resolve({ count: 0 }),
      hasReviews
        ? supabase
            .from("reviews")
            .select("id, rating, text, worker_response, created_at")
            .eq("worker_id", worker.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({
            data: [] as {
              id: string;
              rating: number;
              text: string | null;
              worker_response: string | null;
              created_at: string;
            }[],
          }),
    ]);

  const slots = hasBooking
    ? computeAvailableSlots({
        availability: (availabilityResult.data ?? []).map((a) => ({
          dayOfWeek: a.day_of_week,
          startTime: a.start_time,
          endTime: a.end_time,
        })),
        blockedDates: (blockedDatesResult.data ?? []).map((d) => d.blocked_date),
        acceptedBookingSlots: (acceptedBookingsResult.data ?? []).map((b) => new Date(b.requested_slot)),
        slotDurationMinutes:
          (dataByModule.get("booking_availability") as { slotDurationMinutes?: number } | undefined)
            ?.slotDurationMinutes ?? 60,
      })
    : [];

  const reviewRows = (reviewsResult.data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    workerResponse: r.worker_response,
    createdAt: r.created_at,
  }));

  const avgRating = reviewRows.length
    ? reviewRows.reduce((s, r) => s + r.rating, 0) / reviewRows.length
    : null;

  const joinedYears = Math.max(1, Math.round((Date.now() - new Date(worker.created_at).getTime()) / (365 * 86400000)));

  return (
    <main className="flex-1">
      <div className="border-b border-hairline px-6 pb-4 pt-6">
        <div className="mx-auto max-w-2xl">
          <Link href={`/services/${serviceType.slug}`} className="text-[13px] text-muted transition-colors hover:text-ink">
            ← {serviceType.name}
          </Link>
        </div>
      </div>

      <Band tone="void">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="font-display text-4xl font-medium sm:text-[44px]">{worker.display_name}</h1>
          <Seal status={serviceType.status} />
        </div>

        <div className="mt-10 flex flex-wrap gap-10">
          {hasBooking && (
            <div>
              <p className="font-display text-[26px] tabular-nums">{completedCountResult.count ?? 0}</p>
              <p className="mt-1 text-[12px] uppercase tracking-wide text-muted">Bookings completed</p>
            </div>
          )}
          {avgRating !== null && (
            <div>
              <p className="font-display text-[26px] tabular-nums">{avgRating.toFixed(1)}</p>
              <p className="mt-1 text-[12px] uppercase tracking-wide text-muted">Average rating</p>
            </div>
          )}
          <div>
            <p className="font-display text-[26px] tabular-nums">{joinedYears} yr{joinedYears === 1 ? "" : "s"}</p>
            <p className="mt-1 text-[12px] uppercase tracking-wide text-muted">On the platform</p>
          </div>
        </div>

        {worker.bio && <p className="mt-8 max-w-[58ch] text-[15px] leading-relaxed text-ink/90">{worker.bio}</p>}
      </Band>

      {moduleConfig.map((m, index) => {
        const data = dataByModule.get(m.module_key) ?? {};
        const def = getModuleDefinition(m.module_key);
        const tone = index % 2 === 0 ? "surface" : "void";

        const content = (() => {
          switch (m.module_key) {
            case "gallery":
              return <GalleryPublicView data={data} />;
            case "offering_list":
              return <OfferingListPublicView data={data} />;
            case "stats_track_record":
              return <StatsTrackRecordPublicView data={data} />;
            case "case_studies":
              return <CaseStudiesPublicView data={data} />;
            case "booking_availability":
              return (
                <BookingAvailabilityPublicView
                  data={data}
                  workerId={worker.id}
                  slots={slots}
                  isSignedIn={Boolean(user)}
                />
              );
            case "reviews":
              return (
                <ReviewsPublicView
                  data={data}
                  workerId={worker.id}
                  reviews={reviewRows}
                  isSignedIn={Boolean(user)}
                />
              );
            case "contact":
              return <ContactPublicView data={data} />;
            case "custom_fields":
              return <CustomFieldsPublicView data={data} fieldDefinitions={customFieldDefinitions} />;
            default:
              return null;
          }
        })();

        if (!content) return null;

        return (
          <Band key={m.module_key} tone={tone} id={m.module_key === "contact" ? "contact" : undefined}>
            {!MODULES_WITH_OWN_HEADING.includes(m.module_key) && (
              <div className="mb-8">
                <Eyebrow>{def.label}</Eyebrow>
              </div>
            )}
            {content}
          </Band>
        );
      })}

      <footer className="px-6 py-10 text-center text-[12px] text-muted">Capital Business</footer>
    </main>
  );
}
