"use client";

import { useState } from "react";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { customFieldsDataSchema, type CustomFieldDefinition } from "@/lib/modules/schemas";

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
    return <p className="text-sm text-neutral-500">No custom fields have been defined for this service type yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {fieldDefinitions.map((f) => (
        <div key={f.key}>
          <label className="text-sm font-medium text-neutral-700">{f.label}</label>
          {f.fieldType === "textarea" ? (
            <textarea
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded border border-neutral-200 px-2 py-1 text-sm"
            />
          ) : (
            <input
              type={f.fieldType === "number" ? "number" : f.fieldType === "url" ? "url" : "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded border border-neutral-200 px-2 py-1 text-sm"
            />
          )}
        </div>
      ))}

      {message && <p className="text-sm text-neutral-600">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
