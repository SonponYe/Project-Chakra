"use client";

import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadWorkerImage } from "@/lib/upload";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { galleryDataSchema, type GalleryData } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";

export default function GalleryAdminForm({
  workerId,
  initialData,
}: {
  workerId: string;
  initialData: unknown;
}) {
  const parsed = galleryDataSchema.safeParse(initialData);
  const [images, setImages] = useState<GalleryData["images"]>(parsed.success ? parsed.data.images : []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const url = await uploadWorkerImage(supabase, workerId, "gallery", file);
      setImages((prev) => [...prev, { url }]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function updateImage(index: number, patch: Partial<GalleryData["images"][number]>) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveWorkerModuleDataAction({
      workerId,
      moduleKey: "gallery",
      data: { images },
    });
    setSaving(false);
    setMessage(result.ok ? "Saved." : result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <div key={img.url} className="rounded-md border border-hairline bg-elevated p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption ?? ""} className="h-24 w-full rounded object-cover" />
            <input
              type="text"
              placeholder="Caption"
              value={img.caption ?? ""}
              onChange={(e) => updateImage(i, { caption: e.target.value })}
              className="mt-2 w-full rounded border border-hairline bg-surface px-2 py-1 text-xs text-ink placeholder:text-muted/70 focus:border-emerald focus:outline-none"
            />
            <label className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={img.isBeforeAfter ?? false}
                onChange={(e) => updateImage(i, { isBeforeAfter: e.target.checked })}
              />
              Before/after
            </label>
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="mt-1.5 flex items-center gap-1 text-xs text-red-400 transition-colors hover:text-red-300"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        ))}
      </div>

      <label className={`${btnClass("ghost", "sm")} w-fit cursor-pointer`}>
        <Upload size={13} />
        {uploading ? "Uploading…" : "Add photo"}
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="hidden" />
      </label>

      {message && <p className="text-[13px] text-muted">{message}</p>}

      <button type="button" onClick={handleSave} disabled={saving} className={`${btnClass("solid", "md")} self-start`}>
        {saving ? "Saving…" : "Save gallery"}
      </button>
    </div>
  );
}
