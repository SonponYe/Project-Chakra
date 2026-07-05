"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { statsTrackRecordDataSchema, type StatsTrackRecordData } from "@/lib/modules/schemas";

type Stat = StatsTrackRecordData["stats"][number];

export default function StatsTrackRecordAdminForm({
  workerId,
  initialData,
}: {
  workerId: string;
  initialData: unknown;
}) {
  const parsed = statsTrackRecordDataSchema.safeParse(initialData);
  const [stats, setStats] = useState<Stat[]>(parsed.success ? parsed.data.stats : []);
  const [summary, setSummary] = useState(parsed.success ? parsed.data.summary ?? "" : "");
  const [disclaimer, setDisclaimer] = useState(parsed.success ? parsed.data.disclaimer : false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function update(index: number, patch: Partial<Stat>) {
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function remove(index: number) {
    setStats((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await saveWorkerModuleDataAction({
      workerId,
      moduleKey: "stats_track_record",
      data: { stats, summary, disclaimer },
    });
    setSaving(false);
    setMessage(result.ok ? "Saved." : result.error);
  }

  return (
    <div className="flex flex-col gap-3">
      {stats.map((s, i) => (
        <div key={i} className="grid grid-cols-3 gap-2 rounded-md border border-neutral-200 bg-white p-3">
          <input
            placeholder="Label"
            value={s.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <input
            placeholder="Value"
            value={s.value}
            onChange={(e) => update(i, { value: e.target.value })}
            className="rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <div className="flex items-center gap-2">
            <input
              placeholder="As of (optional)"
              value={s.asOfDate ?? ""}
              onChange={(e) => update(i, { asOfDate: e.target.value })}
              className="w-full rounded border border-neutral-200 px-2 py-1 text-sm"
            />
            <button type="button" onClick={() => remove(i)} className="text-red-600">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setStats((prev) => [...prev, { label: "", value: "" }])}
        className="flex items-center gap-1 self-start rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
      >
        <Plus size={14} /> Add stat
      </button>

      <textarea
        placeholder="Summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={4}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" checked={disclaimer} onChange={(e) => setDisclaimer(e.target.checked)} />
        Show &quot;not verified investment advice&quot; disclaimer
      </label>

      {message && <p className="text-sm text-neutral-600">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save stats"}
      </button>
    </div>
  );
}
