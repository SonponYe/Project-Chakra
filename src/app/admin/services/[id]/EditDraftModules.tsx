"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModuleChecklist from "../ModuleChecklist";
import { updateServiceTypeDraftModulesAction } from "../actions";
import type { ModuleKey } from "@/lib/supabase/database.types";
import type { CustomFieldDefinition } from "@/lib/modules/schemas";

export default function EditDraftModules({
  serviceTypeId,
  initialModuleKeys,
  initialCustomFieldDefinitions,
}: {
  serviceTypeId: string;
  initialModuleKeys: ModuleKey[];
  initialCustomFieldDefinitions: CustomFieldDefinition[];
}) {
  const router = useRouter();
  const [moduleKeys, setModuleKeys] = useState<ModuleKey[]>(initialModuleKeys);
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<CustomFieldDefinition[]>(
    initialCustomFieldDefinitions
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateServiceTypeDraftModulesAction({
      serviceTypeId,
      moduleKeys,
      customFieldDefinitions,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <ModuleChecklist
        selected={moduleKeys}
        onChange={setModuleKeys}
        customFieldDefinitions={customFieldDefinitions}
        onCustomFieldDefinitionsChange={setCustomFieldDefinitions}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || moduleKeys.length === 0}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
