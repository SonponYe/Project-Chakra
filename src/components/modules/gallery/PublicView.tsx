"use client";

import { motion } from "framer-motion";
import { galleryDataSchema } from "@/lib/modules/schemas";

export default function GalleryPublicView({ data }: { data: unknown }) {
  const parsed = galleryDataSchema.safeParse(data);
  if (!parsed.success || parsed.data.images.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {parsed.data.images.map((img, i) => (
        <motion.figure
          key={img.url}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.03, duration: 0.5 }}
          className="overflow-hidden rounded-md border border-hairline bg-elevated"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.caption ?? ""} className="aspect-[4/5] w-full object-cover" />
          {img.caption && <figcaption className="px-2.5 py-2 text-[12px] text-muted">{img.caption}</figcaption>}
        </motion.figure>
      ))}
    </div>
  );
}
