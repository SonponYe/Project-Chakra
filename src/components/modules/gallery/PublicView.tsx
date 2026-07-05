"use client";

import { motion } from "framer-motion";
import { galleryDataSchema } from "@/lib/modules/schemas";

export default function GalleryPublicView({ data }: { data: unknown }) {
  const parsed = galleryDataSchema.safeParse(data);
  if (!parsed.success || parsed.data.images.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Gallery</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {parsed.data.images.map((img, i) => (
          <motion.figure
            key={img.url}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            className="overflow-hidden rounded-md border border-neutral-200 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption ?? ""} className="h-32 w-full object-cover" />
            {img.caption && <figcaption className="p-2 text-xs text-neutral-500">{img.caption}</figcaption>}
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
