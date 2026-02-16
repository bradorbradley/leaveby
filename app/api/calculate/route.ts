import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightNumber, airport, date, origin, hasPrecheck, hasClear, hasGlobalEntry, checkingBag, airlineStatus } = body;

    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const prompt = `I need to catch flight ${flightNumber} from ${airport} airport.

Details:
- Date: ${dateStr}
- Leaving from: ${origin}
- Security: ${hasPrecheck || hasGlobalEntry ? 'TSA PreCheck' : 'Standard screening'}${hasClear ? ' + CLEAR' : ''}
- Bags: ${checkingBag ? 'Checking a bag' : 'Carry-on only'}
${airlineStatus && airlineStatus !== 'none' ? `- Airline status: ${airlineStatus}` : ''}

Tell me:
1. What terminal does this flight depart from?
2. How long will it take to get from ${origin} to ${airport} airport right now?
3. What are current TSA security wait times at that terminal?
4. Any weather, construction, or other issues I should know about?
5. What time should I leave to make this flight comfortably?

Give me a definitive "leave by" time - not a range. Be specific.

Respond with ONLY this JSON format, no other text:
{
  "leaveByTime": "7:15 AM",
  "flight": {
    "airline": "Delta",
    "number": "405",
    "destination": "Los Angeles",
    "terminal": "2",
    "departureTime": "10:30 AM",
    "isInternational": false
  },
  "breakdown": {
    "travelMinutes": 45,
    "travelDescription": "Via I-85 S, moderate traffic expected",
    "securityMinutes": 25,
    "securityDescription": "PreCheck line currently ~15 min, added buffer for variability",
    "airportBufferMinutes": 15,
    "airportBufferDescription": "Walk to gate, any last-minute needs"
  },
  "totalMinutes": 120,
  "warnings": ["Array of any important warnings - construction, weather, delays, etc"],
  "tips": ["Array of helpful tips specific to this airport/terminal/situation"]
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        { role: "user", content: prompt }
      ],
    });

    // Extract the text response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response
    let data;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent.text);
      throw new Error('Failed to parse response');
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
