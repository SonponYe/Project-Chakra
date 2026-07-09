import { Check } from "lucide-react";
import type { ServiceTypeStatus } from "@/lib/supabase/database.types";

// The recurring draft/standardized motif: dashed + muted while editable,
// solid emerald + sealed once locked. Used on category cards, the admin
// service list, and profile headers so the state of the data is legible
// everywhere at a glance.
export default function Seal({ status, className = "" }: { status: ServiceTypeStatus; className?: string }) {
  if (status === "standardized") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-dim bg-emerald-tint px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald ${className}`}
      >
        <Check size={12} strokeWidth={2.5} />
        Standardized
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border border-dashed border-muted/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted ${className}`}
    >
      Draft
    </span>
  );
}
