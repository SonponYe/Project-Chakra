"use client";

import { motion } from "framer-motion";
import { caseStudiesDataSchema } from "@/lib/modules/schemas";

export default function CaseStudiesPublicView({ data }: { data: unknown }) {
  const parsed = caseStudiesDataSchema.safeParse(data);
  if (!parsed.success || parsed.data.items.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Case studies</h2>
      <div className="mt-3 flex flex-col gap-4">
        {parsed.data.items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            className="rounded-md border border-neutral-200 bg-white p-4"
          >
            <p className="font-medium">{it.title}</p>
            {it.description && <p className="mt-1 text-sm text-neutral-600">{it.description}</p>}
            {it.outcome && <p className="mt-1 text-sm font-medium text-neutral-800">Outcome: {it.outcome}</p>}
            {it.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {it.images.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt={it.title} className="h-20 w-20 rounded object-cover" />
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
