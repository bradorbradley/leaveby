import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTimeShort(date: Date): { time: string; period: string } {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  const time = `${displayHours}:${minutes.toString().padStart(2, "0")}`;
  return { time, period };
}

export function parseFlightNumber(input: string): {
  airline: string;
  number: string;
} | null {
  const cleaned = input.replace(/\s+/g, "").toUpperCase();
  const match = cleaned.match(/^([A-Z]{2})(\d+)$/);
  if (!match) return null;
  return { airline: match[1], number: match[2] };
}
