# @cocorof/react-calendar

Date, date-range and date-time pickers for React. No date library, no calendar library, no
CSS framework — a 22 kB ESM bundle (5.9 kB gzipped) drawn on native `Date` and themed with
CSS variables.

```bash
npm i @cocorof/react-calendar
```

```tsx
import { DateTimePicker } from "@cocorof/react-calendar";
import "@cocorof/react-calendar/styles.css";

<DateTimePicker value={expiresAt} onChange={setExpiresAt} minDate={new Date()} minuteStep={30} />
```

## Why

Native `<input type="date">` looks different in every browser, cannot show a range, cannot
disable individual days, and drops you into a spinner on mobile. Most replacements pull in a
date library and a styling system. This one carries neither.

- **Range selection that reads correctly** — first click sets the start, hovering previews the
  span, the second click commits and swaps itself if it landed earlier.
- **Quick presets** — today, last 7 days, this month… in Korean and English, or your own.
- **Keyboard** — arrows move a cursor that is independent of the selection, PageUp/PageDown
  change month, Home/End jump to the edges, Enter commits.
- **Bounds** — `minDate` / `maxDate` and a per-day `isDayDisabled` predicate.
- **Local time, always** — `parseISO("2026-09-08")` is midnight where the user is, not UTC.
- **Themed with CSS variables**, dark mode included.

## Components

| | |
|---|---|
| `<Calendar>` | the panel itself: `mode="single" \| "range"`, presets, bounds, `renderDay` |
| `<DatePicker>` | one day, in a popover |
| `<DateRangePicker>` | a span; a half-made range never reaches `onChange` |
| `<DateTimePicker>` | a day plus hour/minute columns; each keeps the other when it changes |

All of them take `locale="ko" \| "en"` or a `CalendarLocale` object, `today` (injectable for
tests and SSR), `weekStartsOn`, `numberOfMonths`, `showPresets`, `presets`, `format`.

```tsx
<DateRangePicker
  value={[from, to]}
  onChange={setRange}
  locale="en"
  numberOfMonths={2}
  presets={[{ label: "This sprint", range: (t) => [addDays(t, -13), t] }]}
  isDayDisabled={(d) => d.getDay() === 0}
/>
```

## Theming

Override the variables on any ancestor, or on `.rcal` / `.rcal-popover`:

```css
.rcal, .rcal-popover {
  --rcal-accent: #176fd6;      /* selected day, focus ring, primary button */
  --rcal-accent-soft: #e6f0fd; /* the bar connecting a range */
  --rcal-bg: #fff;
  --rcal-fg: #1f2430;
  --rcal-border: #e3e6ec;
  --rcal-radius: 12px;
  --rcal-cell: 36px;           /* day cell size */
}
```

Dark mode follows `prefers-color-scheme` and `[data-theme="dark"]`; force it per instance
with `className="rcal-dark"` (or pin light with `rcal-light`).

## Date helpers

`startOfDay` `startOfMonth` `endOfMonth` `addDays` `addMonths` `isSameDay` `isSameMonth`
`diffDays` `clampDate` `monthGrid` `withTime` `toISODate` `toISODateTime` `parseISO`.

`parseISO` and `toISODate*` speak the same strings as `<input type="date">` and
`<input type="datetime-local">`, in **local** time — which is the bug most hand-rolled
conversions ship with.

## License

MIT © CocoRoF
