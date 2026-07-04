"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModuleChecklist from "../ModuleChecklist";
import { updateServiceTypeDraftModulesAction } from "../actions";
import type { ModuleKey } from "@/lib/supabase/database.types";

export default function EditDraftModules({
  serviceTypeId,
  initialModuleKeys,
}: {
  serviceTypeId: string;
  initialModuleKeys: ModuleKey[];
}) {
  const router = useRouter();
  const [moduleKeys, setModuleKeys] = useState<ModuleKey[]>(initialModuleKeys);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateServiceTypeDraftModulesAction({ serviceTypeId, moduleKeys });

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
      <ModuleChecklist selected={moduleKeys} onChange={setModuleKeys} />

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
