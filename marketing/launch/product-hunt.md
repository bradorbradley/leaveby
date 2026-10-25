# Product Hunt (Wed Nov 4, 12:01am PT)

Avoid Tue Nov 3 (US Election Day). Line up ~10 people who travel to try it that day and leave honest comments. Don't ask for upvotes.

**Name:** Leave By
**Tagline (60 chars):** Know the exact minute to leave for your flight
**Topics:** Travel, Productivity, Maps
**Link:** https://www.leaveby.xyz/?utm_source=producthunt&utm_medium=referral&utm_campaign=launch

**Description (260 chars):**
Pick your flight and where you're starting. Leave By checks live traffic, weather, security at your terminal, passport control and airport alerts, then tells you when to walk out the door. Free, no account.

**Maker comment:**
Hi PH! I built Leave By because "when do I need to leave for the airport?" never had a real answer, just "2 hours domestic, 3 international."

Leave By answers it for your flight. It works backwards from boarding: the walk to your gate, the security line at your terminal at that hour, bag drop if you're checking one, passport control on international trips, and the drive with live traffic and weather. You get one time and a plan you can send to whoever's driving you.

It's free and there's no account. I'd love to hear whether the times match your experience at your home airport.

**Gallery (in order):**
1. The 60-second mascot ad (video, from the founder).
2. Five 1270×760 images from real app screens: leave time, flight picker, step-by-step plan, airport guides, international.

To regenerate the images:
1. Capture the screens: `BASE=https://www.leaveby.xyz OUT=<dir> FLIGHT=UA1564 PICK=DFW ORIGIN=75201 node scripts/e2e-picker.mjs`.
2. Add 390px captures of `/airports/jfk` and `/international-flights` to the same folder.
3. Run `node marketing/launch/gallery.mjs <dir>`.

**Launch-day checklist (founder):**
1. Mon Nov 2: schedule the launch on producthunt.com for Wed Nov 4, 12:01am PT. Upload the gallery and paste the copy above.
2. Text ~10 friends and coworkers who travel the link that morning, asking them to try it and comment honestly. Don't ask for upvotes.
3. Post the maker comment right after launch. Reply to every comment that day.
