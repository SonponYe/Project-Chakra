import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { extractCustomFieldDefinitions } from "@/lib/modules/schemas";
import { computeAvailableSlots } from "@/lib/booking/slots";
import type { ModuleConfigEntry } from "@/lib/supabase/database.types";

import GalleryPublicView from "@/components/modules/gallery/PublicView";
import OfferingListPublicView from "@/components/modules/offering-list/PublicView";
import StatsTrackRecordPublicView from "@/components/modules/stats-track-record/PublicView";
import CaseStudiesPublicView from "@/components/modules/case-studies/PublicView";
import BookingAvailabilityPublicView from "@/components/modules/booking-availability/PublicView";
import ReviewsPublicView from "@/components/modules/reviews/PublicView";
import ContactPublicView from "@/components/modules/contact/PublicView";
import CustomFieldsPublicView from "@/components/modules/custom-fields/PublicView";

export const revalidate = 30;

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
    .select("id, display_name, bio, status, service_type_id")
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

  const [availabilityResult, blockedDatesResult, acceptedBookingsResult, reviewsResult] = await Promise.all([
    hasBooking
      ? supabase.from("worker_availability").select("day_of_week, start_time, end_time").eq("worker_id", worker.id)
      : Promise.resolve({ data: [] as { day_of_week: number; start_time: string; end_time: string }[] }),
    hasBooking
      ? supabase.from("worker_blocked_dates").select("blocked_date").eq("worker_id", worker.id)
      : Promise.resolve({ data: [] as { blocked_date: string }[] }),
    hasBooking
      ? supabase
          .from("bookings")
          .select("requested_slot")
          .eq("worker_id", worker.id)
          .eq("status", "accepted")
      : Promise.resolve({ data: [] as { requested_slot: string }[] }),
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

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold">{worker.display_name}</h1>
      {worker.bio && <p className="mt-2 text-neutral-600">{worker.bio}</p>}

      <div className="mt-8 flex flex-col gap-10">
        {moduleConfig.map((m) => {
          const data = dataByModule.get(m.module_key) ?? {};

          switch (m.module_key) {
            case "gallery":
              return <GalleryPublicView key={m.module_key} data={data} />;
            case "offering_list":
              return <OfferingListPublicView key={m.module_key} data={data} />;
            case "stats_track_record":
              return <StatsTrackRecordPublicView key={m.module_key} data={data} />;
            case "case_studies":
              return <CaseStudiesPublicView key={m.module_key} data={data} />;
            case "booking_availability":
              return (
                <BookingAvailabilityPublicView
                  key={m.module_key}
                  data={data}
                  workerId={worker.id}
                  slots={slots}
                  isSignedIn={Boolean(user)}
                />
              );
            case "reviews":
              return (
                <ReviewsPublicView
                  key={m.module_key}
                  data={data}
                  workerId={worker.id}
                  reviews={reviewRows}
                  isSignedIn={Boolean(user)}
                />
              );
            case "contact":
              return <ContactPublicView key={m.module_key} data={data} />;
            case "custom_fields":
              return (
                <CustomFieldsPublicView
                  key={m.module_key}
                  data={data}
                  fieldDefinitions={customFieldDefinitions}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </main>
  );
}
