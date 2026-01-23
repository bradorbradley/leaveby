# LeaveBy - Product Specification

## Overview

**LeaveBy** answers one question: "What time do I need to leave for the airport?"

This app gives users a definitive, confident answer - not a range, not a hedge, THE time. The whole point is certainty. Users (primarily women being sent this by their partners) trust this app to tell them exactly when to walk out the door.

**Target Audience:** Women who want a clear answer without doing airport math. Marketed with a "send this to your lady" vibe - clean, feminine aesthetic without being obnoxious about it.

**Design Inspiration:** Nuuly (nuuly.com) - playful but sophisticated, diverse color palette, clean typography, self-expression focused.

---

## Core Philosophy

1. **Certainty over caveats** - We give THE answer. No "approximately" or "we recommend" or "confidence levels". Just: "Leave by 7:15am"
2. **Dead simple UX** - Three screens max. Flight info → options → answer.
3. **Accuracy is everything** - We fetch real-time data at request time. We know JFK inside and out.
4. **No paid APIs** - All data sourced from free, publicly available sources via web scraping/fetching at request time.
5. **Know every detail** - If a service is closed, if there's construction, if it's a busy travel day - we know and we account for it.
6. **Defensible answers** - Every recommendation can be explained with specific reasoning in the breakdown.

---

## MVP Scope

**Phase 1: JFK Only**
- All 5 active terminals (1, 4, 5, 7, 8)
- All major airlines
- All security options (standard, PreCheck, CLEAR, Global Entry, Touchless ID)
- All airline status tiers
- Checked bag vs carry-on only
- Domestic vs international

**Phase 2 (Later):** LGA, EWR

---

## Data Architecture

### Data Fetched at Request Time (Free Sources)

All data is fetched LIVE when the user submits their request, just like Claude would do if asked this question.

#### 1. Traffic/Travel Time
**Sources to scrape/check:**
- Google Maps (scrape travel time from public site for origin → airport terminal)
- Check for current traffic incidents/construction alerts
- Note: JFK has massive ongoing construction - always factor in extra buffer

**What we need:**
- Current travel time with traffic
- Any incidents or delays on route

#### 2. TSA Security Wait Times
**Sources to scrape/check:**
- tsawaittimes.com/security-wait-times/JFK/John-F.-Kennedy-International
- flightqueue.com/airport/JFK
- jfkt4.nyc (Terminal 4 specific - shows live wait times)
- Airport terminal websites

**What we need:**
- Current wait time by terminal
- Historical average for this time of day (if available)

#### 3. Flight Information
**Sources to scrape/check:**
- Google Flights (search by flight number)
- flightaware.com/live/flight/{flight_number} (free public view)
- Airline websites

**What we need:**
- Departure time
- Terminal
- Gate (if available)
- Any delays

#### 4. Weather
**Sources:**
- weather.gov (free, official)
- Affects both traffic and potential airport delays

#### 5. Construction/Airport Alerts
**Sources:**
- construction.jfkairport.com
- panynj.gov press releases
- Delta/airline travel advisories

---

## JFK Terminal Intelligence (Static Data)

This is our competitive advantage - deep knowledge about each terminal.

### Terminal 1
- **Airlines:** Air France, Lufthansa, Korean Air, Turkish Airlines, Austrian, Brussels Airlines, SWISS, TAP Portugal, and many international carriers
- **Security:** PreCheck available, NO CLEAR
- **Status:** Under major renovation (New Terminal One project through 2030)
- **Notes:** First phase opening 2026. Currently 11 gates.
- **Curb-to-security walk:** 5-7 min
- **Security-to-gates walk:** 5-10 min
- **Peak times:** Early morning international departures (5-8am), evening Europe departures

### Terminal 4 (Delta Hub)
- **Airlines:** Delta (primary), KLM, Virgin Atlantic, LATAM, Aeromexico, Emirates, Etihad, Singapore, Kenya Airways, China Airlines, and partners
- **Security Options:**
  - Standard lanes
  - TSA PreCheck
  - CLEAR (located departures level near Row 1 at Delta Priority check-in)
  - **T4 RESERVE** - FREE reservation system to book security time slot (huge advantage!)
  - **Delta Touchless ID** - Biometric, FASTEST option (requires PreCheck + US passport in SkyMiles profile)
- **Status:** Largest terminal, recently expanded, modern
- **Notes:** Multiple security checkpoints (departures level has CLEAR, arrivals level is often shorter but no CLEAR). Delta consolidated all operations here from T2 in 2023.
- **Curb-to-security walk:** 7-10 min
- **Security-to-gates walk:** 5-15 min (Concourse A vs B)
- **Peak times:** 5-8am, 4-7pm
- **Rideshare pickup:** Remote lot accessed via shuttle from Terminal 4 (12pm-2am daily)

### Terminal 5 (JetBlue)
- **Airlines:** JetBlue (primary), some others
- **Security:** PreCheck available, NO CLEAR
- **Status:** Modern (2008), connected to TWA Hotel. $100M renovation announced 2025.
- **Notes:** 29 gates. Generally efficient. Known as "hyper-efficient" and user-friendly.
- **Curb-to-security walk:** 5 min
- **Security-to-gates walk:** 5-10 min
- **Peak times:** Morning East Coast departures
- **Access change (Oct 2025):** New permanent roadway pattern - vehicles must follow updated Van Wyck signs

### Terminal 7
- **Airlines:** Aer Lingus, Air Canada, Icelandair, Frontier, Ethiopian, LOT Polish, Condor, ANA, Sun Country, Norse Atlantic, HiSky, Kuwait Airways
- **Security:** PreCheck available, **CLEAR CLOSED** (temporarily closed - kiosks still visible but not operational)
- **Status:** Smallest/oldest terminal. Being replaced by new Terminal 6 (opening 2026). Will be demolished after T6 Phase 1 complete.
- **Notes:** 12 gates. Compact - all gates 1-2 min from security. Alaska Airlines moved OUT to Terminal 8 in October 2025.
- **Curb-to-security walk:** 3-5 min
- **Security-to-gates walk:** 1-2 min (compact terminal, this is an advantage)
- **Peak times:** Varies by airline schedule
- **Access change (Oct 2025):** New permanent roadway pattern
- **Lounges:** Aer Lingus Lounge, Alaska Lounge (may close when all AS flights move), Lounge @ T7

### Terminal 8 (American Airlines Hub)
- **Airlines:** American Airlines (primary), British Airways, Iberia, Japan Airlines, Qantas, Qatar, Alaska Airlines (moved here Oct 2025), Cathay Pacific, Finnair, Hawaiian (moved here April 2025), China Southern, Royal Jordanian
- **Security:** PreCheck available (longest hours: 3:30am-10pm), NO CLEAR. Has Touchless ID for AA.
- **Status:** Large terminal, recently expanded (2022). Oneworld alliance hub. Largest terminal at JFK by passenger volume.
- **Notes:** 31 gates across two concourses (B and C). **WARNING: Concourse C requires underground tunnel with moving walkways - add 10-15 min walk time.** Food options limited due to construction.
- **Curb-to-security walk:** 5-8 min
- **Security-to-gates walk:** 5-8 min (Concourse B gates 1-20), **10-15 min (Concourse C gates 31-47 via tunnel)**
- **Peak times:** 5-8am, 4-7pm
- **Access change (Oct 2025):** Now accessed via JFK Expressway (NOT Van Wyck - this catches repeat visitors off guard)
- **Lounges:** Admirals Club, Greenwich Lounge, Soho Lounge, Chelsea Lounge (premium/elite only)

---

## Busy Travel Calendar (Critical for Accuracy)

We MUST factor in peak travel periods. Security times can 2-3x during these windows.

### 2026 Peak Travel Days (Add 30-50% to security estimates)

**EXTREME (Busiest days of the year - add 50%+):**
- Sunday after Thanksgiving (Nov 29, 2026)
- Wednesday before Thanksgiving (Nov 25, 2026)
- Friday before Christmas (Dec 18, 2026)
- Sunday after Christmas (Dec 27, 2026)
- Dec 19, 20, 21, 26, 28, 29

**HIGH (Very busy - add 30-40%):**
- Friday before Memorial Day weekend
- Sunday after Memorial Day weekend
- Friday before July 4th
- Sunday after July 4th
- Friday before Labor Day
- Sunday after Labor Day
- Spring break weeks (varies by region, typically mid-March to mid-April)
- Any Sunday evening (return travel day)
- Any Friday afternoon/evening (departure day)

**MODERATE (Busier than normal - add 15-20%):**
- Monday mornings (business travel)
- Thursday evenings
- School holiday weeks
- Three-day weekend Fridays/Sundays

**LIGHTER (Good times to travel):**
- Tuesday, Wednesday (mid-week)
- Saturday mornings (before noon)
- Christmas Day, Thanksgiving Day, New Year's Day (actual holiday)
- January/February (except MLK/Presidents' Day weekends)

### Daily Peak Hours at JFK
- **5:00am - 8:00am**: PEAK (morning international + early domestic)
- **8:00am - 11:00am**: Moderate-High
- **11:00am - 2:00pm**: Lower (good window)
- **2:00pm - 4:00pm**: Lower-Moderate
- **4:00pm - 7:00pm**: PEAK (evening departures)
- **7:00pm - 10:00pm**: Moderate
- **10:00pm+**: Low (red-eye flights, limited services)

---

## TSA PreCheck & CLEAR Operating Hours (CRITICAL)

Services are NOT 24/7. If user's security time falls outside these hours, they get standard lane only.

### TSA PreCheck Hours at JFK
**General hours: 4:00am - 7:00pm** (varies by terminal)

| Terminal | PreCheck Hours | Notes |
|----------|---------------|-------|
| Terminal 1 | 4:00am - 8:00pm | May vary |
| Terminal 4 | 4:00am - 8:00pm | Multiple checkpoints |
| Terminal 5 | ~6:00am - 7:30pm | Can close early evenings |
| Terminal 7 | 4:00am - 7:00pm | Smaller terminal |
| Terminal 8 | 3:30am - 10:00pm | Longest hours |

**IMPORTANT:** If user has late evening flight (after 7pm) and has PreCheck, we should note: "PreCheck lanes may be closed. Allow extra time for standard screening."

### CLEAR Hours at JFK (Terminal 4 ONLY)
- **Location:** Terminal 4 departures level, near Row 1 at Delta Priority check-in
- **Hours:** 4:30am - 10:00pm (for CLEAR+ lane)
- **TSA PreCheck enrollment via CLEAR:** 4:30am - 8:00pm

**CRITICAL: CLEAR is CLOSED at Terminal 7** (temporarily closed since late 2022/early 2023)
- If user selects T7 flight and says they have CLEAR: "Note: CLEAR is temporarily closed at Terminal 7. You'll use PreCheck or standard screening."

### T4 RESERVE (Free Security Time Booking)
- **Availability:** Terminal 4 only
- **Booking window:** Up to 72 hours before departure
- **Website:** jfkt4.nyc
- **Hours:** Available during security operating hours
- We should PROMPT T4 users: "Pro tip: Book a free T4 RESERVE slot to skip the security line"

### Delta Touchless ID
- **Terminals:** T4 (both domestic and international sides)
- **Hours:** During security operating hours
- **Requirements:** TSA PreCheck + Valid US passport in SkyMiles profile + Opted in via Fly Delta app
- **Speed:** Fastest option available (~30 seconds at bag drop, near-instant at security)

---

## REAL ID Requirement (Effective May 2025)

**This is now enforced and can cause MAJOR delays if user doesn't have proper ID.**

### The Rule
- As of May 7, 2025, all domestic travelers 18+ MUST have REAL ID-compliant ID or acceptable alternative
- Non-compliant state IDs are NO LONGER ACCEPTED

### Acceptable IDs
- REAL ID-compliant driver's license (has ⭐ star symbol)
- US Passport or Passport Card
- US Military ID
- DHS Trusted Traveler cards (Global Entry, NEXUS, SENTRI)
- Permanent resident card
- State-issued Enhanced Driver's License (NY, MI, MN, VT, WA only)

### What Happens Without Proper ID
- Starting Feb 1, 2026: $45 fee for "TSA ConfirmID" alternative verification
- **Expect 30+ minutes additional processing time**
- User may miss flight

### Our Approach
- We should NOT ask about ID (assumes competence)
- But in the "Tips" section of results, include: "Don't forget: REAL ID or passport required"

---

## JFK Construction Situation (CRITICAL - Through 2030)

**This is not a minor inconvenience - Port Authority is literally telling people NOT to drive to JFK.**

### The Scope
- $19 billion redevelopment program
- New Terminal 1 + New Terminal 6 under construction
- Complete roadway network being rebuilt
- All happening while running record flight volumes

### Current Impacts (As of Jan 2026)

**Roadway Changes (October 2025 - Permanent):**
- Terminal 4: Now accessed ONLY via Van Wyck Expressway
- Terminal 8: Now accessed ONLY via JFK Expressway (NOT Van Wyck)
- Terminals 5 & 7: New permanent roadway pattern, earlier exits required
- Drivers MUST know their terminal before entering airport roads - turnoffs diverge sooner than before
- Repeat visitors following "muscle memory" WILL get confused

**What This Means for Travel Time:**
- Add 15-20 minutes to any driving estimate during construction hours
- Add 30+ minutes during peak hours (morning rush, evening rush, weekends)
- Belt Parkway, Nassau Expressway, and feeder ramps have recurring lane closures

**Port Authority's Official Advice:**
- "Do not drive directly to terminals if you can avoid it"
- Use public transit (AirTrain from Jamaica or Howard Beach)
- Use the FREE Lefferts Boulevard pickup/dropoff lot + AirTrain (8 min ride to terminals)

**Rideshare/Uber/Lyft Impacts:**
- Terminal 4: Remote pickup lot, shuttle bus required (12pm-2am daily)
- Terminals 5 & 7: Pickup moved to satellite lot at Howard Beach AirTrain station
- Curbside pickup still available for: disabilities, premium rideshare services

### Our Calculation Approach
1. Always fetch current traffic (not just distance-based estimates)
2. Add construction buffer: +15 min baseline, +30 min during peak
3. Note in breakdown: "JFK construction may cause additional delays"
4. For T4/T8 specifically, note access route changes

---

## Bag Check Cutoff Rules (JFK-Specific)

**CRITICAL: JFK has STRICTER rules than other airports**

| Scenario | Cutoff Before Departure |
|----------|------------------------|
| JFK domestic WITH checked bag | 60 minutes |
| JFK international WITH checked bag | 60 minutes |
| JFK domestic NO checked bag | 30 minutes |
| JFK international NO checked bag | 60 minutes |

Gate requirement: Must be at gate ready to board 15 minutes before departure.

Boarding typically begins: 30-40 minutes before departure (varies by airline/aircraft size).

---

## Security Time Estimates (Base Heuristics)

These are baseline estimates. Actual times fetched live, but we use these if live data unavailable.

### Standard (No PreCheck, No CLEAR)
| Time of Day | Terminal 1 | Terminal 4 | Terminal 5 | Terminal 7 | Terminal 8 |
|-------------|-----------|-----------|-----------|-----------|-----------|
| Off-peak | 20 min | 25 min | 15 min | 15 min | 20 min |
| Normal | 30 min | 35 min | 20 min | 20 min | 30 min |
| Peak (5-8am, 4-7pm) | 45 min | 50 min | 30 min | 30 min | 45 min |
| Holiday/Weekend peak | 60 min | 60+ min | 45 min | 40 min | 60 min |

### With TSA PreCheck
Reduce above times by 50-60%

### With CLEAR + PreCheck (Terminal 4 only)
Reduce to ~10-15 min regardless of time

### With Delta Touchless ID (Terminal 4 only)
~5-10 min - fastest option available

### With T4 RESERVE (Terminal 4 only)
Provides scheduled security time - essentially skip the line

---

## The Calculation Formula

```
LEAVE_BY_TIME = BOARDING_TIME - TOTAL_AIRPORT_TIME - TRAVEL_TIME - BUFFER

Where:

BOARDING_TIME = departure_time - boarding_buffer (usually 30 min domestic, 45 min international)

TOTAL_AIRPORT_TIME = 
  + curb_to_checkin_walk
  + checkin_time (if checking bag or no mobile boarding pass)
  + bag_drop_time (if checking bag)
  + checkin_to_security_walk
  + security_wait_time
  + security_screening_time
  + security_to_gate_walk

TRAVEL_TIME = fetched from Google Maps with current traffic

BUFFER = 30-45 min (this is our target buffer AFTER clearing security, before boarding)
```

### Time Component Details

**Curb to check-in walk:** 2-5 min (varies by terminal)

**Check-in time:**
- Mobile check-in done: 0 min
- Kiosk check-in: 5 min
- Counter check-in (no status): 10-15 min
- Counter check-in (priority status): 5 min
- First class/premium: 3-5 min

**Bag drop time:**
- Standard economy: 10-15 min
- Priority/status: 5-10 min
- First class: 3-5 min
- Delta with Touchless ID: ~30 seconds

**Security wait time:** Fetched live + adjusted for:
- Time of day
- Day of week (Mon AM, Fri PM, Sun PM = peak)
- Holidays
- Security type (standard/PreCheck/CLEAR/Touchless)

**Security screening time:**
- Standard: 5-7 min
- PreCheck: 2-3 min
- CLEAR: 3-5 min (biometric + screening)
- Touchless ID: 1-2 min

**Security to gate walk:** 5-15 min depending on terminal/concourse

---

## User Flow

### Screen 1: Flight Info Input
**Header:** "When should I leave?"
**Subheader:** "Enter your flight details"

**Fields:**
1. **Flight number** (e.g., "DL 405") - with airline auto-detect
   - Or: Dropdown to select Airline → then flight search
2. **Date** - Today/Tomorrow/Choose date (like Uber screenshot)
3. **Leaving from** - Text input accepting:
   - Zip code (e.g., "10019")
   - Neighborhood (e.g., "Upper West Side", "Williamsburg")
   - Address (optional - we note "we don't store your address")

**Below fields, checkboxes:**
- [ ] I have TSA PreCheck
- [ ] I have CLEAR
- [ ] I have Global Entry
- [ ] I have Delta Touchless ID (show only if Delta flight)

**Continue button**

### Screen 2: Options
**Header:** Your flight: DL 405 to LAX
**Subheader:** Departing 9:50am from Terminal 4

**Questions:**
1. **Are you checking a bag?**
   - Yes / No (big toggle buttons)

2. **What's your airline status?** (dropdown, only if relevant)
   - None
   - Delta Silver Medallion
   - Delta Gold Medallion
   - Delta Platinum Medallion
   - Delta Diamond Medallion / 360
   - First Class ticket
   
   (Options change based on airline detected from flight number)

**Calculate button**

### Screen 3: THE ANSWER

**Giant text:**
# Leave by 7:15am

**Below (expandable breakdown):**

| Step | Time |
|------|------|
| 🚗 Travel to JFK T4 | 45 min |
| 🧳 Check bag at counter | 10 min |
| 🚶 Walk to security | 5 min |
| 🔒 Security (PreCheck) | 15 min |
| 🚶 Walk to gate B32 | 8 min |
| ⏱️ Buffer before boarding | 35 min |

**Each row expandable for details:**
- Travel: "45 min via BQE → Van Wyck. Current traffic is moderate. Note: JFK construction may add delays."
- Security: "Terminal 4 PreCheck line currently showing 12 min wait. We added buffer for variability."

**Bottom options:**
- **"I want more buffer"** → Adds 15/30/45 min options
- **"Set reminder"** → Future feature
- **"Share"** → Copy link or text message

---

## Technical Implementation

### Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (customized with our design tokens)
- **Animation:** Framer Motion (motion.dev)
- **Fonts:** Google Fonts (Fraunces, DM Sans, JetBrains Mono)
- **Hosting:** Vercel (free tier to start)
- **Data fetching:** Server Actions + Server Components

### Project Structure
```
leaveby/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main app (single page with states)
│   ├── globals.css         # Tailwind + custom CSS vars
│   └── api/
│       └── calculate/
│           └── route.ts    # API endpoint for calculations
├── components/
│   ├── ui/                 # shadcn components (customized)
│   ├── FlightInput.tsx
│   ├── OptionsForm.tsx
│   ├── ThinkingState.tsx   # The "checking..." animation
│   ├── TimeReveal.tsx      # The big reveal moment
│   ├── Breakdown.tsx       # Expandable timeline
│   └── ProTip.tsx
├── lib/
│   ├── scrapers/
│   │   ├── flight.ts       # Flight info fetching
│   │   ├── traffic.ts      # Google Maps scraping
│   │   ├── security.ts     # TSA wait times
│   │   └── weather.ts      # Weather check
│   ├── calculator.ts       # Core calculation logic
│   ├── jfk-data.ts         # Static terminal knowledge
│   ├── calendar.ts         # Peak day detection
│   └── utils.ts
├── hooks/
│   └── useCalculation.ts   # State management for calc flow
└── public/
    └── fonts/              # Self-hosted fonts if needed
```

### Key Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "framer-motion": "^10.0.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",  // shadcn base
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.300.0",      // Icons
    "date-fns": "^3.0.0"             // Date handling
  }
}
```

### Calculation Flow (Server-Side)

```typescript
// app/api/calculate/route.ts
export async function POST(request: Request) {
  const { flightNumber, date, origin, options } = await request.json();
  
  // Stream progress updates to client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Step 1: Flight info
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'flight', status: 'loading' }) + '\n'
      ));
      const flight = await fetchFlightInfo(flightNumber, date);
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'flight', status: 'done', data: flight }) + '\n'
      ));
      
      // Step 2: Traffic
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'traffic', status: 'loading' }) + '\n'
      ));
      const traffic = await fetchTrafficTime(origin, flight.terminal);
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'traffic', status: 'done', data: traffic }) + '\n'
      ));
      
      // Step 3: Security
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'security', status: 'loading' }) + '\n'
      ));
      const security = await fetchSecurityWait(flight.terminal);
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'security', status: 'done', data: security }) + '\n'
      ));
      
      // Step 4: Weather
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'weather', status: 'loading' }) + '\n'
      ));
      const weather = await fetchWeather();
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'weather', status: 'done', data: weather }) + '\n'
      ));
      
      // Step 5: Calculate
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'calculating', status: 'loading' }) + '\n'
      ));
      const result = calculateLeaveByTime({
        flight, traffic, security, weather, options
      });
      controller.enqueue(encoder.encode(
        JSON.stringify({ step: 'done', result }) + '\n'
      ));
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
```

### Client-Side State Management

```typescript
// hooks/useCalculation.ts
type CalcState = 
  | { status: 'idle' }
  | { status: 'loading'; step: string; completedSteps: string[] }
  | { status: 'done'; result: CalculationResult }
  | { status: 'error'; message: string };

function useCalculation() {
  const [state, setState] = useState<CalcState>({ status: 'idle' });
  
  const calculate = async (params: CalcParams) => {
    setState({ status: 'loading', step: 'flight', completedSteps: [] });
    
    const response = await fetch('/api/calculate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const lines = decoder.decode(value).split('\n').filter(Boolean);
      for (const line of lines) {
        const update = JSON.parse(line);
        
        if (update.step === 'done') {
          setState({ status: 'done', result: update.result });
        } else if (update.status === 'loading') {
          setState(s => ({
            ...s,
            step: update.step
          }));
        } else if (update.status === 'done') {
          setState(s => ({
            ...s,
            completedSteps: [...s.completedSteps, update.step]
          }));
        }
      }
    }
  };
  
  return { state, calculate };
}
```

### Web Scraping Strategy

All scraping done server-side when user submits request:

```javascript
async function getLeaveByTime(flightNumber, date, origin, options) {
  // Parallel fetch all data sources
  const [
    flightInfo,
    travelTime,
    securityWait,
    weather,
    alerts
  ] = await Promise.all([
    fetchFlightInfo(flightNumber, date),
    fetchTravelTime(origin, terminal),
    fetchSecurityWaitTime(terminal),
    fetchWeather(),
    fetchAirportAlerts()
  ]);
  
  // Calculate and return
  return calculateLeaveByTime(flightInfo, travelTime, securityWait, options);
}
```

### Data Fetching Functions

**fetchFlightInfo(flightNumber, date)**
- Try Google Flights first
- Fallback to FlightAware public page
- Extract: departure time, terminal, gate, any delays

**fetchTravelTime(origin, terminal)**
- Parse origin (zip/neighborhood/address)
- Fetch Google Maps travel time to specific terminal
- Include current traffic conditions
- Note any incidents

**fetchSecurityWaitTime(terminal)**
- Scrape tsawaittimes.com for terminal
- Scrape flightqueue.com
- For T4: also check jfkt4.nyc
- Average/weight results, prefer most recent

**fetchWeather()**
- weather.gov API (free)
- Only flag if severe weather that could impact travel

**fetchAirportAlerts()**
- Check JFK construction site
- Check Port Authority advisories
- Flag any major impacts

---

## Design System

### Aesthetic Direction
**Nuuly-inspired:** Sophisticated, playful, female-forward without being pink-and-frilly. Clean, confident, trustworthy. The app should feel like a trusted friend who's really good at logistics - not a sterile utility.

### Colors
```css
:root {
  /* Primary - Trust & Calm */
  --primary: #1e3a5f;        /* Deep navy */
  --primary-light: #2d4a6f;
  
  /* Accent - Warm & Approachable */
  --accent: #e07b54;         /* Warm coral/terracotta */
  --accent-light: #f4a882;
  
  /* Background - Soft & Inviting */
  --bg-primary: #faf8f5;     /* Warm off-white/cream */
  --bg-secondary: #f5f2ed;
  
  /* Text */
  --text-primary: #2c2c2c;   /* Dark charcoal */
  --text-secondary: #6b6b6b;
  --text-muted: #9a9a9a;
  
  /* Success/Confidence */
  --success: #7fb685;        /* Sage green */
  
  /* Time Display */
  --time-gradient: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
}
```

### Typography
```css
/* Display - The Answer */
--font-display: 'Fraunces', serif;  /* Warm, characterful */

/* Body - Clean & Readable */
--font-body: 'DM Sans', sans-serif;  /* Modern, friendly */

/* Mono - For times/numbers in breakdown */
--font-mono: 'JetBrains Mono', monospace;
```

**Type Scale:**
- The BIG answer time: 72px+ on mobile, 96px+ on desktop
- Section headers: 24px
- Body: 16px
- Details/captions: 14px

### Component Library
**Use shadcn/ui as base** but customize heavily:
- Override default colors with our palette
- Add motion to all interactions
- Softer border-radius (12px default, 16px for cards)
- Generous padding (p-6 minimum on cards)

---

## Motion Design System

### Philosophy
Motion serves three purposes:
1. **Build trust** - Show we're doing real work
2. **Guide attention** - Lead the eye to what matters
3. **Create delight** - Make the app feel premium, not utilitarian

### Libraries
- **Framer Motion** (motion.dev) - Primary animation library
- **shadcn/ui** - Component base with custom animations
- Use CSS animations for simple micro-interactions

### Loading/Thinking States

When calculating, we show a sequence of "checking" states. This is NOT fake delay - we're actually fetching data, but we visualize each step.

```jsx
const thinkingSteps = [
  { id: 'flight', label: 'Finding your flight...', icon: Plane },
  { id: 'traffic', label: 'Checking current traffic...', icon: Car },
  { id: 'security', label: 'Scanning terminal security lines...', icon: Shield },
  { id: 'weather', label: 'Checking conditions...', icon: Cloud },
  { id: 'calculating', label: 'Crunching the numbers...', icon: Calculator },
];
```

**Animation for each step:**
```jsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
  className="flex items-center gap-3"
>
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
  >
    <Icon className="w-5 h-5 text-accent" />
  </motion.div>
  <span className="text-text-secondary">{label}</span>
</motion.div>
```

**Step progression:**
- Each step appears, holds for ~1-2 seconds (or until that data fetch completes)
- Subtle pulse animation on the active step
- Completed steps get a small checkmark, fade to muted
- Progress bar at bottom fills smoothly

**Visual treatment:**
- Centered on screen
- Soft card background
- Subtle gradient shimmer effect behind the active step
- The whole thing feels like the app is "focusing" on your request

### The Big Reveal

This is THE moment. The answer appears and it needs to feel definitive.

**Reveal Animation Sequence:**
```jsx
// 1. Background shifts slightly (anticipation)
<motion.div
  initial={{ scale: 1 }}
  animate={{ scale: 1.02 }}
  transition={{ duration: 0.3 }}
/>

// 2. Time digits roll in like a slot machine / flip clock
<motion.div className="time-display">
  {timeDigits.map((digit, i) => (
    <motion.span
      key={i}
      initial={{ y: 40, opacity: 0, rotateX: -90 }}
      animate={{ y: 0, opacity: 1, rotateX: 0 }}
      transition={{ 
        delay: i * 0.08,  // Stagger each digit
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]  // Custom spring-like ease
      }}
    >
      {digit}
    </motion.span>
  ))}
</motion.div>

// 3. "Leave by" label fades in above
<motion.span
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4, duration: 0.3 }}
  className="text-text-secondary text-lg"
>
  Leave by
</motion.span>

// 4. Subtle celebration particles (optional, not cheesy)
// Think: tiny dots that float up and fade, like champagne bubbles
```

**Time Display Styling:**
```jsx
<div className="relative">
  {/* Glow effect behind time */}
  <div className="absolute inset-0 blur-3xl bg-accent/20 rounded-full" />
  
  {/* The actual time */}
  <h1 className="
    font-display 
    text-7xl md:text-9xl 
    font-bold 
    text-primary
    tracking-tight
    relative z-10
  ">
    7:15<span className="text-4xl md:text-5xl ml-2">am</span>
  </h1>
</div>
```

### Breakdown Reveal

After the main time lands, the breakdown slides in from below.

```jsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.8, duration: 0.5, ease: "easeOut" }}
>
  <BreakdownCard />
</motion.div>
```

**Breakdown rows animate in staggered:**
```jsx
{breakdownSteps.map((step, i) => (
  <motion.div
    key={step.id}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 1 + (i * 0.1), duration: 0.3 }}
    className="breakdown-row"
  >
    {/* Step content */}
  </motion.div>
))}
```

### Expandable Details

When user taps a breakdown row to see details:

```jsx
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: "auto", opacity: 1 }}
  exit={{ height: 0, opacity: 0 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
>
  <div className="pl-8 py-3 text-sm text-text-secondary">
    {detailText}
  </div>
</motion.div>
```

### Micro-interactions

**Buttons:**
```jsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
  className="..."
>
  {children}
</motion.button>
```

**Checkboxes (for PreCheck, CLEAR, etc):**
```jsx
// When checked, the checkmark draws in
<motion.svg
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  <motion.path d="M5 12l5 5L20 7" />
</motion.svg>
```

**Input focus:**
```jsx
// Subtle glow on focus
<motion.div
  animate={{ 
    boxShadow: isFocused 
      ? "0 0 0 3px rgba(224, 123, 84, 0.2)" 
      : "0 0 0 0px rgba(224, 123, 84, 0)"
  }}
  transition={{ duration: 0.2 }}
>
  <Input />
</motion.div>
```

### Page Transitions

Between screens, use shared layout animations:

```jsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentScreen}
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    {screenContent}
  </motion.div>
</AnimatePresence>
```

### Special States

**"Already too late" warning:**
- Time displays in coral/red tone instead of navy
- Subtle pulse animation to draw attention
- Warning icon animates in with a shake

**Holiday/Peak day badge:**
```jsx
<motion.span
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 500, damping: 25 }}
  className="badge bg-accent/10 text-accent"
>
  🔥 Peak travel day
</motion.span>
```

**Pro tip callouts (like T4 RESERVE):**
```jsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  className="bg-success/10 border border-success/20 rounded-xl p-4"
>
  <span className="text-success font-medium">💡 Pro tip:</span>
  <span className="text-text-secondary ml-2">
    Book a free T4 RESERVE slot to skip the security line
  </span>
</motion.div>
```

---

## UI Component Specifications

### Screen 1: Flight Input

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         [Logo/Brand]            │
│                                 │
│     When should you leave?      │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Flight number             │  │
│  │ [DL 405                 ] │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌─────────┐ ┌─────────┐ ┌───┐  │
│  │ Today   │ │Tomorrow │ │ 📅│  │
│  └─────────┘ └─────────┘ └───┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Where are you leaving     │  │
│  │ from?                     │  │
│  │ [Zip, neighborhood, or   ]│  │
│  │ [address                 ]│  │
│  └───────────────────────────┘  │
│  (we don't store your location) │
│                                 │
│  Security status:               │
│  ┌──┐ TSA PreCheck             │
│  └──┘                          │
│  ┌──┐ CLEAR                    │
│  └──┘                          │
│  ┌──┐ Global Entry             │
│  └──┘                          │
│                                 │
│  ┌───────────────────────────┐  │
│  │        Continue →          │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Screen 2: Options

**Layout:**
```
┌─────────────────────────────────┐
│ ←                               │
│                                 │
│  Your flight                    │
│  ┌───────────────────────────┐  │
│  │ DL 405 to Los Angeles     │  │
│  │ Today • 9:50am • Terminal 4│ │
│  └───────────────────────────┘  │
│                                 │
│  Are you checking a bag?        │
│  ┌─────────────┐┌─────────────┐ │
│  │     Yes     ││      No     │ │
│  └─────────────┘└─────────────┘ │
│                                 │
│  Your airline status            │
│  ┌───────────────────────────┐  │
│  │ None (General boarding)  ▼│  │
│  └───────────────────────────┘  │
│                                 │
│  [If Delta + has Touchless]:    │
│  ┌──┐ I have Delta Touchless ID │
│  └──┘                          │
│                                 │
│  ┌───────────────────────────┐  │
│  │    Calculate my time →     │  │
│  └───────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### Screen 3: Calculating (Thinking State)

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│                                 │
│         ┌─────────────┐         │
│         │             │         │
│         │   [card]    │         │
│         │             │         │
│         │  ✓ Found your flight  │
│         │  ✓ Checked traffic    │
│         │  → Scanning security  │ ← active, pulsing
│         │    lines...           │
│         │  ○ Checking weather   │ ← upcoming, muted
│         │  ○ Calculating...     │
│         │             │         │
│         │  ━━━━━━━━━━━━━━━━━   │ ← progress bar
│         │             │         │
│         └─────────────┘         │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### Screen 4: The Answer

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         Leave by                │
│                                 │
│       ╔═══════════════╗         │
│       ║               ║         │
│       ║    7:15am     ║  ← THE MOMENT (updates live with slider)
│       ║               ║         │
│       ╚═══════════════╝         │
│                                 │
│   This gives you 40 min after   │
│   security, before boarding     │
│                                 │
│   Less ←━━━━━━━●━━━━━━━→ More   │  ← SLIDER (15-60 min range)
│          ↑                      │
│     Dragging this instantly     │
│     updates the time above      │
│                                 │
│  [if peak day]:                 │
│  🔥 Peak travel day - we        │
│     recommend extra buffer      │
│                                 │
│  ┌───────────────────────────┐  │
│  │ How we calculated this   ▼│  │
│  ├───────────────────────────┤  │
│  │ 🚗 Travel to JFK T4  45m  │  │
│  │ 🧳 Bag drop          10m  │  │
│  │ 🚶 Walk to security   5m  │  │
│  │ 🔒 Security (Pre✓)   12m  │  │
│  │ 🚶 Walk to gate       8m  │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━ │  │
│  │ Total: 80 min + 40 buffer │  │
│  └───────────────────────────┘  │
│                                 │
│  💡 Pro tip: Book a free T4     │
│     RESERVE slot to skip the    │
│     security line               │
│                                 │
│  ┌─────────────────────────┐    │
│  │    Share 📤             │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

**Buffer Slider Behavior:**
```jsx
// The slider controls buffer time (15-60 min range)
// Default: 40 min (our recommended buffer)
// As user drags, the leave-by time updates INSTANTLY

const [bufferMinutes, setBufferMinutes] = useState(40);

// Calculate leave time reactively
const leaveByTime = useMemo(() => {
  const boardingTime = subMinutes(departureTime, 30); // boarding starts 30 min before
  const targetArrival = subMinutes(boardingTime, bufferMinutes);
  const leaveTime = subMinutes(targetArrival, totalAirportTime + travelTime);
  return leaveTime;
}, [bufferMinutes, departureTime, totalAirportTime, travelTime]);

// Slider component
<div className="flex items-center gap-4">
  <span className="text-sm text-text-muted">Less</span>
  <Slider
    value={[bufferMinutes]}
    onValueChange={([val]) => setBufferMinutes(val)}
    min={15}
    max={60}
    step={5}
    className="flex-1"
  />
  <span className="text-sm text-text-muted">More</span>
</div>

// The time display animates smoothly when buffer changes
<motion.h1
  key={leaveByTime.toISOString()} // re-animate on change
  initial={{ scale: 0.95, opacity: 0.5 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.15 }}
>
  {format(leaveByTime, 'h:mm')}
  <span className="text-4xl ml-1">{format(leaveByTime, 'a')}</span>
</motion.h1>
```

**Buffer Context Line:**
```jsx
<motion.p 
  className="text-text-secondary text-center"
  key={bufferMinutes} // animate when changes
  initial={{ opacity: 0.5 }}
  animate={{ opacity: 1 }}
>
  This gives you <span className="font-semibold text-primary">{bufferMinutes} min</span> after security, before boarding
</motion.p>
```

### Expanded Breakdown Row

When user taps a row:
```
┌───────────────────────────────┐
│ 🚗 Travel to JFK T4      45m  │
│   ────────────────────────    │
│   Via BQE → Van Wyck.         │
│   Current traffic: Moderate   │
│   ⚠️ JFK construction may     │
│   add delays                  │
└───────────────────────────────┘
```

---

## Edge Cases to Handle

### Flight-Related
1. **Flight not found:** "We couldn't find that flight. Double-check the number or enter your flight details manually."

2. **Flight delayed:** Show updated time, recalculate. "Your flight is delayed 45 min. New departure: 10:35am. Leave by 7:45am instead."

3. **Flight cancelled:** "This flight appears to be cancelled. Check with your airline for rebooking options."

4. **Unknown terminal:** Some flights don't have terminal assigned until day-of. Show estimate based on airline's usual terminal + note: "Terminal not yet confirmed. We're estimating based on [Airline]'s usual terminal."

5. **Red-eye/overnight:** Handle date rollover correctly. Make sure "Leave by 11:45pm" is clearly on the PREVIOUS day.

6. **Very early morning flight (before 5am):** Note that some services (PreCheck, CLEAR, food options) may not be available. Security checkpoints are always open but dedicated lanes may not be.

### Security/Status Related
7. **User has CLEAR but flying from T7:** "Note: CLEAR is temporarily closed at Terminal 7. Your security time reflects PreCheck/standard screening."

8. **User has PreCheck but flying late evening:** "Note: PreCheck lanes typically close around 7-8pm. If you arrive after that, you may need to use standard screening."

9. **User has Delta Touchless ID but NOT PreCheck:** This shouldn't happen (Touchless requires PreCheck), but if they claim it, verify.

10. **User has status but wrong airline:** If they select "Delta Diamond" but flying American, we should clarify or ignore the status.

### Time/Calendar Related
11. **Holiday travel:** Automatically detect if flight is on/near major holiday. Add appropriate buffer and note: "This is a peak travel day (Sunday after Thanksgiving). Security lines may be significantly longer than usual."

12. **Already too late:** "Based on current conditions, you'd need to leave NOW to make this flight comfortably. Consider TSA PreCheck lane (if you have it) or expedited options."

13. **Way too early:** If calculation shows they need to leave in 8+ hours, just show the time without drama.

### Location Related
14. **Origin too vague:** If they enter just "Brooklyn" - we might need to clarify or pick a central point.

15. **Origin outside NYC metro:** If they're coming from far away (NJ suburbs, CT, etc.), calculations still work but note longer travel time.

16. **International arriving at JFK to connect:** Different scenario - they're already at airport. Future feature.

### Technical/Data Related
17. **Live data unavailable:** Fall back to our heuristics with slightly more buffer. Note: "Using estimated times (live data temporarily unavailable)."

18. **Conflicting data sources:** Use most conservative (longer) estimate.

19. **Stale data:** If security wait time data is >2 hours old, note it and add buffer.

---

## Success Metrics

1. **Accuracy:** Did users make their flight with the stated buffer? (Need feedback mechanism)
2. **Usage:** How many calculations per day
3. **Sharing:** How often is the app shared
4. **Return usage:** Do users come back for next trip

---

## Future Features (Not MVP)

- LGA and EWR support
- Save trips / trip history
- Reminder notifications ("Leave in 30 minutes!")
- Integration with calendar
- Flight delay alerts
- "Share my ETA" with family/pickup person
- Account system to save preferences
- Real-time updates ("Traffic just got worse - leave 10 min earlier")

---

## Development Features (For Claude Code)

Organize development into these discrete features. Each feature should be buildable and testable independently.

---

### Feature 1: Project Setup & Design System
**Goal:** Scaffold the Next.js project with all design tokens, fonts, and base components.

**Tasks:**
- [ ] Initialize Next.js 14 project with App Router
- [ ] Install and configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Install Framer Motion
- [ ] Set up Google Fonts (Fraunces, DM Sans, JetBrains Mono)
- [ ] Create `globals.css` with CSS variables (colors, typography)
- [ ] Customize shadcn theme to match our design tokens
- [ ] Create base layout component with proper fonts applied
- [ ] Test: App loads with correct fonts and colors

**Files to create:**
```
app/layout.tsx
app/globals.css
tailwind.config.ts
components.json (shadcn config)
lib/utils.ts
```

---

### Feature 2: Static JFK Data Module
**Goal:** Create the comprehensive JFK terminal knowledge base as a typed data module.

**Tasks:**
- [ ] Define TypeScript types for Terminal, Airline, SecurityOption
- [ ] Create terminal data (T1, T4, T5, T7, T8) with all details
- [ ] Create airline-to-terminal mapping
- [ ] Create security options data (PreCheck hours, CLEAR status, etc.)
- [ ] Create peak travel calendar data
- [ ] Create bag check cutoff rules
- [ ] Add helper functions: `getTerminalForAirline()`, `isPeakDay()`, `isPreCheckOpen()`, etc.
- [ ] Test: Can look up any airline and get correct terminal + details

**Files to create:**
```
lib/jfk-data/terminals.ts
lib/jfk-data/airlines.ts
lib/jfk-data/security.ts
lib/jfk-data/calendar.ts
lib/jfk-data/rules.ts
lib/jfk-data/index.ts (exports all)
types/jfk.ts
```

---

### Feature 3: Flight Input Screen (UI Only)
**Goal:** Build the first screen where users enter flight info.

**Tasks:**
- [ ] Create `FlightInput` component
- [ ] Flight number input with airline auto-detection (parse "DL", "AA", etc.)
- [ ] Date selector (Today / Tomorrow / Calendar picker)
- [ ] Origin location input (zip/neighborhood/address)
- [ ] Security status checkboxes (PreCheck, CLEAR, Global Entry)
- [ ] Form validation
- [ ] "Continue" button
- [ ] Mobile-responsive layout
- [ ] Add micro-interactions (focus states, button hover/tap)
- [ ] Test: Can fill out form and submit (logs to console)

**Files to create:**
```
components/FlightInput.tsx
components/ui/date-selector.tsx (custom)
components/ui/checkbox-group.tsx (custom)
app/page.tsx (integrate FlightInput)
```

---

### Feature 4: Options Screen (UI Only)
**Goal:** Build the second screen where users specify bag/status options.

**Tasks:**
- [ ] Create `OptionsForm` component
- [ ] Display detected flight info (flight number, destination, time, terminal)
- [ ] "Checking a bag?" toggle buttons (Yes/No)
- [ ] Airline status dropdown (dynamic based on airline)
- [ ] Delta Touchless ID checkbox (only show for Delta flights)
- [ ] "Calculate" button
- [ ] Page transition animation from Screen 1
- [ ] Test: Can select options and submit

**Files to create:**
```
components/OptionsForm.tsx
components/FlightSummaryCard.tsx
lib/airline-status-options.ts (status tiers by airline)
```

---

### Feature 5: Thinking/Loading State
**Goal:** Build the animated "calculating" screen that shows progress.

**Tasks:**
- [ ] Create `ThinkingState` component
- [ ] Define 5 thinking steps with icons
- [ ] Animate step progression (fade in/out, checkmarks)
- [ ] Rotating icon for active step
- [ ] Progress bar that fills
- [ ] Accept `currentStep` and `completedSteps` as props
- [ ] Subtle card styling with gradient shimmer
- [ ] Test: Can cycle through all steps with mock data

**Files to create:**
```
components/ThinkingState.tsx
components/ThinkingStep.tsx
```

---

### Feature 6: Time Reveal Animation
**Goal:** Build the dramatic time reveal moment.

**Tasks:**
- [ ] Create `TimeReveal` component
- [ ] Digit-by-digit roll-in animation (flip clock style)
- [ ] "Leave by" label fade-in
- [ ] Glow effect behind time
- [ ] Smooth re-animation when time changes (for slider)
- [ ] Support different sizes (large for reveal, updates when adjusting)
- [ ] Test: Renders time with animation, re-animates on prop change

**Files to create:**
```
components/TimeReveal.tsx
components/TimeDigit.tsx (individual digit animation)
```

---

### Feature 7: Buffer Slider & Real-time Updates
**Goal:** Build the buffer adjustment slider that updates time in real-time.

**Tasks:**
- [ ] Create `BufferSlider` component using shadcn Slider
- [ ] Range: 15-60 minutes, step: 5 minutes
- [ ] Default: 40 minutes
- [ ] "Less" / "More" labels on ends
- [ ] Context text: "This gives you X min after security, before boarding"
- [ ] On change, emit new buffer value to parent
- [ ] Parent recalculates leave time instantly
- [ ] Time display animates smoothly on change
- [ ] Test: Dragging slider updates displayed time

**Files to create:**
```
components/BufferSlider.tsx
hooks/useLeaveTimeCalculation.ts (reactive calculation)
```

---

### Feature 8: Breakdown Timeline
**Goal:** Build the expandable breakdown showing how time was calculated.

**Tasks:**
- [ ] Create `Breakdown` component
- [ ] List of breakdown rows with icons and times
- [ ] Each row expandable to show details
- [ ] Expand/collapse animation (height + opacity)
- [ ] Total line at bottom
- [ ] Staggered entrance animation
- [ ] Test: Can expand/collapse each row

**Files to create:**
```
components/Breakdown.tsx
components/BreakdownRow.tsx
types/breakdown.ts
```

---

### Feature 9: Results Screen (Composition)
**Goal:** Compose all results components into the final answer screen.

**Tasks:**
- [ ] Create `ResultsScreen` component
- [ ] Integrate TimeReveal, BufferSlider, Breakdown
- [ ] Add peak day warning badge (conditional)
- [ ] Add pro tips (conditional based on terminal)
- [ ] Add share button (copy to clipboard for now)
- [ ] Handle "already too late" state (different styling)
- [ ] Page transition animation from thinking state
- [ ] Test: Full results screen renders with all components

**Files to create:**
```
components/ResultsScreen.tsx
components/PeakDayBadge.tsx
components/ProTip.tsx
components/ShareButton.tsx
```

---

### Feature 10: Flight Data Scraper
**Goal:** Fetch flight info from free public sources.

**Tasks:**
- [ ] Create `fetchFlightInfo()` function
- [ ] Try FlightAware public page first
- [ ] Parse: departure time, terminal, gate (if available), delays
- [ ] Fallback to Google Flights scraping
- [ ] Handle flight not found
- [ ] Handle flight cancelled/delayed
- [ ] Return typed FlightInfo object
- [ ] Test: Can look up real flight numbers and get correct data

**Files to create:**
```
lib/scrapers/flight.ts
types/flight.ts
```

---

### Feature 11: Traffic/Travel Time Scraper
**Goal:** Fetch real-time travel time from origin to JFK terminal.

**Tasks:**
- [ ] Create `fetchTravelTime()` function
- [ ] Parse origin (zip code, neighborhood name, or address)
- [ ] Map neighborhood names to approximate coordinates
- [ ] Scrape Google Maps for travel time with current traffic
- [ ] Add JFK construction buffer (+15-30 min based on time)
- [ ] Return travel time in minutes + route description
- [ ] Test: Can get travel time from "10019" to "JFK Terminal 4"

**Files to create:**
```
lib/scrapers/traffic.ts
lib/neighborhoods.ts (NYC neighborhood -> coords mapping)
types/traffic.ts
```

---

### Feature 12: Security Wait Time Scraper
**Goal:** Fetch current TSA security wait times for JFK terminals.

**Tasks:**
- [ ] Create `fetchSecurityWaitTime()` function
- [ ] Scrape tsawaittimes.com for terminal
- [ ] Scrape flightqueue.com as backup
- [ ] For T4: also check jfkt4.nyc
- [ ] Weight/average multiple sources
- [ ] Adjust for time of day if live data unavailable
- [ ] Adjust for PreCheck/CLEAR/Touchless
- [ ] Return wait time + confidence note
- [ ] Test: Can get current wait time for each terminal

**Files to create:**
```
lib/scrapers/security.ts
types/security.ts
```

---

### Feature 13: Weather Checker
**Goal:** Check for weather that might impact travel.

**Tasks:**
- [ ] Create `fetchWeather()` function
- [ ] Use weather.gov API (free)
- [ ] Check for: snow, heavy rain, fog, severe weather
- [ ] Return weather status + any travel impact notes
- [ ] Test: Can get current weather for JFK area

**Files to create:**
```
lib/scrapers/weather.ts
types/weather.ts
```

---

### Feature 14: Core Calculation Engine
**Goal:** The brain - calculate leave-by time from all inputs.

**Tasks:**
- [ ] Create `calculateLeaveByTime()` function
- [ ] Input: flight info, travel time, security wait, options, buffer
- [ ] Calculate each component:
  - Curb to check-in walk
  - Check-in time (based on status, bag)
  - Bag drop time (if applicable)
  - Walk to security
  - Security wait (adjusted for PreCheck/CLEAR/etc)
  - Security screening time
  - Walk to gate (including T8 Concourse C!)
- [ ] Apply peak day multipliers
- [ ] Apply construction buffers
- [ ] Check bag cutoff constraints (60 min for JFK)
- [ ] Return: leave time, breakdown array, warnings, pro tips
- [ ] Test: Given mock inputs, produces correct leave time

**Files to create:**
```
lib/calculator.ts
types/calculation.ts
```

---

### Feature 15: API Endpoint with Streaming
**Goal:** Server endpoint that orchestrates scraping and streams progress.

**Tasks:**
- [ ] Create `/api/calculate` route
- [ ] Accept POST with flight number, date, origin, options
- [ ] Stream progress updates as each scraper completes
- [ ] Format: newline-delimited JSON
- [ ] Handle errors gracefully (fallback to heuristics)
- [ ] Return final calculation result
- [ ] Test: Can call endpoint and receive streamed updates

**Files to create:**
```
app/api/calculate/route.ts
```

---

### Feature 16: Client-Side State Management
**Goal:** Connect UI to API and manage calculation flow.

**Tasks:**
- [ ] Create `useCalculation` hook
- [ ] States: idle, loading (with step tracking), done, error
- [ ] Call API and parse streamed responses
- [ ] Update thinking state as steps complete
- [ ] Store final result
- [ ] Handle errors with user-friendly messages
- [ ] Test: Full flow from form submit to results

**Files to create:**
```
hooks/useCalculation.ts
```

---

### Feature 17: Full App Integration
**Goal:** Wire everything together into the complete app.

**Tasks:**
- [ ] Main page manages current screen state
- [ ] Screen 1 → Screen 2 → Thinking → Results flow
- [ ] Page transitions with AnimatePresence
- [ ] Back navigation
- [ ] Error states with retry
- [ ] Test: Complete end-to-end flow with real flight

**Files to modify:**
```
app/page.tsx
```

---

### Feature 18: Edge Cases & Polish
**Goal:** Handle all edge cases and add final polish.

**Tasks:**
- [ ] Flight not found UI
- [ ] Flight delayed/cancelled UI
- [ ] "Already too late" warning UI
- [ ] Unknown terminal handling
- [ ] Late evening PreCheck closed warning
- [ ] CLEAR closed at T7 note
- [ ] Peak day detection and badge
- [ ] Pro tip logic (T4 RESERVE, etc.)
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Test: Each edge case scenario

---

### Feature 19: Mobile Optimization
**Goal:** Ensure perfect mobile experience.

**Tasks:**
- [ ] Test all screens on mobile viewports
- [ ] Touch-friendly tap targets (min 44px)
- [ ] Slider works well on touch
- [ ] Keyboard doesn't cover inputs
- [ ] Safe area insets (notch, home indicator)
- [ ] Performance on slower devices
- [ ] Test: Use on actual phone

---

### Feature 20: Share Functionality
**Goal:** Let users share their result.

**Tasks:**
- [ ] Copy result to clipboard (formatted text)
- [ ] Native share sheet on mobile (if supported)
- [ ] Share text format: "Leave by 7:15am for DL 405 to LAX (40 min buffer)"
- [ ] Success toast/feedback
- [ ] Test: Can share result

---

## Development Order (Recommended)

**Phase 1: Foundation (Features 1-2)**
Get the project set up and JFK data in place.

**Phase 2: UI Shells (Features 3-9)**
Build all the UI components with mock data. App should be fully clickable.

**Phase 3: Data Layer (Features 10-14)**
Build all scrapers and calculation engine. Test independently.

**Phase 4: Integration (Features 15-17)**
Connect UI to backend. Full flow working.

**Phase 5: Polish (Features 18-20)**
Edge cases, mobile, sharing.

---

## Open Questions for User

1. ✅ Name confirmed: **LeaveBy**
2. Do you want to soft-launch to friends/family first for feedback?
3. Any specific scenarios I should test first (your fiancée's common flights)?
4. Custom domain? (leaveby.app, leaveby.co, whenshouldialeave.com, etc.)

---

## Self-Validation Checklist

**"Would I 100% rely on this and recommend to people I care about?"**

### Completeness Check ✅

| Category | Covered? | Notes |
|----------|----------|-------|
| All 5 JFK terminals | ✅ | T1, T4, T5, T7, T8 with full details |
| All major airlines | ✅ | Listed by terminal |
| TSA PreCheck | ✅ | Including operating hours per terminal |
| CLEAR | ✅ | Including T7 closure status |
| Global Entry | ✅ | Treated same as PreCheck for domestic |
| Delta Touchless ID | ✅ | Requirements and availability |
| T4 RESERVE | ✅ | Free booking system |
| Checked bag rules | ✅ | JFK-specific 60 min rule |
| Airline status tiers | ✅ | Affects check-in/bag drop time |
| Construction impacts | ✅ | Detailed roadway changes |
| Peak travel days | ✅ | Full 2026 calendar |
| Daily peak hours | ✅ | By time of day |
| REAL ID requirement | ✅ | Current rules |
| Service operating hours | ✅ | When PreCheck/CLEAR close |
| Terminal walk times | ✅ | Including T8 Concourse C tunnel |
| Rideshare/pickup changes | ✅ | Remote lots, construction impacts |

### Scenario Testing (Run These Before Launch)

1. **Delta flight from Manhattan to LAX, Tuesday 9am, PreCheck, no bag**
   - Should recommend: Leave ~6:15-6:30am (depends on traffic)
   - Should note: T4, use CLEAR or Touchless if available

2. **JetBlue flight from Brooklyn to BOS, Friday 6pm, no PreCheck, checked bag**
   - Should recommend: Leave ~2:30-3:00pm
   - Should note: T5, Friday evening = busy, 60 min bag check cutoff

3. **American flight from Upper West Side to MIA, Sunday after Thanksgiving, PreCheck, no bag**
   - Should recommend: Leave VERY early (add 50%+ to security)
   - Should note: T8, peak travel day warning, Concourse C walk time if applicable

4. **Aer Lingus to Dublin from Hoboken, Wednesday 7pm, has CLEAR, checked bag**
   - Should recommend: Standard calculation
   - Should note: T7, **CLEAR IS CLOSED**, international 60 min bag cutoff

5. **Delta flight, 10pm departure, has PreCheck**
   - Should recommend: Standard calculation
   - Should note: PreCheck lanes may be closed after ~8pm

6. **Same-day booking, flight in 3 hours**
   - Should show realistic assessment
   - If cutting it close: clear warning

### Speed/Simplicity Check

- [ ] Can complete flow in under 60 seconds?
- [ ] Mobile-friendly tap targets?
- [ ] No confusing jargon?
- [ ] Answer is unmistakably clear?
- [ ] Breakdown is optional (not forced)?

### Trust Check

- [ ] Every number in breakdown is defensible?
- [ ] Sources cited where relevant?
- [ ] No hedging language?
- [ ] Handles edge cases gracefully?
- [ ] Fails gracefully if data unavailable?
