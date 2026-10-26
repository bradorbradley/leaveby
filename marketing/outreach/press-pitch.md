# Press pitch: holiday travel data (send Nov 2–13)

Reporters start writing "busiest travel days" and "when to leave for the airport" stories about two weeks before Thanksgiving. We have original, sourced data and free charts. The founder sends this from their own email. Nothing here is sent automatically.

**Who:** national travel desks and local TV/newspapers in big airport metros. The outlet list is in `outlets.md`: public tip forms and newsroom addresses only, no personal reporter emails.

**Rules:** send one email per outlet, never mass-BCC, and personalize the first line (their city's airport, or a recent story of theirs). Only send figures that appear on our pages. Never say "record" about 2026 unless TSA says so.

## Subject lines (pick one)
- Only 8 days in history have topped 3 million TSA screenings (data + free charts)
- The busiest hour at US airport security is 5–7 AM (TSA hourly data, charts free to use)

## Email

Hi [name / newsroom],

[One line on their outlet: "Saw your piece on ___ last Thanksgiving" or "Ahead of the Thanksgiving rush at ___"]

I run Leave By (leaveby.xyz), a free tool that tells travelers when to leave for the airport. We charted TSA's public checkpoint numbers ahead of the holidays. A few things stood out:

- Only 8 days in history have topped 3 million screenings, all in 2025 and all on a Friday or Sunday. The record is 3,134,613 on Sun, Nov 30, 2025, the Sunday after Thanksgiving. This year that Sunday is Nov 29.
- Nationally, the busiest time at security is 5–7 AM local time, every day of the week. Those two hours carry about 15% of all screenings (TSA hourly counts, Sep 13–19, 2026).
- Tuesday is the quietest day to fly, about 21% below Sunday (2025 averages).
- 2026 is running about 1% behind 2025 so far (Jan 1–Oct 22).

The charts are free to use with credit to Leave By:
- https://www.leaveby.xyz/press/tsa-2025-calendar.png
- https://www.leaveby.xyz/press/tsa-by-hour.png
- https://www.leaveby.xyz/press/tsa-by-weekday.png
- https://www.leaveby.xyz/press/tsa-day-by-hour.png

Full data and method: https://www.leaveby.xyz/busiest-travel-days and https://www.leaveby.xyz/tsa-busiest-times. We also have cited guides for 57 airports, e.g. https://www.leaveby.xyz/airports/[their airport code].

Happy to pull numbers for a specific date or answer questions.

[Founder's name]
Leave By

## Facts and sources (for follow-ups)
| Claim | Source |
|---|---|
| 3,134,613 on Nov 30, 2025 (record) | tsa.gov/travel/passenger-volumes/2025. News reports at the time said 3,133,924; TSA's table now shows 3,134,613. If asked, say "about 3.13 million" and cite the table. |
| 8 days ≥ 3M, all 2025, all Fri/Sun | same, computed in `lib/tsa-volumes.json` |
| 5–7 AM peak, ~15% of screenings | TSA FOIA throughput data, Sep 13–19, 2026; `lib/tsa-hourly.json` |
| Tuesday ~21% below Sunday (2025) | tsa.gov passenger volumes 2025 |
| 2026 YTD −0.8% vs 2025 (to Oct 22) | tsa.gov passenger volumes |
