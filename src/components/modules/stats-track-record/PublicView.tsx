"use client";

import { motion } from "framer-motion";
import { statsTrackRecordDataSchema } from "@/lib/modules/schemas";

export default function StatsTrackRecordPublicView({ data }: { data: unknown }) {
  const parsed = statsTrackRecordDataSchema.safeParse(data);
  if (!parsed.success) return null;
  const { stats, summary, disclaimer } = parsed.data;
  if (stats.length === 0 && !summary) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Track record</h2>
      {stats.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="rounded-md border border-neutral-200 bg-white p-3 text-center"
            >
              <p className="text-lg font-semibold">{s.value}</p>
              <p className="text-xs text-neutral-500">{s.label}</p>
              {s.asOfDate && <p className="text-[10px] text-neutral-400">as of {s.asOfDate}</p>}
            </motion.div>
          ))}
        </div>
      )}
      {summary && <p className="mt-3 text-sm text-neutral-600">{summary}</p>}
      {disclaimer && (
        <p className="mt-2 text-xs italic text-neutral-400">
          Not verified investment advice. Past performance does not guarantee future results.
        </p>
      )}
    </section>
  );
}
