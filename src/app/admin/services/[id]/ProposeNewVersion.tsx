"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModuleChecklist from "../ModuleChecklist";
import { createServiceTypeVersionAction } from "../actions";
import type { ModuleKey } from "@/lib/supabase/database.types";
import type { CustomFieldDefinition } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";

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
      <button type="button" onClick={() => setEditing(true)} className={btnClass("ghost", "sm")}>
        Propose a new version
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-hairline bg-surface p-5">
      <p className="text-[12.5px] text-muted">
        Existing workers keep whatever data they already saved. New/removed modules only affect
        new saves going forward.
      </p>
      <ModuleChecklist
        selected={moduleKeys}
        onChange={setModuleKeys}
        customFieldDefinitions={customFieldDefinitions}
        onCustomFieldDefinitionsChange={setCustomFieldDefinitions}
      />
      {message && <p className="text-[13px] text-muted">{message}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={saving} className={btnClass("solid", "md")}>
          {saving ? "Saving…" : "Publish new version"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className={btnClass("ghost", "md")}>
          Cancel
        </button>
      </div>
    </div>
  );
}
