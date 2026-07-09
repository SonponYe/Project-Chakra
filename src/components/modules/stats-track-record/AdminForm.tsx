"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { saveWorkerModuleDataAction } from "@/app/dashboard/actions";
import { statsTrackRecordDataSchema, type StatsTrackRecordData } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";
import { CARD, FIELD, FIELD_SM } from "@/components/ui/card";

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
        <div key={i} className={`${CARD} grid grid-cols-3 gap-2`}>
          <input
            placeholder="Label"
            value={s.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className={FIELD_SM}
          />
          <input
            placeholder="Value"
            value={s.value}
            onChange={(e) => update(i, { value: e.target.value })}
            className={FIELD_SM}
          />
          <div className="flex items-center gap-2">
            <input
              placeholder="As of (optional)"
              value={s.asOfDate ?? ""}
              onChange={(e) => update(i, { asOfDate: e.target.value })}
              className={`w-full ${FIELD_SM}`}
            />
            <button type="button" onClick={() => remove(i)} className="text-red-400 transition-colors hover:text-red-300">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setStats((prev) => [...prev, { label: "", value: "" }])}
        className={`${btnClass("ghost", "sm")} self-start`}
      >
        <Plus size={14} /> Add stat
      </button>

      <textarea
        placeholder="Summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={4}
        className={FIELD}
      />

      <label className="flex items-center gap-2 text-[13px] text-muted">
        <input type="checkbox" checked={disclaimer} onChange={(e) => setDisclaimer(e.target.checked)} />
        Show &quot;not verified investment advice&quot; disclaimer
      </label>

      {message && <p className="text-[13px] text-muted">{message}</p>}

      <button type="button" onClick={handleSave} disabled={saving} className={`${btnClass("solid", "md")} self-start`}>
        {saving ? "Saving…" : "Save stats"}
      </button>
    </div>
  );
}
