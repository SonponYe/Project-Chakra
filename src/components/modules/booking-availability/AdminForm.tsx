"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import {
  saveWorkerModuleDataAction,
  setWorkerAvailabilityAction,
  addBlockedDateAction,
  removeBlockedDateAction,
} from "@/app/dashboard/actions";
import { bookingAvailabilityDataSchema } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";
import { FIELD, FIELD_SM } from "@/components/ui/card";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AvailabilityRow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function BookingAvailabilityAdminForm({
  workerId,
  initialData,
  initialAvailability,
  initialBlockedDates,
}: {
  workerId: string;
  initialData: unknown;
  initialAvailability: AvailabilityRow[];
  initialBlockedDates: { id: string; blockedDate: string }[];
}) {
  const parsed = bookingAvailabilityDataSchema.safeParse(initialData);
  const [slotDuration, setSlotDuration] = useState(parsed.success ? parsed.data.slotDurationMinutes : 60);
  const [note, setNote] = useState(parsed.success ? parsed.data.note ?? "" : "");
  const [blocks, setBlocks] = useState<AvailabilityRow[]>(initialAvailability);
  const [blockedDates, setBlockedDates] = useState(initialBlockedDates);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateBlock(index: number, patch: Partial<AvailabilityRow>) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  async function handleSaveAll() {
    setSaving(true);
    setMessage(null);

    const settingsResult = await saveWorkerModuleDataAction({
      workerId,
      moduleKey: "booking_availability",
      data: { slotDurationMinutes: slotDuration, note },
    });
    if (!settingsResult.ok) {
      setSaving(false);
      setMessage(settingsResult.error);
      return;
    }

    const availResult = await setWorkerAvailabilityAction({ workerId, blocks });
    setSaving(false);
    setMessage(availResult.ok ? "Saved." : availResult.error);
  }

  async function handleAddBlockedDate() {
    if (!newBlockedDate) return;
    const result = await addBlockedDateAction({ workerId, date: newBlockedDate });
    if (result.ok) {
      setBlockedDates((prev) => [...prev, { id: crypto.randomUUID(), blockedDate: newBlockedDate }]);
      setNewBlockedDate("");
    } else {
      setMessage(result.error);
    }
  }

  async function handleRemoveBlockedDate(id: string) {
    const result = await removeBlockedDateAction({ id });
    if (result.ok) setBlockedDates((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted">Slot duration (minutes)</label>
        <input
          type="number"
          value={slotDuration}
          onChange={(e) => setSlotDuration(Number(e.target.value))}
          className={`mt-1.5 w-32 ${FIELD_SM}`}
        />
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Weekly availability</p>
        <div className="mt-2.5 flex flex-col gap-2">
          {blocks.map((b, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-emerald" />
              <select
                value={b.dayOfWeek}
                onChange={(e) => updateBlock(i, { dayOfWeek: Number(e.target.value) })}
                className={FIELD_SM}
              >
                {DAY_LABELS.map((d, idx) => (
                  <option key={idx} value={idx}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={b.startTime.slice(0, 5)}
                onChange={(e) => updateBlock(i, { startTime: e.target.value })}
                className={FIELD_SM}
              />
              <span className="text-muted">to</span>
              <input
                type="time"
                value={b.endTime.slice(0, 5)}
                onChange={(e) => updateBlock(i, { endTime: e.target.value })}
                className={FIELD_SM}
              />
              <button
                type="button"
                onClick={() => setBlocks((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-red-400 transition-colors hover:text-red-300"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setBlocks((prev) => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }])}
            className={`${btnClass("ghost", "sm")} self-start`}
          >
            <Plus size={14} /> Add weekly block
          </button>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Blocked dates</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {blockedDates.map((d) => (
            <span
              key={d.id}
              className="flex items-center gap-1.5 rounded-full border border-hairline bg-elevated px-3 py-1 text-xs text-ink"
            >
              {d.blockedDate}
              <button type="button" onClick={() => handleRemoveBlockedDate(d.id)} className="text-muted hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2.5 flex gap-2">
          <input
            type="date"
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            className={FIELD_SM}
          />
          <button type="button" onClick={handleAddBlockedDate} className={btnClass("ghost", "sm")}>
            Block date
          </button>
        </div>
      </div>

      <textarea
        placeholder="Note shown to visitors (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className={FIELD}
      />

      {message && <p className="text-[13px] text-muted">{message}</p>}

      <button type="button" onClick={handleSaveAll} disabled={saving} className={`${btnClass("solid", "md")} self-start`}>
        {saving ? "Saving…" : "Save availability"}
      </button>
    </div>
  );
}
