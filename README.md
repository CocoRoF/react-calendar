# @cocorof/react-calendar

Dependency-free React date, date-range and date-time pickers built on native `Date` and themed with CSS variables.

## Install

```bash
npm i @cocorof/react-calendar
```

Peer dependencies: `react` and `react-dom` >= 18. There are no runtime dependencies.

## Quick start

```tsx
import { useState } from "react";
import { DateRangePicker } from "@cocorof/react-calendar";
import "@cocorof/react-calendar/styles.css";

export function Example() {
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);
  return <DateRangePicker value={range} onChange={setRange} locale="en" />;
}
```

The stylesheet import is required. Built output is about 22 kB for the ESM bundle (about 6 kB gzipped) plus 8.7 kB of CSS (about 2 kB gzipped), measured on `dist/` for 0.2.2.

## Components

| Component | Purpose |
|---|---|
| `Calendar` | The calendar panel itself, without a trigger or popover. |
| `DatePicker` | One day, chosen in a popover. |
| `DateRangePicker` | A start/end span in a popover. `onChange` only fires once both ends are chosen (or on clear). |
| `DateTimePicker` | One day plus hour and minute columns. |
| `Popover` | The portalled popover used by the pickers, exported for reuse. |

### Props shared by all pickers

`DatePicker`, `DateRangePicker` and `DateTimePicker` accept:

| Prop | Type | Notes |
|---|---|---|
| `value` | `Date \| null` (`[Date \| null, Date \| null]` for the range picker) | Controlled value. |
| `onChange` | `(value) => void` | Same shape as `value`. |
| `format` | `(d: Date) => string` | Overrides the locale's trigger text. |
| `locale` | `"ko" \| "en" \| CalendarLocale` | Defaults to the built-in Korean locale (`ko`). |
| `minDate`, `maxDate` | `Date` | Bounds. |
| `isDayDisabled` | `(day: Date) => boolean` | Disable individual days. |
| `numberOfMonths` | `number` | Months side by side. Default 1 for single pickers, 2 for the range picker. |
| `showPresets`, `presets` | `boolean`, `RangePreset[]` | Quick presets; `presets` replaces the locale's list. A preset is `{ label, range: (today) => [from, to] }`. |
| `weekStartsOn` | `0 \| 1` | 0 = Sunday (default), 1 = Monday. |
| `today` | `Date` | Injectable "today" for tests and SSR. |
| `renderDay` | `(day: Date) => ReactNode` | Content under each day number. |
| `placeholder`, `disabled`, `clearable` | | Trigger text, disabled state, and a clear button (`DatePicker`: opt in with `clearable`; `DateTimePicker`: shown unless `clearable={false}`; the range picker always has one). |
| `className`, `width`, `panelClassName`, `id`, `name`, `aria-label`, `uiId` | | Trigger styling and attributes. `panelClassName` is applied to the portalled panel; `uiId` becomes `data-ui-id`. |

`DateTimePicker` also takes `minuteStep` (default 5) and `defaultTime` (`{ hour, minute }`, default 09:00, used when a day is picked before any time). Picking a day keeps the current time and picking a time keeps the current day.

### Calendar

`Calendar` takes the shared options above (except the trigger props) plus:

| Prop | Type | Notes |
|---|---|---|
| `from`, `to` | `Date \| null` | Current selection. |
| `onChange` | `(from, to) => void` | In `range` mode a partial selection arrives as `(from, null)`; in `single` mode it is always `(day, day)`. |
| `onComplete` | `() => void` | Fired when a selection is complete. |
| `mode` | `"single" \| "range"` | Default `"range"`. |
| `className`, `autoFocus` | | |

In range mode the second click commits and swaps the ends if it landed before the start. While choosing the end, hovering previews the span.

### Popover

`Popover` props: `open`, `onOpenChange`, `trigger`, `children`, `align` (`"start" | "end"`), `className`, `panelClassName`. It closes on outside click, Escape and scroll of an ancestor.

### Locales and helpers

Exports: `ko`, `en`, `locales`, `resolveLocale`, and the types `CalendarLocale`, `LocaleName`, `RangePreset`. A `CalendarLocale` supplies weekday labels, month/date formatters, range and single presets, and UI labels.

Date helpers: `startOfDay`, `startOfMonth`, `endOfMonth`, `addDays`, `addMonths`, `isSameDay`, `isSameMonth`, `diffDays`, `clampDate`, `monthGrid`, `withTime`, `toISODate`, `toISODateTime`, `parseISO`.

`parseISO` reads `YYYY-MM-DD` and `YYYY-MM-DDTHH:mm[:ss]` as local time (`new Date("2026-09-08")` would be UTC midnight).

## Theming

Override CSS variables on an ancestor, or on `.rcal` / `.rcal-popover`:

```css
.rcal, .rcal-popover {
  --rcal-accent: #176fd6;
  --rcal-accent-soft: #e6f0fd;
  --rcal-radius: 12px;
  --rcal-cell: 36px;
}
```

Variables defined in `styles.css`: `--rcal-accent`, `--rcal-accent-fg`, `--rcal-accent-soft`, `--rcal-bg`, `--rcal-fg`, `--rcal-muted`, `--rcal-faint`, `--rcal-border`, `--rcal-hover`, `--rcal-shadow`, `--rcal-radius`, `--rcal-cell`, `--rcal-font`, `--rcal-sun`, `--rcal-sat`.

Dark mode follows `prefers-color-scheme` and `[data-theme="dark"]`. Force it with the `rcal-dark` class, or pin light with `rcal-light`. The popover panel is portalled, so pass a theme class through `panelClassName`.

## Keyboard and accessibility

Inside the day grid:

- Arrow keys move a focus cursor that is separate from the selection.
- PageUp / PageDown change month; Home / End jump to the first / last day of the month.
- Enter or Space commits the focused day.
- Escape closes a picker popover.

Day buttons carry `aria-pressed` and `aria-current="date"`, and the grid and month navigation buttons are labelled from the locale. I did not run a screen reader or an automated accessibility audit.

## Development

```bash
npm install
npm run dev        # demo (vite)
npm test           # vitest
npm run typecheck
npm run build      # tsc --noEmit && vite build
```

## Related packages

- [`@cocorof/react-selector`](https://github.com/CocoRoF/react-selector)
- [`@cocorof/react-filters`](https://github.com/CocoRoF/react-filters)

## License

Apache License 2.0. See [LICENSE](LICENSE).
