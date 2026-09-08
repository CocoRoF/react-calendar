/**
 * Calendar — the panel. Pure presentation and interaction: the trigger, the popover and any
 * string conversion belong to the pickers that wrap it.
 *
 * Two modes:
 *  - `range` (default): first click sets the start, hovering previews the end, the second
 *    click commits (swapping if it lands before the start).
 *  - `single`: one click commits a single day; `onChange` is called with `(day, day)` so a
 *    wrapper can treat it as one date.
 *
 * Drawn on native `Date` — no date library, no calendar library.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays, addMonths, clampDate, diffDays, isDisabledDay, isSameDay, isSameMonth, monthGrid,
  startOfDay, startOfMonth,
} from "./date-utils";
import { type CalendarLocale, type LocaleName, type RangePreset, resolveLocale } from "./locale";

export interface CalendarProps {
  from: Date | null;
  to: Date | null;
  /** `range`: partial selection arrives as `(from, null)`, completion as `(from, to)`.
   *  `single`: always `(day, day)`. */
  onChange: (from: Date | null, to: Date | null) => void;
  /** Fired when a selection is complete — close the popover here. */
  onComplete?: () => void;
  mode?: "single" | "range";
  minDate?: Date;
  maxDate?: Date;
  /** Disable individual days (holidays, booked days, …). */
  isDayDisabled?: (day: Date) => boolean;
  /** Months side by side (default 1 for single, 2 for range). */
  numberOfMonths?: number;
  showPresets?: boolean;
  presets?: RangePreset[];
  /** 0 = Sunday (default), 1 = Monday. */
  weekStartsOn?: 0 | 1;
  /** Injectable "today" for tests and SSR. */
  today?: Date;
  locale?: LocaleName | CalendarLocale;
  /** Render something under each day number (a dot for events, a price, …). */
  renderDay?: (day: Date) => React.ReactNode;
  className?: string;
  autoFocus?: boolean;
}

export function Calendar({
  from, to, onChange, onComplete, mode = "range", minDate, maxDate, isDayDisabled,
  numberOfMonths, showPresets = true, presets, weekStartsOn = 0, today, locale,
  renderDay, className, autoFocus,
}: CalendarProps): React.ReactElement {
  const L = resolveLocale(locale);
  const single = mode === "single";
  const months = Math.max(1, numberOfMonths ?? (single ? 1 : 2));
  const todayDate = useMemo(() => startOfDay(today ?? new Date()), [today]);

  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(from ?? to ?? todayDate));
  const [hover, setHover] = useState<Date | null>(null);
  // The keyboard cursor is separate from the selection: arrows move it, Enter commits.
  const [focusDay, setFocusDay] = useState<Date>(() => startOfDay(from ?? to ?? todayDate));
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocus = useRef(!!autoFocus);

  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => L.weekdays[(i + weekStartsOn) % 7] ?? ""),
    [L, weekStartsOn],
  );
  const presetList = useMemo(
    () => presets ?? (single ? L.singlePresets : L.rangePresets),
    [presets, single, L],
  );

  const selectingEnd = !single && !!from && !to;
  const previewTo = to ?? (selectingEnd && hover ? hover : null);
  const [rangeLo, rangeHi] = useMemo<[Date | null, Date | null]>(() => {
    if (from && previewTo) return diffDays(from, previewTo) <= 0 ? [from, previewTo] : [previewTo, from];
    return [from, previewTo];
  }, [from, previewTo]);

  const commit = useCallback((day: Date): void => {
    if (isDisabledDay(day, minDate, maxDate, isDayDisabled)) return;
    const picked = startOfDay(day);
    if (single) {
      onChange(picked, picked);
      setHover(null);
      onComplete?.();
      return;
    }
    if (!from || (from && to)) {   // start a new range
      onChange(picked, null);
      return;
    }
    let lo = from;
    let hi = picked;
    if (diffDays(lo, hi) > 0) [lo, hi] = [hi, lo];
    onChange(clampDate(lo, minDate, maxDate), clampDate(hi, minDate, maxDate));
    setHover(null);
    onComplete?.();
  }, [from, to, single, minDate, maxDate, isDayDisabled, onChange, onComplete]);

  const applyPreset = (preset: RangePreset): void => {
    let [f, t] = preset.range(todayDate);
    f = clampDate(startOfDay(f), minDate, maxDate);
    t = single ? f : clampDate(startOfDay(t), minDate, maxDate);
    onChange(f, t);
    setViewMonth(startOfMonth(f));
    setFocusDay(f);
    setHover(null);
    onComplete?.();
  };

  const moveFocus = (next: Date): void => {
    setFocusDay(next);
    shouldFocus.current = true;
    if (!isSameMonth(next, viewMonth) && diffDays(next, startOfMonth(viewMonth)) < 0) setViewMonth(startOfMonth(next));
    else if (diffDays(next, addMonths(viewMonth, months)) >= 0) setViewMonth(addMonths(startOfMonth(next), -(months - 1)));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    const key = e.key;
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (key in map) {
      e.preventDefault();
      moveFocus(addDays(focusDay, map[key] as number));
    } else if (key === "PageUp" || key === "PageDown") {
      e.preventDefault();
      const m = addMonths(startOfMonth(focusDay), key === "PageUp" ? -1 : 1);
      moveFocus(new Date(m.getFullYear(), m.getMonth(), Math.min(focusDay.getDate(), new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate())));
    } else if (key === "Home" || key === "End") {
      e.preventDefault();
      moveFocus(key === "Home" ? startOfMonth(focusDay) : new Date(focusDay.getFullYear(), focusDay.getMonth() + 1, 0));
    } else if (key === "Enter" || key === " ") {
      e.preventDefault();
      commit(focusDay);
    }
  };

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-rcal-focus="true"]')?.focus();
  });

  const monthList = Array.from({ length: months }, (_, i) => addMonths(viewMonth, i));

  return (
    <div className={["rcal", className].filter(Boolean).join(" ")}>
      {showPresets && presetList.length > 0 && (
        <div className="rcal-presets">
          {presetList.map((p) => (
            <button key={p.label} type="button" className="rcal-preset" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="rcal-body">
        <div className="rcal-nav">
          <button type="button" className="rcal-nav-btn" aria-label={L.labels.prevMonth}
            onClick={() => setViewMonth((m) => addMonths(m, -1))}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="rcal-month-labels">
            {monthList.map((m) => <div key={m.getTime()} className="rcal-month-label">{L.monthLabel(m)}</div>)}
          </div>
          <button type="button" className="rcal-nav-btn" aria-label={L.labels.nextMonth}
            onClick={() => setViewMonth((m) => addMonths(m, 1))}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>

        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div className="rcal-months" ref={gridRef} onKeyDown={onKeyDown} role="application" aria-label={single ? L.labels.selectDate : L.labels.selectRange}>
          {monthList.map((month) => (
            <div key={month.getTime()} className="rcal-month">
              <div className="rcal-weekdays">
                {weekdays.map((w, i) => {
                  const dow = (i + weekStartsOn) % 7;
                  return <div key={w + i} className={`rcal-weekday${dow === 0 ? " rcal-sun" : dow === 6 ? " rcal-sat" : ""}`}>{w}</div>;
                })}
              </div>
              <div className="rcal-grid">
                {monthGrid(month, weekStartsOn).map((day) => {
                  const outside = !isSameMonth(day, month);
                  const disabled = isDisabledDay(day, minDate, maxDate, isDayDisabled);
                  const isStart = isSameDay(day, rangeLo);
                  const isEnd = isSameDay(day, rangeHi);
                  const isEdge = isStart || isEnd;
                  const isOnly = isStart && isEnd;
                  const within = !!rangeLo && !!rangeHi && diffDays(day, rangeLo) >= 0 && diffDays(day, rangeHi) <= 0;
                  const isMiddle = within && !isEdge;
                  const isToday = isSameDay(day, todayDate);
                  const focused = isSameDay(day, focusDay);
                  const dow = day.getDay();
                  const cell = [
                    "rcal-cell",
                    isMiddle ? "rcal-in-range" : "",
                    within && isStart && !isOnly ? "rcal-range-start" : "",
                    within && isEnd && !isOnly ? "rcal-range-end" : "",
                  ].filter(Boolean).join(" ");
                  const btn = [
                    "rcal-day",
                    outside ? "rcal-outside" : "",
                    disabled ? "rcal-disabled" : "",
                    isEdge ? "rcal-selected" : "",
                    isToday && !isEdge ? "rcal-today" : "",
                    !outside && !isEdge && !isMiddle && dow === 0 ? "rcal-sun" : "",
                    !outside && !isEdge && !isMiddle && dow === 6 ? "rcal-sat" : "",
                  ].filter(Boolean).join(" ");
                  return (
                    <div key={day.getTime()} className={cell}>
                      <button
                        type="button"
                        className={btn}
                        disabled={disabled}
                        tabIndex={focused ? 0 : -1}
                        data-rcal-focus={focused || undefined}
                        aria-pressed={isEdge || isMiddle}
                        aria-current={isToday ? "date" : undefined}
                        aria-label={`${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`}
                        onClick={() => { setFocusDay(startOfDay(day)); commit(day); }}
                        onMouseEnter={() => selectingEnd && setHover(day)}
                      >
                        <span className="rcal-day-num">{day.getDate()}</span>
                        {renderDay ? <span className="rcal-day-extra">{renderDay(day)}</span> : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
