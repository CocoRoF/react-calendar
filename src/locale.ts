import { addDays, endOfMonth, startOfMonth } from "./date-utils";

export interface RangePreset {
  label: string;
  /** Receives today, returns the [from, to] it selects. A single-date preset returns the same day twice. */
  range: (today: Date) => [Date, Date];
}

export interface CalendarLocale {
  /** Weekday labels starting at Sunday. */
  weekdays: string[];
  /** Month heading, e.g. `2026년 9월` / `September 2026`. */
  monthLabel: (date: Date) => string;
  /** Trigger/label formatting. */
  formatDate: (date: Date) => string;
  formatDateTime: (date: Date) => string;
  rangePresets: RangePreset[];
  singlePresets: RangePreset[];
  labels: {
    prevMonth: string; nextMonth: string; clear: string; today: string; apply: string;
    selectDate: string; selectRange: string; start: string; end: string; time: string;
    hour: string; minute: string;
  };
}

const lastDay = (t: Date, months: number): Date => endOfMonth(new Date(t.getFullYear(), t.getMonth() + months, 1));

export const ko: CalendarLocale = {
  weekdays: ["일", "월", "화", "수", "목", "금", "토"],
  monthLabel: (d) => `${d.getFullYear()}년 ${d.getMonth() + 1}월`,
  formatDate: (d) => `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`,
  formatDateTime: (d) =>
    `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  rangePresets: [
    { label: "오늘", range: (t) => [t, t] },
    { label: "어제", range: (t) => [addDays(t, -1), addDays(t, -1)] },
    { label: "최근 7일", range: (t) => [addDays(t, -6), t] },
    { label: "최근 30일", range: (t) => [addDays(t, -29), t] },
    { label: "최근 90일", range: (t) => [addDays(t, -89), t] },
    { label: "이번 달", range: (t) => [startOfMonth(t), endOfMonth(t)] },
    { label: "지난 달", range: (t) => [startOfMonth(new Date(t.getFullYear(), t.getMonth() - 1, 1)), lastDay(t, -1)] },
    { label: "올해", range: (t) => [new Date(t.getFullYear(), 0, 1), new Date(t.getFullYear(), 11, 31)] },
  ],
  singlePresets: [
    { label: "오늘", range: (t) => [t, t] },
    { label: "내일", range: (t) => [addDays(t, 1), addDays(t, 1)] },
    { label: "7일 후", range: (t) => [addDays(t, 7), addDays(t, 7)] },
    { label: "30일 후", range: (t) => [addDays(t, 30), addDays(t, 30)] },
    { label: "90일 후", range: (t) => [addDays(t, 90), addDays(t, 90)] },
  ],
  labels: {
    prevMonth: "이전 달", nextMonth: "다음 달", clear: "초기화", today: "오늘", apply: "적용",
    selectDate: "날짜 선택", selectRange: "기간 선택", start: "시작일", end: "종료일", time: "시각",
    hour: "시", minute: "분",
  },
};

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const en: CalendarLocale = {
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  monthLabel: (d) => `${MONTHS_EN[d.getMonth()]} ${d.getFullYear()}`,
  formatDate: (d) => `${MONTHS_EN[d.getMonth()]?.slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`,
  formatDateTime: (d) =>
    `${MONTHS_EN[d.getMonth()]?.slice(0, 3)} ${d.getDate()}, ${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  rangePresets: [
    { label: "Today", range: (t) => [t, t] },
    { label: "Yesterday", range: (t) => [addDays(t, -1), addDays(t, -1)] },
    { label: "Last 7 days", range: (t) => [addDays(t, -6), t] },
    { label: "Last 30 days", range: (t) => [addDays(t, -29), t] },
    { label: "Last 90 days", range: (t) => [addDays(t, -89), t] },
    { label: "This month", range: (t) => [startOfMonth(t), endOfMonth(t)] },
    { label: "Last month", range: (t) => [startOfMonth(new Date(t.getFullYear(), t.getMonth() - 1, 1)), lastDay(t, -1)] },
    { label: "This year", range: (t) => [new Date(t.getFullYear(), 0, 1), new Date(t.getFullYear(), 11, 31)] },
  ],
  singlePresets: [
    { label: "Today", range: (t) => [t, t] },
    { label: "Tomorrow", range: (t) => [addDays(t, 1), addDays(t, 1)] },
    { label: "In 7 days", range: (t) => [addDays(t, 7), addDays(t, 7)] },
    { label: "In 30 days", range: (t) => [addDays(t, 30), addDays(t, 30)] },
    { label: "In 90 days", range: (t) => [addDays(t, 90), addDays(t, 90)] },
  ],
  labels: {
    prevMonth: "Previous month", nextMonth: "Next month", clear: "Clear", today: "Today", apply: "Apply",
    selectDate: "Select date", selectRange: "Select range", start: "Start", end: "End", time: "Time",
    hour: "Hour", minute: "Minute",
  },
};

export const locales = { ko, en } as const;
export type LocaleName = keyof typeof locales;

export function resolveLocale(locale: LocaleName | CalendarLocale | undefined): CalendarLocale {
  if (!locale) return ko;
  return typeof locale === "string" ? locales[locale] ?? ko : locale;
}
