/** Hour/minute columns for the date-time picker. A scrolling list beats a spinner on a
 *  phone, and it keeps the selected value in view when the panel opens. */
import React, { useEffect, useRef } from "react";

export interface TimeColumnProps {
  values: number[];
  value: number;
  onSelect: (v: number) => void;
  label: string;
}

export function TimeColumn({ values, value, onSelect, label }: TimeColumnProps): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[data-selected="true"]');
    // Not every environment has it (jsdom, older embedded webviews); scrolling is a nicety.
    el?.scrollIntoView?.({ block: "center" });
  }, [value]);
  return (
    <div className="rcal-time-col" ref={ref} role="listbox" aria-label={label}>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          role="option"
          aria-selected={v === value}
          data-selected={v === value || undefined}
          className={`rcal-time-item${v === value ? " rcal-time-selected" : ""}`}
          onClick={() => onSelect(v)}
        >
          {String(v).padStart(2, "0")}
        </button>
      ))}
    </div>
  );
}
