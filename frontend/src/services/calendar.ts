import type { Appointment } from "@/types/dashboard";
export function shiftDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function weekDates(date: string): string[] {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const monday = shiftDate(date, -((weekday + 6) % 7));
  return Array.from({ length: 6 }, (_, index) => shiftDate(monday, index));
}
export function timeMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

type AppointmentInterval = Pick<Appointment, "date" | "professional" | "time" | "durationMinutes"> & { id?: number };
export function appointmentsOverlap(a: AppointmentInterval, b: AppointmentInterval): boolean {
  return a.id !== b.id && a.date === b.date && a.professional === b.professional
    && timeMinutes(a.time) < timeMinutes(b.time) + (b.durationMinutes ?? 30)
    && timeMinutes(a.time) + (a.durationMinutes ?? 30) > timeMinutes(b.time);
}
export function appointmentEnd(appointment: Appointment): string {
  const minutes = timeMinutes(appointment.time) + (appointment.durationMinutes ?? 30);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function calendarLanes(appointments: Appointment[]): Record<number, { lane: number; count: number }> {
  const endTimes: number[] = [];
  const positions: Record<number, { lane: number; count: number }> = {};
  for (const appointment of [...appointments].sort((a,b) => timeMinutes(a.time)-timeMinutes(b.time) || a.id-b.id)) {
    const start = timeMinutes(appointment.time);
    let lane = endTimes.findIndex(end => end <= start);
    if (lane < 0) lane = endTimes.length;
    endTimes[lane] = start + (appointment.durationMinutes ?? 30);
    positions[appointment.id] = { lane, count: 0 };
  }
  for (const position of Object.values(positions)) position.count = endTimes.length;
  return positions;
}

