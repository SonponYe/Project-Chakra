import { z } from "zod";

export const galleryImageSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(200).optional(),
  isBeforeAfter: z.boolean().optional(),
});
export const galleryDataSchema = z.object({
  images: z.array(galleryImageSchema).default([]),
});
export type GalleryData = z.infer<typeof galleryDataSchema>;

export const offeringSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  price: z.coerce.number().nonnegative().optional(),
  unit: z.string().max(40).optional(),
  offeringType: z.enum(["service", "product"]),
  leadTimeDays: z.coerce.number().int().nonnegative().optional(),
});
export const offeringListDataSchema = z.object({
  offerings: z.array(offeringSchema).default([]),
});
export type OfferingListData = z.infer<typeof offeringListDataSchema>;

export const statEntrySchema = z.object({
  label: z.string().min(1).max(60),
  value: z.string().min(1).max(60),
  asOfDate: z.string().optional(),
});
export const statsTrackRecordDataSchema = z.object({
  stats: z.array(statEntrySchema).default([]),
  summary: z.string().max(2000).optional(),
  disclaimer: z.boolean().default(false),
});
export type StatsTrackRecordData = z.infer<typeof statsTrackRecordDataSchema>;

export const caseStudySchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  outcome: z.string().max(500).optional(),
  images: z.array(z.string().url()).default([]),
});
export const caseStudiesDataSchema = z.object({
  items: z.array(caseStudySchema).default([]),
});
export type CaseStudiesData = z.infer<typeof caseStudiesDataSchema>;

// Booking/availability module data is mostly settings-driven (actual
// availability lives in worker_availability / worker_blocked_dates); the
// worker_module_data row just carries small display/booking preferences.
export const bookingAvailabilityDataSchema = z.object({
  slotDurationMinutes: z.coerce.number().int().positive().default(60),
  note: z.string().max(500).optional(),
});
export type BookingAvailabilityData = z.infer<typeof bookingAvailabilityDataSchema>;

// Reviews module data is just a display preference -- actual reviews live in
// the `reviews` table.
export const reviewsDataSchema = z.object({
  showRatingPublicly: z.boolean().default(true),
});
export type ReviewsData = z.infer<typeof reviewsDataSchema>;

export const socialLinkSchema = z.object({
  label: z.string().min(1).max(40),
  url: z.string().url(),
});
export const contactDataSchema = z.object({
  phone: z.string().max(40).optional(),
  whatsapp: z.string().max(40).optional(),
  email: z.string().email().optional(),
  location: z.string().max(200).optional(),
  socials: z.array(socialLinkSchema).default([]),
});
export type ContactData = z.infer<typeof contactDataSchema>;

// Custom fields: the admin defines {key,label,fieldType} in the service
// type's module_config settings; the worker just fills in values here.
export const customFieldTypeSchema = z.enum(["text", "number", "url", "textarea"]);
export const customFieldDefinitionSchema = z.object({
  key: z.string().min(1).max(60),
  label: z.string().min(1).max(80),
  fieldType: customFieldTypeSchema,
});
export type CustomFieldDefinition = z.infer<typeof customFieldDefinitionSchema>;

export const customFieldsDataSchema = z.object({
  values: z.record(z.string(), z.string()).default({}),
});
export type CustomFieldsData = z.infer<typeof customFieldsDataSchema>;

export function extractCustomFieldDefinitions(
  moduleConfig: { module_key: string; settings?: Record<string, unknown> }[]
): CustomFieldDefinition[] {
  const entry = moduleConfig.find((m) => m.module_key === "custom_fields");
  const parsed = z.array(customFieldDefinitionSchema).safeParse(entry?.settings?.fields);
  return parsed.success ? parsed.data : [];
}
