/**
 * The busiest-travel-days page is built from TSA's daily checkpoint counts. These pin the
 * dataset to dates that TSA and the news reported, so a bad update can't ship quietly.
 *
 * Run: npm test
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { busiest, daysInYear, formatDay, tsaDays, weekdayAverages } from "@/lib/tsa-volumes";

describe("TSA daily volumes", () => {
  const days = tsaDays();

  it("has one row per day with no gaps, starting Jan 1, 2025", () => {
    assert.equal(days[0].date, "2025-01-01");
    assert.equal(daysInYear(2025, days).length, 365);
    for (let i = 1; i < days.length; i++) {
      assert.equal(Date.parse(days[i].date) - Date.parse(days[i - 1].date), 86_400_000, days[i].date);
    }
  });

  it("matches dates TSA published", () => {
    const at = (iso: string) => days.find((d) => d.date === iso)?.count;
    assert.equal(at("2025-11-30"), 3_134_613); // all-time record, the Sunday after Thanksgiving
    assert.equal(at("2025-12-28"), 2_924_593);
    assert.equal(at("2026-01-04"), 2_817_509);
    assert.equal(at("2026-06-18"), 2_988_204);
  });

  it("finds the record day and gets weekdays right", () => {
    const [top] = busiest(days, 1);
    assert.equal(top.date, "2025-11-30");
    assert.equal(top.weekday, 0);
    assert.equal(formatDay(top.date), "Sun, Nov 30, 2025");
    const avg = weekdayAverages(daysInYear(2025, days));
    assert.equal(avg.length, 7);
    assert.equal(avg.reduce((a, b) => (b.avg > a.avg ? b : a)).day, "Sunday");
    assert.equal(avg.reduce((a, b) => (b.avg < a.avg ? b : a)).day, "Tuesday");
  });
});
