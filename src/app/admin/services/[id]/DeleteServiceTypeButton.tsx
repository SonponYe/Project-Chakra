"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteServiceTypeAction } from "../actions";
import { btnClass } from "@/components/ui/button";

export default function DeleteServiceTypeButton({ serviceTypeId, name }: { serviceTypeId: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setDeleting(true);
    setError(null);
    const result = await deleteServiceTypeAction(serviceTypeId);
    if (!result.ok) {
      setDeleting(false);
      setError(result.error);
      return;
    }
    router.push("/admin/services");
  }

  return (
    <div>
      <button type="button" onClick={handleDelete} disabled={deleting} className={btnClass("danger-ghost", "sm")}>
        <Trash2 size={13} />
        {deleting ? "Deleting…" : "Delete service type"}
      </button>
      {error && <p className="mt-1.5 text-[12px] text-red-400">{error}</p>}
    </div>
  );
}
