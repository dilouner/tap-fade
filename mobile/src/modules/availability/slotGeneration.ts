import { addMinutes, format } from 'date-fns';
import { TZDate } from '@date-fns/tz';

import type { Appointment } from '../appointments/types';
import type { AvailabilityBlock } from './types';

function minutes(value: string) {
  const [hours, mins] = value.split(':').map(Number);
  return hours * 60 + mins;
}

function dateAtMinutes(date: Date, value: number, timezone: string) {
  return new TZDate(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(value / 60), value % 60, 0, 0, timezone);
}

export function getAvailableSlots({ appointments, availability, barberId, date, durationMinutes, occupiedSlots = [], now = new Date(), timezone = 'America/Chihuahua' }: {
  appointments?: Appointment[];
  occupiedSlots?: Date[];
  availability: AvailabilityBlock[];
  barberId: string;
  date: Date;
  durationMinutes: number;
  now?: Date;
  timezone?: string;
}) {
  const weekday = new TZDate(date.getFullYear(), date.getMonth(), date.getDate(), 12, timezone).getDay();
  const dateKey = format(date, 'yyyy-MM-dd');
  const weekly = availability.filter((block) => block.barberId === barberId && !block.blocked && (block.kind === 'weekly' ? block.dayOfWeek === weekday : block.date === dateKey));
  const blocks = availability.filter((block) => block.barberId === barberId && block.blocked && (block.kind === 'weekly' ? block.dayOfWeek === weekday : block.date === dateKey));
  const active = (appointments ?? []).filter((appointment) => appointment.barberId === barberId && ['pending', 'confirmed'].includes(appointment.status));
  const slots: Date[] = [];

  for (const interval of weekly) {
    for (let cursor = minutes(interval.startTime); cursor + durationMinutes <= minutes(interval.endTime); cursor += 15) {
      const startAt = dateAtMinutes(date, cursor, timezone);
      const endAt = addMinutes(startAt, durationMinutes);
      if (startAt < addMinutes(now, 60)) continue;
      const blocked = blocks.some((block) => startAt < dateAtMinutes(date, minutes(block.endTime), timezone) && dateAtMinutes(date, minutes(block.startTime), timezone) < endAt);
      const occupied = active.some((appointment) => startAt < appointment.endAt && appointment.startAt < endAt);
      const locked = occupiedSlots.some((slot) => slot >= startAt && slot < endAt);
      if (!blocked && !occupied && !locked) slots.push(startAt);
    }
  }
  return [...new Map(slots.map((slot) => [slot.getTime(), slot])).values()].sort((left, right) => left.getTime() - right.getTime());
}
