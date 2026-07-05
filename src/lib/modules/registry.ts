import type { ModuleKey, ModuleConfigEntry, ServiceTypeArchetype } from "@/lib/supabase/database.types";

export interface ModuleDefinition {
  key: ModuleKey;
  label: string;
  description: string;
  /** Present on every worker profile regardless of archetype; can't be removed from the checklist. */
  alwaysIncluded?: boolean;
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    key: "gallery",
    label: "Gallery",
    description: "Image gallery with optional captions and before/after pairing.",
  },
  {
    key: "offering_list",
    label: "Offering list",
    description:
      "Services or products with price, unit, and optional lead time (e.g. pre-order goods, price lists).",
  },
  {
    key: "stats_track_record",
    label: "Stats / track record",
    description: "Key metrics plus a free-text summary. Supports a mandatory disclaimer flag.",
  },
  {
    key: "case_studies",
    label: "Case studies",
    description: "Title, description, outcome, and images per project.",
  },
  {
    key: "booking_availability",
    label: "Booking / availability",
    description: "Recurring availability the worker manages; visitors request slots.",
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "Visitor star ratings and text. Worker can respond but not delete.",
  },
  {
    key: "contact",
    label: "Contact",
    description: "Phone, WhatsApp, email, socials, location.",
    alwaysIncluded: true,
  },
  {
    key: "custom_fields",
    label: "Custom fields",
    description: "Admin-defined key/value fields for the rare service that needs something else. Use sparingly.",
  },
];

export function getModuleDefinition(key: ModuleKey): ModuleDefinition {
  const def = MODULE_REGISTRY.find((m) => m.key === key);
  if (!def) throw new Error(`Unknown module key: ${key}`);
  return def;
}

export interface ArchetypeDefinition {
  key: ServiceTypeArchetype;
  label: string;
  description: string;
  defaultModules: ModuleKey[];
}

// "Price list" in the brief's trade/production archetype maps onto the
// offering_list module (which already carries price + unit) rather than a
// separate module — there is no distinct price-list module in the library.
export const ARCHETYPES: ArchetypeDefinition[] = [
  {
    key: "creative_portfolio",
    label: "Creative / portfolio",
    description: "Graphic design, photography, and similar showcase-first work.",
    defaultModules: ["gallery", "offering_list", "case_studies", "contact"],
  },
  {
    key: "appointment_personal_care",
    label: "Appointment / personal care",
    description: "Hairdressing and other slot-booked personal services.",
    defaultModules: ["gallery", "offering_list", "booking_availability", "reviews", "contact"],
  },
  {
    key: "food_craft_goods",
    label: "Food / craft goods",
    description: "Baking and other made-to-order goods with lead time.",
    defaultModules: ["offering_list", "gallery", "contact"],
  },
  {
    key: "retail_product",
    label: "Retail / product",
    description: "Catalog-style products sold as-is.",
    defaultModules: ["offering_list", "gallery", "reviews", "contact"],
  },
  {
    key: "financial_advisory",
    label: "Financial / advisory",
    description: "Forex trading and similar advisory services built on track record.",
    defaultModules: ["stats_track_record", "case_studies", "contact"],
  },
  {
    key: "trade_production_service",
    label: "Trade / production service",
    description: "Printing and other bulk service or production work.",
    defaultModules: ["offering_list", "gallery", "contact"],
  },
];

export function getArchetypeDefinition(key: ServiceTypeArchetype): ArchetypeDefinition {
  const def = ARCHETYPES.find((a) => a.key === key);
  if (!def) throw new Error(`Unknown archetype key: ${key}`);
  return def;
}

// Ensures `contact` is present exactly once, appended last if the caller didn't include it.
export function buildModuleConfig(
  moduleKeys: ModuleKey[],
  settingsByKey?: Partial<Record<ModuleKey, Record<string, unknown>>>
): ModuleConfigEntry[] {
  const withoutContact = moduleKeys.filter((k) => k !== "contact");
  const ordered: ModuleKey[] = [...withoutContact, "contact"];
  return ordered.map((module_key) => ({
    module_key,
    ...(settingsByKey?.[module_key] ? { settings: settingsByKey[module_key] } : {}),
  }));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
