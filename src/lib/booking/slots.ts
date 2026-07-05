export interface AvailabilityBlock {
  dayOfWeek: number; // 0=Sunday, matches JS Date#getDay()
  startTime: string; // "HH:MM:SS" or "HH:MM"
  endTime: string;
}

export interface Slot {
  start: Date;
  end: Date;
}

const DAYS_AHEAD = 14;

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Expands weekly recurring availability into concrete upcoming slots,
// excluding blocked dates and slots an accepted booking already occupies.
export function computeAvailableSlots({
  availability,
  blockedDates,
  acceptedBookingSlots,
  slotDurationMinutes,
  now = new Date(),
}: {
  availability: AvailabilityBlock[];
  blockedDates: string[]; // "YYYY-MM-DD"
  acceptedBookingSlots: Date[];
  slotDurationMinutes: number;
  now?: Date;
}): Slot[] {
  const blocked = new Set(blockedDates);
  const taken = new Set(acceptedBookingSlots.map((d) => d.toISOString()));
  const slots: Slot[] = [];

  for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    const dateKey = day.toISOString().slice(0, 10);
    if (blocked.has(dateKey)) continue;

    const dayOfWeek = day.getDay();
    const blocksForDay = availability.filter((a) => a.dayOfWeek === dayOfWeek);

    for (const block of blocksForDay) {
      const startMin = parseTimeToMinutes(block.startTime);
      const endMin = parseTimeToMinutes(block.endTime);

      for (let t = startMin; t + slotDurationMinutes <= endMin; t += slotDurationMinutes) {
        const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, t);
        if (slotStart <= now) continue;
        if (taken.has(slotStart.toISOString())) continue;

        slots.push({ start: slotStart, end: new Date(slotStart.getTime() + slotDurationMinutes * 60000) });
      }
    }
  }

  return slots;
}
