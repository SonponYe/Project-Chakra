"use client";

import { motion } from "framer-motion";
import { statsTrackRecordDataSchema } from "@/lib/modules/schemas";

export default function StatsTrackRecordPublicView({ data }: { data: unknown }) {
  const parsed = statsTrackRecordDataSchema.safeParse(data);
  if (!parsed.success) return null;
  const { stats, summary, disclaimer } = parsed.data;
  if (stats.length === 0 && !summary) return null;

  return (
    <div>
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03, duration: 0.4 }}
              className="rounded-md border border-hairline bg-elevated p-4 text-center"
            >
              <p className="font-display text-xl tabular-nums">{s.value}</p>
              <p className="mt-1 text-[12px] text-muted">{s.label}</p>
              {s.asOfDate && <p className="mt-0.5 text-[10px] text-muted/70">as of {s.asOfDate}</p>}
            </motion.div>
          ))}
        </div>
      )}
      {summary && <p className="mt-6 max-w-[60ch] text-[14.5px] leading-relaxed text-ink/90">{summary}</p>}
      {disclaimer && (
        <p className="mt-3 text-[12px] italic text-muted/80">
          Not verified investment advice. Past performance does not guarantee future results.
        </p>
      )}
    </div>
  );
}
