"use client";

import { motion } from "framer-motion";
import { offeringListDataSchema } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";

export default function OfferingListPublicView({ data }: { data: unknown }) {
  const parsed = offeringListDataSchema.safeParse(data);
  if (!parsed.success || parsed.data.offerings.length === 0) return null;

  return (
    <div>
      <div className="flex flex-col">
        {parsed.data.offerings.map((o, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03, duration: 0.4 }}
            className="flex items-start justify-between gap-5 border-t border-hairline py-5 first:border-t-0"
          >
            <div>
              <p className="text-[15px] font-semibold text-ink">{o.name}</p>
              {o.description && <p className="mt-1 max-w-[46ch] text-[13.5px] text-muted">{o.description}</p>}
              {o.leadTimeDays ? (
                <p className="mt-1.5 text-[12px] text-muted/80">Lead time: {o.leadTimeDays} day(s)</p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              {o.price != null && (
                <p className="tabular-nums text-[14px] text-ink">
                  {o.price} <span className="text-muted">{o.unit ?? ""}</span>
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <a href="#contact" className={`${btnClass("solid", "md")} mt-6`}>
        {parsed.data.offerings[0]?.offeringType === "product" ? "Order" : "Enquire / Book"}
      </a>
    </div>
  );
}
