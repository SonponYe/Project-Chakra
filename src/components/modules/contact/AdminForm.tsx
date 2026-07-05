"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { contactDataSchema, type ContactData } from "@/lib/modules/schemas";

export default function ContactAdminForm({
  workerId,
  initialData,
}: {
  workerId: string;
  initialData: unknown;
}) {
  const parsed = contactDataSchema.safeParse(initialData);
  const base: ContactData = parsed.success
    ? parsed.data
    : { socials: [] };
  const [phone, setPhone] = useState(base.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(base.whatsapp ?? "");
  const [email, setEmail] = useState(base.email ?? "");
  const [location, setLocation] = useState(base.location ?? "");
  const [socials, setSocials] = useState<ContactData["socials"]>(base.socials);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateSocial(index: number, patch: Partial<ContactData["socials"][number]>) {
    setSocials((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveWorkerModuleDataAction({
      workerId,
      moduleKey: "contact",
      data: { phone, whatsapp, email, location, socials },
    });
    setSaving(false);
    setMessage(result.ok ? "Saved." : result.error);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded border border-neutral-200 px-2 py-1 text-sm"
      />
      <input
        placeholder="WhatsApp number"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        className="rounded border border-neutral-200 px-2 py-1 text-sm"
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded border border-neutral-200 px-2 py-1 text-sm"
      />
      <input
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="rounded border border-neutral-200 px-2 py-1 text-sm"
      />

      {socials.map((s, i) => (
        <div key={i} className="flex gap-2">
          <input
            placeholder="Label (e.g. Instagram)"
            value={s.label}
            onChange={(e) => updateSocial(i, { label: e.target.value })}
            className="w-1/3 rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <input
            placeholder="URL"
            value={s.url}
            onChange={(e) => updateSocial(i, { url: e.target.value })}
            className="flex-1 rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => setSocials((prev) => prev.filter((_, idx) => idx !== i))}
            className="text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setSocials((prev) => [...prev, { label: "", url: "" }])}
        className="flex items-center gap-1 self-start rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
      >
        <Plus size={14} /> Add social link
      </button>

      {message && <p className="text-sm text-neutral-600">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save contact"}
      </button>
    </div>
  );
}
