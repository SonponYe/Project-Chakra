"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { offeringListDataSchema, type OfferingListData } from "@/lib/modules/schemas";

type Offering = OfferingListData["offerings"][number];

const BLANK: Offering = { name: "", offeringType: "service" };

export default function OfferingListAdminForm({
  workerId,
  initialData,
}: {
  workerId: string;
  initialData: unknown;
}) {
  const parsed = offeringListDataSchema.safeParse(initialData);
  const [offerings, setOfferings] = useState<Offering[]>(parsed.success ? parsed.data.offerings : []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update(index: number, patch: Partial<Offering>) {
    setOfferings((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function remove(index: number) {
    setOfferings((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveWorkerModuleDataAction({
      workerId,
      moduleKey: "offering_list",
      data: { offerings },
    });
    setSaving(false);
    setMessage(result.ok ? "Saved." : result.error);
  }

  return (
    <div className="flex flex-col gap-3">
      {offerings.map((o, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-md border border-neutral-200 bg-white p-3 sm:grid-cols-6">
          <input
            placeholder="Name"
            value={o.name}
            onChange={(e) => update(i, { name: e.target.value })}
            className="col-span-2 rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <input
            placeholder="Description"
            value={o.description ?? ""}
            onChange={(e) => update(i, { description: e.target.value })}
            className="col-span-2 rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <input
            placeholder="Price"
            type="number"
            value={o.price ?? ""}
            onChange={(e) => update(i, { price: e.target.value ? Number(e.target.value) : undefined })}
            className="rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <input
            placeholder="Unit"
            value={o.unit ?? ""}
            onChange={(e) => update(i, { unit: e.target.value })}
            className="rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <select
            value={o.offeringType}
            onChange={(e) => update(i, { offeringType: e.target.value as Offering["offeringType"] })}
            className="rounded border border-neutral-200 px-2 py-1 text-sm"
          >
            <option value="service">Service</option>
            <option value="product">Product</option>
          </select>
          <input
            placeholder="Lead time (days)"
            type="number"
            value={o.leadTimeDays ?? ""}
            onChange={(e) =>
              update(i, { leadTimeDays: e.target.value ? Number(e.target.value) : undefined })
            }
            className="rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <button type="button" onClick={() => remove(i)} className="flex items-center gap-1 text-xs text-red-600">
            <Trash2 size={12} /> Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setOfferings((prev) => [...prev, { ...BLANK }])}
        className="flex items-center gap-1 self-start rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
      >
        <Plus size={14} /> Add offering
      </button>

      {message && <p className="text-sm text-neutral-600">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save offerings"}
      </button>
    </div>
  );
}
