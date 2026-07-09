"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { offeringListDataSchema, type OfferingListData } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";
import { CARD, FIELD_SM } from "@/components/ui/card";

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
        <div key={i} className={`${CARD} grid grid-cols-2 gap-2 sm:grid-cols-6`}>
          <input
            placeholder="Name"
            value={o.name}
            onChange={(e) => update(i, { name: e.target.value })}
            className={`col-span-2 ${FIELD_SM}`}
          />
          <input
            placeholder="Description"
            value={o.description ?? ""}
            onChange={(e) => update(i, { description: e.target.value })}
            className={`col-span-2 ${FIELD_SM}`}
          />
          <input
            placeholder="Price"
            type="number"
            value={o.price ?? ""}
            onChange={(e) => update(i, { price: e.target.value ? Number(e.target.value) : undefined })}
            className={FIELD_SM}
          />
          <input
            placeholder="Unit"
            value={o.unit ?? ""}
            onChange={(e) => update(i, { unit: e.target.value })}
            className={FIELD_SM}
          />
          <select
            value={o.offeringType}
            onChange={(e) => update(i, { offeringType: e.target.value as Offering["offeringType"] })}
            className={FIELD_SM}
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
            className={FIELD_SM}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="flex items-center gap-1 text-xs text-red-400 transition-colors hover:text-red-300"
          >
            <Trash2 size={12} /> Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setOfferings((prev) => [...prev, { ...BLANK }])}
        className={btnClass("ghost", "sm") + " self-start"}
      >
        <Plus size={14} /> Add offering
      </button>

      {message && <p className="text-[13px] text-muted">{message}</p>}

      <button type="button" onClick={handleSave} disabled={saving} className={`${btnClass("solid", "md")} self-start`}>
        {saving ? "Saving…" : "Save offerings"}
      </button>
    </div>
  );
}
