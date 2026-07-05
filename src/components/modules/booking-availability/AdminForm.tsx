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
    <div className="flex flex-col gap-5">
      <div>
        <label className="text-sm font-medium text-neutral-700">Slot duration (minutes)</label>
        <input
          type="number"
          value={slotDuration}
          onChange={(e) => setSlotDuration(Number(e.target.value))}
          className="mt-1 w-32 rounded border border-neutral-200 px-2 py-1 text-sm"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-700">Weekly availability</p>
        <div className="mt-2 flex flex-col gap-2">
          {blocks.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={b.dayOfWeek}
                onChange={(e) => updateBlock(i, { dayOfWeek: Number(e.target.value) })}
                className="rounded border border-neutral-200 px-2 py-1 text-sm"
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
                className="rounded border border-neutral-200 px-2 py-1 text-sm"
              />
              <span className="text-neutral-400">to</span>
              <input
                type="time"
                value={b.endTime.slice(0, 5)}
                onChange={(e) => updateBlock(i, { endTime: e.target.value })}
                className="rounded border border-neutral-200 px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => setBlocks((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setBlocks((prev) => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }])}
            className="flex items-center gap-1 self-start rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
          >
            <Plus size={14} /> Add weekly block
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-neutral-700">Blocked dates</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {blockedDates.map((d) => (
            <span
              key={d.id}
              className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs"
            >
              {d.blockedDate}
              <button type="button" onClick={() => handleRemoveBlockedDate(d.id)}>
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="date"
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            className="rounded border border-neutral-200 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleAddBlockedDate}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50"
          >
            Block date
          </button>
        </div>
      </div>

      <textarea
        placeholder="Note shown to visitors (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
      />

      {message && <p className="text-sm text-neutral-600">{message}</p>}

      <button
        type="button"
        onClick={handleSaveAll}
        disabled={saving}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save availability"}
      </button>
    </div>
  );
}
