/** Triggers + popover around {@link Calendar}. Three shapes, one panel:
 *  DatePicker (a day), DateRangePicker (a span), DateTimePicker (a day and a time). */
import React, { useEffect, useMemo, useState } from "react";
import { Calendar, type CalendarProps } from "./calendar";
import { Popover } from "./popover";
import { TimeColumn } from "./time-column";
import { clampDate, isSameDay, startOfDay, withTime } from "./date-utils";
import { type CalendarLocale, type LocaleName, resolveLocale } from "./locale";

type Shared = Pick<CalendarProps, "minDate" | "maxDate" | "isDayDisabled" | "numberOfMonths" | "showPresets" | "presets" | "weekStartsOn" | "today" | "renderDay">;

interface TriggerBits {
  /** Extra class for the portalled popover panel (theme class, width overrides). */
  panelClassName?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  width?: number | string;
  /** Stable DOM hook for tests and QA contracts. */
  uiId?: string;
  locale?: LocaleName | CalendarLocale;
  /** Show a clear button that sets the value back to null. */
  clearable?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
}

function CalendarGlyph(): React.ReactElement {
  return (
    <svg className="rcal-trigger-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3.5" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function Trigger({ text, empty, onClick, bits }: { text: string; empty: boolean; onClick: () => void; bits: TriggerBits }): React.ReactElement {
  return (
    <button
      type="button"
      id={bits.id}
      name={bits.name}
      aria-label={bits["aria-label"]}
      data-rcal-trigger=""
      data-ui-id={bits.uiId}
      disabled={bits.disabled}
      onClick={onClick}
      className={["rcal-trigger", empty ? "rcal-trigger-empty" : "", bits.className].filter(Boolean).join(" ")}
      style={{ width: bits.width ?? "100%" }}
    >
      <span className="rcal-trigger-text">{text}</span>
      <CalendarGlyph />
    </button>
  );
}

/* ── single date ─────────────────────────────────────────────── */

export interface DatePickerProps extends Shared, TriggerBits {
  value: Date | null;
  onChange: (value: Date | null) => void;
  format?: (d: Date) => string;
}

export function DatePicker({ value, onChange, format, ...rest }: DatePickerProps): React.ReactElement {
  const L = resolveLocale(rest.locale);
  const [open, setOpen] = useState(false);
  const text = value ? (format ?? L.formatDate)(value) : (rest.placeholder ?? L.labels.selectDate);
  return (
    <Popover open={open} onOpenChange={(o) => !rest.disabled && setOpen(o)} panelClassName={rest.panelClassName}
      trigger={<Trigger text={text} empty={!value} onClick={() => !rest.disabled && setOpen((o) => !o)} bits={rest} />}>
      <Calendar
        mode="single" from={value} to={value} autoFocus
        onChange={(f, t) => { const picked = t ?? f; if (picked) { onChange(picked); setOpen(false); } }}
        minDate={rest.minDate} maxDate={rest.maxDate} isDayDisabled={rest.isDayDisabled}
        numberOfMonths={rest.numberOfMonths} showPresets={rest.showPresets} presets={rest.presets}
        weekStartsOn={rest.weekStartsOn} today={rest.today} locale={rest.locale} renderDay={rest.renderDay}
      />
      {rest.clearable ? (
        <div className="rcal-footer">
          <span className="rcal-footer-value">{value ? (format ?? L.formatDate)(value) : ""}</span>
          <button type="button" className="rcal-footer-btn" onClick={() => { onChange(null); setOpen(false); }}>{L.labels.clear}</button>
        </div>
      ) : null}
    </Popover>
  );
}

/* ── range ───────────────────────────────────────────────────── */

export interface DateRangePickerProps extends Shared, TriggerBits {
  value: [Date | null, Date | null];
  onChange: (value: [Date | null, Date | null]) => void;
  format?: (d: Date) => string;
}

export function DateRangePicker({ value, onChange, format, ...rest }: DateRangePickerProps): React.ReactElement {
  const L = resolveLocale(rest.locale);
  const [from, to] = value;
  const [open, setOpen] = useState(false);
  // Draft while the popover is open: a half-made range never reaches the parent.
  const [draft, setDraft] = useState<[Date | null, Date | null]>(value);
  useEffect(() => { if (open) setDraft([from, to]); }, [open, from, to]);

  const fmt = format ?? L.formatDate;
  const text = !from && !to ? (rest.placeholder ?? L.labels.selectRange) : `${from ? fmt(from) : L.labels.start} ~ ${to ? fmt(to) : L.labels.end}`;

  return (
    <Popover open={open} onOpenChange={(o) => !rest.disabled && setOpen(o)} panelClassName={rest.panelClassName}
      trigger={<Trigger text={text} empty={!from && !to} onClick={() => !rest.disabled && setOpen((o) => !o)} bits={rest} />}>
      <Calendar
        mode="range" from={draft[0]} to={draft[1]} autoFocus
        onChange={(f, t) => { setDraft([f, t]); if (f && t) { onChange([f, t]); setOpen(false); } }}
        minDate={rest.minDate} maxDate={rest.maxDate} isDayDisabled={rest.isDayDisabled}
        numberOfMonths={rest.numberOfMonths ?? 2} showPresets={rest.showPresets} presets={rest.presets}
        weekStartsOn={rest.weekStartsOn} today={rest.today} locale={rest.locale} renderDay={rest.renderDay}
      />
      <div className="rcal-footer">
        <span className="rcal-footer-value">
          {draft[0] ? fmt(draft[0]) : L.labels.start}<span className="rcal-footer-sep">~</span>{draft[1] ? fmt(draft[1]) : L.labels.end}
        </span>
        <button type="button" className="rcal-footer-btn" onClick={() => { setDraft([null, null]); onChange([null, null]); }}>
          {L.labels.clear}
        </button>
      </div>
    </Popover>
  );
}

/* ── date + time ─────────────────────────────────────────────── */

export interface DateTimePickerProps extends Shared, TriggerBits {
  value: Date | null;
  onChange: (value: Date | null) => void;
  format?: (d: Date) => string;
  /** Minute step in the minute column (default 5). */
  minuteStep?: number;
  /** Time used when a day is picked before any time (default 09:00). */
  defaultTime?: { hour: number; minute: number };
}

export function DateTimePicker({
  value, onChange, format, minuteStep = 5, defaultTime = { hour: 9, minute: 0 }, ...rest
}: DateTimePickerProps): React.ReactElement {
  const L = resolveLocale(rest.locale);
  const [open, setOpen] = useState(false);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(
    () => Array.from({ length: Math.ceil(60 / Math.max(1, minuteStep)) }, (_, i) => i * Math.max(1, minuteStep)),
    [minuteStep],
  );
  const hour = value ? value.getHours() : defaultTime.hour;
  const minute = value ? value.getMinutes() : defaultTime.minute;
  const text = value ? (format ?? L.formatDateTime)(value) : (rest.placeholder ?? L.labels.selectDate);

  // The day and the time are committed independently: picking a day keeps the time, and
  // picking a time keeps the day (falling back to today when nothing is chosen yet).
  const setDay = (day: Date): void => {
    const base = value ?? new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), defaultTime.hour, defaultTime.minute);
    const next = withTime(day, base);
    onChange(rest.minDate || rest.maxDate ? withTime(clampDate(next, rest.minDate, rest.maxDate), next) : next);
  };
  const setTime = (h: number, m: number): void => {
    const day = value ?? startOfDay(rest.today ?? new Date());
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0);
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={(o) => !rest.disabled && setOpen(o)} panelClassName={rest.panelClassName}
      trigger={<Trigger text={text} empty={!value} onClick={() => !rest.disabled && setOpen((o) => !o)} bits={rest} />}>
      <div className="rcal-datetime">
        <Calendar
          mode="single" from={value} to={value} autoFocus
          onChange={(f) => { if (f) setDay(f); }}
          minDate={rest.minDate} maxDate={rest.maxDate} isDayDisabled={rest.isDayDisabled}
          numberOfMonths={rest.numberOfMonths} showPresets={rest.showPresets} presets={rest.presets}
          weekStartsOn={rest.weekStartsOn} today={rest.today} locale={rest.locale} renderDay={rest.renderDay}
        />
        <div className="rcal-time">
          <div className="rcal-time-head">{L.labels.time}</div>
          <div className="rcal-time-cols">
            <TimeColumn values={hours} value={hour} label={L.labels.hour} onSelect={(h) => setTime(h, minute)} />
            <TimeColumn values={minutes} value={minute} label={L.labels.minute} onSelect={(m) => setTime(hour, m)} />
          </div>
        </div>
      </div>
      <div className="rcal-footer">
        <span className="rcal-footer-value">{value ? (format ?? L.formatDateTime)(value) : ""}</span>
        <span className="rcal-footer-actions">
          {rest.clearable !== false ? (
            <button type="button" className="rcal-footer-btn" onClick={() => { onChange(null); setOpen(false); }}>{L.labels.clear}</button>
          ) : null}
          <button type="button" className="rcal-footer-btn rcal-footer-primary" disabled={!value} onClick={() => setOpen(false)}>{L.labels.apply}</button>
        </span>
      </div>
    </Popover>
  );
}

/** True when both dates land on the same calendar day — re-exported for convenience. */
export { isSameDay };
