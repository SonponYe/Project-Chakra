"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModuleChecklist from "../ModuleChecklist";
import { updateServiceTypeDraftModulesAction } from "../actions";
import type { ModuleKey } from "@/lib/supabase/database.types";
import type { CustomFieldDefinition } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";

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

      {error && <p className="text-[13px] text-red-400">{error}</p>}
      {saved && <p className="text-[13px] text-emerald">Saved.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || moduleKeys.length === 0}
        className={`${btnClass("solid", "md")} self-start`}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
