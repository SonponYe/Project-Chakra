import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getCurrentUserRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getModuleDefinition } from "@/lib/modules/registry";
import { extractCustomFieldDefinitions } from "@/lib/modules/schemas";
import Seal from "@/components/ui/Seal";
import type { ModuleConfigEntry, ModuleKey } from "@/lib/supabase/database.types";
import BookingsPanel, { type BookingRow } from "./BookingsPanel";

import GalleryAdminForm from "@/components/modules/gallery/AdminForm";
import OfferingListAdminForm from "@/components/modules/offering-list/AdminForm";
import StatsTrackRecordAdminForm from "@/components/modules/stats-track-record/AdminForm";
import CaseStudiesAdminForm from "@/components/modules/case-studies/AdminForm";
import BookingAvailabilityAdminForm from "@/components/modules/booking-availability/AdminForm";
import ReviewsAdminForm, { type ReviewRow } from "@/components/modules/reviews/AdminForm";
import ContactAdminForm from "@/components/modules/contact/AdminForm";
import CustomFieldsAdminForm from "@/components/modules/custom-fields/AdminForm";

export default async function WorkerDashboardPage() {
  const role = await getCurrentUserRole();
  if (role.kind !== "worker") {
    redirect("/login?next=/dashboard");
  }

  const supabase = await createClient();

  const { data: worker } = await supabase
    .from("workers")
    .select("id, display_name, status, service_type_id")
    .eq("id", role.workerId)
    .single();

  if (!worker) {
    throw new Error("Worker record not found for the signed-in user.");
  }

  const { data: serviceType } = await supabase
    .from("service_types")
    .select("id, name, slug, status, current_version_id")
    .eq("id", worker.service_type_id)
    .single();

  if (!serviceType) {
    throw new Error("Service type not found or not visible to this worker (check RLS).");
  }

  const { data: version } = serviceType.current_version_id
    ? await supabase
        .from("service_type_versions")
        .select("module_config")
        .eq("id", serviceType.current_version_id)
        .single()
    : { data: null };

  const moduleConfig = (version?.module_config ?? []) as ModuleConfigEntry[];
  const moduleKeys = moduleConfig.map((m) => m.module_key);
  const customFieldDefinitions = extractCustomFieldDefinitions(moduleConfig);

  const { data: moduleDataRows } = await supabase
    .from("worker_module_data")
    .select("module_key, data")
    .eq("worker_id", worker.id);

  const dataByModule = new Map<ModuleKey, unknown>(
    (moduleDataRows ?? []).map((r) => [r.module_key, r.data])
  );

  const hasBooking = moduleKeys.includes("booking_availability");
  const hasReviews = moduleKeys.includes("reviews");

  const [availabilityResult, blockedDatesResult, bookingsResult, reviewsResult] = await Promise.all([
    hasBooking
      ? supabase.from("worker_availability").select("day_of_week, start_time, end_time").eq("worker_id", worker.id)
      : Promise.resolve({ data: [] as { day_of_week: number; start_time: string; end_time: string }[] }),
    hasBooking
      ? supabase.from("worker_blocked_dates").select("id, blocked_date").eq("worker_id", worker.id)
      : Promise.resolve({ data: [] as { id: string; blocked_date: string }[] }),
    hasBooking
      ? supabase
          .from("bookings")
          .select("id, requester_name, requester_contact, note, requested_slot, status")
          .eq("worker_id", worker.id)
          .order("requested_slot", { ascending: true })
      : Promise.resolve({
          data: [] as {
            id: string;
            requester_name: string;
            requester_contact: string;
            note: string | null;
            requested_slot: string;
            status: BookingRow["status"];
          }[],
        }),
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

  const bookingRows: BookingRow[] = (bookingsResult.data ?? []).map((b) => ({
    id: b.id,
    requesterName: b.requester_name,
    requesterContact: b.requester_contact,
    note: b.note,
    requestedSlot: b.requested_slot,
    status: b.status,
  }));

  const reviewRows: ReviewRow[] = (reviewsResult.data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    text: r.text,
    workerResponse: r.worker_response,
    createdAt: r.created_at,
  }));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-medium">{worker.display_name}</h1>
            <Seal status={serviceType.status} />
          </div>
          <p className="mt-1.5 text-[13.5px] text-muted">{serviceType.name}</p>
        </div>
        {serviceType.status === "standardized" && (
          <Link
            href={`/services/${serviceType.slug}/${worker.id}`}
            className="flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-muted transition-colors hover:text-emerald"
          >
            View public profile <ArrowUpRight size={13} />
          </Link>
        )}
      </div>
      {serviceType.status === "draft" && (
        <p className="mt-4 rounded-md border border-dashed border-muted/30 p-3 text-[12.5px] text-muted">
          Saving any section below locks this service type&apos;s layout for every worker in it.
        </p>
      )}

      <div className="mt-10 flex flex-col gap-10">
        {moduleConfig.map((m) => {
          const def = getModuleDefinition(m.module_key);
          const data = dataByModule.get(m.module_key) ?? {};

          return (
            <section key={m.module_key}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{def.label}</p>
              <div className="mt-3">
                {m.module_key === "gallery" && (
                  <GalleryAdminForm workerId={worker.id} initialData={data} />
                )}
                {m.module_key === "offering_list" && (
                  <OfferingListAdminForm workerId={worker.id} initialData={data} />
                )}
                {m.module_key === "stats_track_record" && (
                  <StatsTrackRecordAdminForm workerId={worker.id} initialData={data} />
                )}
                {m.module_key === "case_studies" && (
                  <CaseStudiesAdminForm workerId={worker.id} initialData={data} />
                )}
                {m.module_key === "booking_availability" && (
                  <>
                    <BookingAvailabilityAdminForm
                      workerId={worker.id}
                      initialData={data}
                      initialAvailability={(availabilityResult.data ?? []).map((a) => ({
                        dayOfWeek: a.day_of_week,
                        startTime: a.start_time,
                        endTime: a.end_time,
                      }))}
                      initialBlockedDates={(blockedDatesResult.data ?? []).map((d) => ({
                        id: d.id,
                        blockedDate: d.blocked_date,
                      }))}
                    />
                    <div className="mt-8">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Booking requests</p>
                      <div className="mt-3">
                        <BookingsPanel bookings={bookingRows} />
                      </div>
                    </div>
                  </>
                )}
                {m.module_key === "reviews" && (
                  <ReviewsAdminForm workerId={worker.id} initialData={data} reviews={reviewRows} />
                )}
                {m.module_key === "contact" && (
                  <ContactAdminForm workerId={worker.id} initialData={data} />
                )}
                {m.module_key === "custom_fields" && (
                  <CustomFieldsAdminForm
                    workerId={worker.id}
                    initialData={data}
                    fieldDefinitions={customFieldDefinitions}
                  />
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
