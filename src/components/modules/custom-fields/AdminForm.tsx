"use client";

import { useState } from "react";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { customFieldsDataSchema, type CustomFieldDefinition } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";
import { FIELD_SM } from "@/components/ui/card";

export default function CustomFieldsAdminForm({
  workerId,
  initialData,
  fieldDefinitions,
}: {
  workerId: string;
  initialData: unknown;
  fieldDefinitions: CustomFieldDefinition[];
}) {
  const parsed = customFieldsDataSchema.safeParse(initialData);
  const [values, setValues] = useState<Record<string, string>>(parsed.success ? parsed.data.values : {});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveWorkerModuleDataAction({
      workerId,
      moduleKey: "custom_fields",
      data: { values },
    });
    setSaving(false);
    setMessage(result.ok ? "Saved." : result.error);
  }

  if (fieldDefinitions.length === 0) {
    return <p className="text-[13px] text-muted">No custom fields have been defined for this service type yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {fieldDefinitions.map((f) => (
        <div key={f.key}>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">{f.label}</label>
          {f.fieldType === "textarea" ? (
            <textarea
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              rows={3}
              className={`mt-1.5 w-full ${FIELD_SM}`}
            />
          ) : (
            <input
              type={f.fieldType === "number" ? "number" : f.fieldType === "url" ? "url" : "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className={`mt-1.5 w-full ${FIELD_SM}`}
            />
          )}
        </div>
      ))}

      {message && <p className="text-[13px] text-muted">{message}</p>}

      <button type="button" onClick={handleSave} disabled={saving} className={`${btnClass("solid", "md")} self-start`}>
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
