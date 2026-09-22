import OpenAI from "openai";

let client: OpenAI | null = null;

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openai(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

/** Fast model for structured lookups (flight/airport resolution). */
export const FAST_MODEL = process.env.OPENAI_FAST_MODEL ?? "gpt-4.1";
