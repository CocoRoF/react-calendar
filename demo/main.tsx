import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Calendar, DateTimePicker } from "../src";

const TODAY = new Date(2026, 8, 8);

function Demo() {
  const [range, setRange] = useState<[Date | null, Date | null]>([new Date(2026, 8, 13), new Date(2026, 8, 24)]);
  const [when, setWhen] = useState<Date | null>(new Date(2026, 8, 30, 18, 30));
  return (
    <div>
      <div className="wrap" id="light">
        <div className="shot" id="shot-range">
          <Calendar mode="range" from={range[0]} to={range[1]} onChange={(f, t) => setRange([f, t])} today={TODAY} numberOfMonths={2} />
          <div className="rcal-footer" style={{ marginTop: 10 }}>
            <span className="rcal-footer-value">2026. 9. 13<span className="rcal-footer-sep">~</span>2026. 9. 24</span>
            <button type="button" className="rcal-footer-btn">초기화</button>
          </div>
        </div>
      </div>
      <div className="wrap" id="dark">
        <div className="shot rcal-dark" id="shot-datetime" style={{ background: "#12151c", borderColor: "#262b36" }}>
          <DateTimePicker value={when} onChange={setWhen} today={TODAY} minuteStep={30} locale="ko" panelClassName="rcal-dark" />
        </div>
        <div className="shot rcal-dark" id="shot-single" style={{ background: "#12151c", borderColor: "#262b36" }}>
          <Calendar mode="single" from={new Date(2026, 8, 17)} to={new Date(2026, 8, 17)} onChange={() => {}} today={TODAY} locale="en" numberOfMonths={1} />
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
