/** Native `Date` helpers. Everything here works on local time and treats a day as a point,
 *  never a range — the calendar compares days, never timestamps. */

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return (
    !!a && !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
/** Day-granularity comparison: negative when a is earlier, 0 on the same day. */
export function diffDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);
}
export function clampDate(d: Date, min?: Date, max?: Date): Date {
  if (min && diffDays(d, min) < 0) return min;
  if (max && diffDays(d, max) > 0) return max;
  return d;
}
export function isDisabledDay(d: Date, min?: Date, max?: Date, isDisabled?: (day: Date) => boolean): boolean {
  if (min && diffDays(d, min) < 0) return true;
  if (max && diffDays(d, max) > 0) return true;
  return isDisabled ? isDisabled(d) : false;
}

/** The 6×7 grid a month is drawn on, including the leading/trailing days of its neighbours. */
export function monthGrid(month: Date, weekStartsOn: 0 | 1): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const gridStart = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

/** Copy the time of `time` onto the day of `day`. */
export function withTime(day: Date, time: Date | null | undefined): Date {
  const out = startOfDay(day);
  if (time) {
    out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  }
  return out;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `YYYY-MM-DD` in local time — the value an `<input type="date">` speaks. */
export function toISODate(d: Date | null | undefined): string {
  return d ? `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` : "";
}
/** `YYYY-MM-DDTHH:mm` in local time — the value an `<input type="datetime-local">` speaks. */
export function toISODateTime(d: Date | null | undefined): string {
  return d ? `${toISODate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}` : "";
}
/** Parses `YYYY-MM-DD` and `YYYY-MM-DDTHH:mm[:ss]` as **local** time.
 *  `new Date("2026-09-08")` would be UTC midnight, which is the previous day in Asia/Seoul. */
export function parseISO(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0), 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}
