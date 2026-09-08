import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "./calendar";
import { DateRangePicker, DateTimePicker } from "./pickers";
import { parseISO, toISODate, toISODateTime } from "./date-utils";

const TODAY = new Date(2026, 8, 8); // 2026-09-08, a Tuesday

const day = (label: string) => screen.getByRole("button", { name: label });

describe("Calendar", () => {
  it("selects a range with the second click, swapping when it lands before the start", async () => {
    const u = userEvent.setup();
    function Harness() {
      const [v, setV] = useState<[Date | null, Date | null]>([null, null]);
      return (
        <>
          <Calendar from={v[0]} to={v[1]} onChange={(f, t) => setV([f, t])} today={TODAY} showPresets={false} numberOfMonths={1} />
          <output data-testid="out">{`${toISODate(v[0])}|${toISODate(v[1])}`}</output>
        </>
      );
    }
    render(<Harness />);
    await u.click(day("2026-9-20"));
    expect(screen.getByTestId("out").textContent).toBe("2026-09-20|");
    await u.click(day("2026-9-10"));   // earlier than the start
    expect(screen.getByTestId("out").textContent).toBe("2026-09-10|2026-09-20");
  });

  it("commits a single day in one click", async () => {
    const u = userEvent.setup();
    let got: string = "";
    render(<Calendar mode="single" from={null} to={null} today={TODAY} showPresets={false}
      onChange={(f, t) => { got = `${toISODate(f)}|${toISODate(t)}`; }} />);
    await u.click(day("2026-9-11"));
    expect(got).toBe("2026-09-11|2026-09-11");
  });

  it("never selects a day outside min/max", async () => {
    const u = userEvent.setup();
    let calls = 0;
    render(<Calendar mode="single" from={null} to={null} today={TODAY} showPresets={false}
      minDate={new Date(2026, 8, 5)} maxDate={new Date(2026, 8, 10)} onChange={() => { calls += 1; }} />);
    expect((day("2026-9-1") as HTMLButtonElement).disabled).toBe(true);
    await u.click(day("2026-9-1"));
    expect(calls).toBe(0);
    await u.click(day("2026-9-7"));
    expect(calls).toBe(1);
  });

  it("moves with the arrow keys and commits with Enter", async () => {
    const u = userEvent.setup();
    let got = "";
    render(<Calendar mode="single" from={new Date(2026, 8, 8)} to={new Date(2026, 8, 8)} today={TODAY}
      showPresets={false} autoFocus onChange={(f) => { got = toISODate(f); }} />);
    await u.keyboard("{ArrowRight}{ArrowDown}{Enter}");   // +1 day, +7 days
    expect(got).toBe("2026-09-16");
  });

  it("applies a preset", async () => {
    const u = userEvent.setup();
    let got = "";
    render(<Calendar from={null} to={null} today={TODAY} onChange={(f, t) => { got = `${toISODate(f)}|${toISODate(t)}`; }} />);
    await u.click(screen.getByRole("button", { name: "최근 7일" }));
    expect(got).toBe("2026-09-02|2026-09-08");
  });

  it("speaks the locale it is given", () => {
    render(<Calendar from={null} to={null} onChange={() => {}} today={TODAY} locale="en" numberOfMonths={1} />);
    expect(screen.getByText("September 2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Last 7 days" })).toBeTruthy();
  });
});

describe("pickers", () => {
  it("range picker only reports a complete range, then closes", async () => {
    const u = userEvent.setup();
    function Harness() {
      const [v, setV] = useState<[Date | null, Date | null]>([null, null]);
      return (
        <>
          <DateRangePicker value={v} onChange={setV} today={TODAY} numberOfMonths={1} />
          <output data-testid="out">{`${toISODate(v[0])}|${toISODate(v[1])}`}</output>
        </>
      );
    }
    render(<Harness />);
    await u.click(screen.getByRole("button", { name: "기간 선택" }));
    await u.click(day("2026-9-10"));
    expect(screen.getByTestId("out").textContent).toBe("|");   // half a range never escapes
    await u.click(day("2026-9-12"));
    expect(screen.getByTestId("out").textContent).toBe("2026-09-10|2026-09-12");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("date-time keeps the day when the time changes and the time when the day changes", async () => {
    const u = userEvent.setup();
    function Harness() {
      const [v, setV] = useState<Date | null>(null);
      return (
        <>
          <DateTimePicker value={v} onChange={setV} today={TODAY} showPresets={false} minuteStep={30} />
          <output data-testid="out">{toISODateTime(v)}</output>
        </>
      );
    }
    render(<Harness />);
    await u.click(screen.getByRole("button", { name: "날짜 선택" }));
    await u.click(day("2026-9-15"));
    expect(screen.getByTestId("out").textContent).toBe("2026-09-15T09:00");   // default time
    const [hourCol, minuteCol] = screen.getAllByRole("listbox");
    await u.click(within(hourCol!).getByRole("option", { name: "18" }));
    await u.click(within(minuteCol!).getByRole("option", { name: "30" }));
    expect(screen.getByTestId("out").textContent).toBe("2026-09-15T18:30");
    await u.click(day("2026-9-16"));
    expect(screen.getByTestId("out").textContent).toBe("2026-09-16T18:30");   // time survives the day change
  });
});

describe("parseISO", () => {
  it("reads a date string as local time, not UTC", () => {
    // new Date("2026-09-08") is UTC midnight — the day before in Asia/Seoul.
    expect(toISODate(parseISO("2026-09-08"))).toBe("2026-09-08");
    expect(toISODateTime(parseISO("2026-09-08T23:30"))).toBe("2026-09-08T23:30");
    expect(parseISO("")).toBeNull();
  });
});
