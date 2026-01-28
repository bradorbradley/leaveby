import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a helpful assistant that provides real-time travel information for flights departing from JFK airport.

When given flight details, you need to search for and provide:
1. Flight status (on time, delayed, cancelled) and departure time
2. Which terminal the flight departs from
3. Current traffic conditions from the origin to JFK
4. Current TSA security wait times at that terminal
5. Any weather that might impact travel

IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format, no other text:

{
  "flight": {
    "status": "on_time" | "delayed" | "cancelled",
    "departureTime": "HH:MM AM/PM",
    "terminal": "1" | "4" | "5" | "7" | "8",
    "gate": "string or null",
    "delayMinutes": number or null,
    "destination": "city name",
    "isInternational": boolean
  },
  "traffic": {
    "durationMinutes": number,
    "description": "brief description of route and conditions",
    "level": "light" | "moderate" | "heavy" | "severe"
  },
  "security": {
    "estimatedWaitMinutes": number,
    "notes": "any relevant notes about security"
  },
  "weather": {
    "conditions": "brief description",
    "impactOnTravel": "none" | "minor" | "moderate" | "severe"
  },
  "warnings": ["array of any important warnings"],
  "tips": ["array of helpful tips for this specific trip"]
}

Use web search to find current, real-time information. Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

If you cannot find specific real-time data, make reasonable estimates based on:
- Typical traffic patterns for the time of day
- Historical TSA wait times for that terminal
- Standard flight operations

Always provide the JSON response, even if some data is estimated.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flightNumber, date, origin, hasPrecheck, hasClear, checkingBag } = body;

    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const userPrompt = `I need real-time travel information for this JFK flight:

Flight: ${flightNumber}
Date: ${dateStr}
Scheduled departure: around ${timeStr}
Traveling from: ${origin}
Security: ${hasPrecheck ? 'Has TSA PreCheck' : 'Standard screening'}${hasClear ? ', Has CLEAR' : ''}
Bags: ${checkingBag ? 'Checking a bag' : 'Carry-on only'}

Please search for:
1. Current status of flight ${flightNumber} - is it on time? What terminal and gate?
2. Current traffic conditions from ${origin} to JFK airport
3. Current TSA security wait times at the departing terminal
4. Current weather conditions that might affect travel

Respond with ONLY the JSON object, no other text.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: userPrompt }
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
      // Try to extract JSON from the response (in case there's any extra text)
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
