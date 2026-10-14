# Show HN (post from your own HN account)

**When:** a weekday, 8–10am ET (e.g. Thu Oct 15). Stay around for 2–3 hours to reply.
**URL:** https://www.leaveby.xyz/app?utm_source=hackernews&utm_medium=community&utm_campaign=launch

**Title (80 char max):**
Show HN: Leave By – tells you the minute to leave for your flight

**Text:**
I kept doing the same math before every flight: how long is the drive at that hour, which terminal, how bad is security, how far is the gate, when does boarding start. So I built a tool that does it.

You pick your flight (it lists every departure of that flight number so you choose the right leg) and where you're starting. It then:
- gets the empty-road drive time from OSRM and adjusts it for that hour's traffic and the weather forecast (NWS / Open-Meteo)
- checks FAA ground stops and delay programs for your airports
- researches security at your terminal and hour, PreCheck/CLEAR lanes and the walk to the gate with live web search, then caps outliers (a quote like "can take up to 2 hours" doesn't become your plan)
- adds passport control on international departures, including the EU's new Entry/Exit System on the way out of Schengen

It works backwards from boarding and gives you one time, plus a step-by-step plan you can share with whoever is driving you. No account, nothing stored server-side; a shared plan is packed into the link.

Things I learned building it: one flight number can fly 3–4 different legs a day, so guessing the leg is how you tell someone in SF to leave for Phoenix (that happened; the fix was making you pick). And research loves worst cases, so the numbers need sanity caps.

Built with Next.js on Vercel. I'd love feedback on whether the times match your experience at your home airport.
