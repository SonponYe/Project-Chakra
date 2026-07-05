"use client";

import { motion } from "framer-motion";
import { offeringListDataSchema } from "@/lib/modules/schemas";

export default function OfferingListPublicView({ data }: { data: unknown }) {
  const parsed = offeringListDataSchema.safeParse(data);
  if (!parsed.success || parsed.data.offerings.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Offerings</h2>
      <div className="mt-3 flex flex-col gap-3">
        {parsed.data.offerings.map((o, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center justify-between gap-4 rounded-md border border-neutral-200 bg-white p-4"
          >
            <div>
              <p className="font-medium">{o.name}</p>
              {o.description && <p className="text-sm text-neutral-500">{o.description}</p>}
              {o.leadTimeDays ? (
                <p className="mt-1 text-xs text-neutral-400">Lead time: {o.leadTimeDays} day(s)</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {o.price != null && (
                <p className="text-sm font-medium">
                  {o.price} {o.unit ?? ""}
                </p>
              )}
              <a
                href="#contact"
                className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-medium text-white"
              >
                {o.offeringType === "product" ? "Order" : "Enquire / Book"}
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
