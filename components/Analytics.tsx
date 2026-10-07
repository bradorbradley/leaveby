"use client";

import { Analytics as VercelAnalytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { useEffect } from "react";
import { sanitizedPageUrl } from "@/lib/analytics";
import { privacyOptOut, track } from "@/lib/track";

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (privacyOptOut()) return null;
  const url = sanitizedPageUrl(event.url);
  return url ? { ...event, url } : null;
}

export function Analytics() {
  useEffect(() => { track("visit_started"); }, []);
  // Preserve working Vercel pageviews; product events use the free PostHog integration.
  return <VercelAnalytics beforeSend={beforeSend} debug={false} />;
}
