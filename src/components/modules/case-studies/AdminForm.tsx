"use client";

import { useState } from "react";
import { Trash2, Plus, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadWorkerImage } from "@/lib/upload";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { caseStudiesDataSchema, type CaseStudiesData } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";
import { CARD, FIELD_SM } from "@/components/ui/card";

type CaseStudy = CaseStudiesData["items"][number];
const BLANK: CaseStudy = { title: "", images: [] };

export default function CaseStudiesAdminForm({
  workerId,
  initialData,
}: {
  workerId: string;
  initialData: unknown;
}) {
  const parsed = caseStudiesDataSchema.safeParse(initialData);
  const [items, setItems] = useState<CaseStudy[]>(parsed.success ? parsed.data.items : []);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update(index: number, patch: Partial<CaseStudy>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function remove(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(index: number, file: File) {
    setUploadingIndex(index);
    try {
      const supabase = createClient();
      const url = await uploadWorkerImage(supabase, workerId, "case_studies", file);
      update(index, { images: [...items[index].images, url] });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingIndex(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveWorkerModuleDataAction({
      workerId,
      moduleKey: "case_studies",
      data: { items },
    });
    setSaving(false);
    setMessage(result.ok ? "Saved." : result.error);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={i} className={`${CARD} flex flex-col gap-2`}>
          <input
            placeholder="Title"
            value={it.title}
            onChange={(e) => update(i, { title: e.target.value })}
            className={FIELD_SM}
          />
          <textarea
            placeholder="Description"
            value={it.description ?? ""}
            onChange={(e) => update(i, { description: e.target.value })}
            rows={2}
            className={FIELD_SM}
          />
          <input
            placeholder="Outcome"
            value={it.outcome ?? ""}
            onChange={(e) => update(i, { outcome: e.target.value })}
            className={FIELD_SM}
          />
          {it.images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {it.images.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="h-16 w-16 rounded object-cover" />
              ))}
            </div>
          )}
          <label className={`${btnClass("ghost", "sm")} w-fit cursor-pointer`}>
            <Upload size={12} />
            {uploadingIndex === i ? "Uploading…" : "Add photo"}
            <input
              type="file"
              accept="image/*"
              disabled={uploadingIndex === i}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleImageUpload(i, file);
              }}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => remove(i)}
            className="flex items-center gap-1 self-start text-xs text-red-400 transition-colors hover:text-red-300"
          >
            <Trash2 size={12} /> Remove case study
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, { ...BLANK }])}
        className={`${btnClass("ghost", "sm")} self-start`}
      >
        <Plus size={14} /> Add case study
      </button>

      {message && <p className="text-[13px] text-muted">{message}</p>}

      <button type="button" onClick={handleSave} disabled={saving} className={`${btnClass("solid", "md")} self-start`}>
        {saving ? "Saving…" : "Save case studies"}
      </button>
    </div>
  );
}
