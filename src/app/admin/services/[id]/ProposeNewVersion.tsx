"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModuleChecklist from "../ModuleChecklist";
import { createServiceTypeVersionAction } from "../actions";
import type { ModuleKey } from "@/lib/supabase/database.types";
import type { CustomFieldDefinition } from "@/lib/modules/schemas";

export default function ProposeNewVersion({
  serviceTypeId,
  currentModuleKeys,
  currentCustomFieldDefinitions,
}: {
  serviceTypeId: string;
  currentModuleKeys: ModuleKey[];
  currentCustomFieldDefinitions: CustomFieldDefinition[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [moduleKeys, setModuleKeys] = useState<ModuleKey[]>(currentModuleKeys);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>(
    currentCustomFieldDefinitions
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await createServiceTypeVersionAction({
      serviceTypeId,
      moduleKeys,
      customFieldDefinitions,
    });
    setSaving(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage("New version is now live for new saves. Existing workers keep their current data.");
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
      >
        Propose a new version
      </button>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs text-neutral-500">
        Existing workers keep whatever data they already saved. New/removed modules only affect
        new saves going forward.
      </p>
      <ModuleChecklist
        selected={moduleKeys}
        onChange={setModuleKeys}
        customFieldDefinitions={customFieldDefinitions}
        onCustomFieldDefinitionsChange={setCustomFieldDefinitions}
      />
      {message && <p className="text-sm text-neutral-600">{message}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Publish new version"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
