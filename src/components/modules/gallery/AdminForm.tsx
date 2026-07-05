"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadWorkerImage } from "@/lib/upload";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { galleryDataSchema, type GalleryData } from "@/lib/modules/schemas";

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
          <div key={img.url} className="rounded-md border border-neutral-200 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption ?? ""} className="h-24 w-full rounded object-cover" />
            <input
              type="text"
              placeholder="Caption"
              value={img.caption ?? ""}
              onChange={(e) => updateImage(i, { caption: e.target.value })}
              className="mt-2 w-full rounded border border-neutral-200 px-2 py-1 text-xs"
            />
            <label className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
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
              className="mt-1 flex items-center gap-1 text-xs text-red-600"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        ))}
      </div>

      <div>
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        {uploading && <p className="text-xs text-neutral-500">Uploading…</p>}
      </div>

      {message && <p className="text-sm text-neutral-600">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save gallery"}
      </button>
    </div>
  );
}
