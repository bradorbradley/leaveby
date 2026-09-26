"use client";

import { useCallback, useRef, useState } from "react";

import type { FlightInfo } from "@/types/flight";
import type { PlanEvent, PlanRequest, PlanResult, RouteEstimate } from "@/types/plan";

export type Phase = "idle" | "searching" | "done" | "error" | "notfound";

export type Stage = "traffic" | "security" | "rules" | "today" | "synthesis";

export interface Progress {
  flight: FlightInfo | null;
  route: RouteEstimate | null;
  searches: string[];
  notes: string[];
  stages: Stage[];
}

export interface PlanState {
  phase: Phase;
  progress: Progress;
  result: PlanResult | null;
  error: string | null;
}

const emptyProgress: Progress = { flight: null, route: null, searches: [], notes: [], stages: [] };

/** Hard ceiling on a single plan request; the server has its own budgets well under this. */
const CLIENT_DEADLINE_MS = 75_000;

/** Attempts per request before giving up. */
const RETRIES = 3;

/** Browser network errors are terse ("Load failed", "Failed to fetch"); say what to do instead. */
function friendly(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (!message || error instanceof TypeError || /load failed|failed to fetch|network|connection/i.test(message)) {
    return "Lost the connection. Check your signal and try again.";
  }
  return message;
}

export function usePlan() {
  const [state, setState] = useState<PlanState>({ phase: "idle", progress: emptyProgress, result: null, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ phase: "idle", progress: emptyProgress, result: null, error: null });
  }, []);

  const reset = cancel;

  /** Show a finished plan without searching (a shared link). */
  const hydrate = useCallback((result: PlanResult) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ phase: "done", progress: emptyProgress, result, error: null });
  }, []);

  const run = useCallback(async (request: PlanRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ phase: "searching", progress: emptyProgress, result: null, error: null });
    let timedOut = false;
    const deadline = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_DEADLINE_MS);

    const handle = (event: PlanEvent): boolean => {
      let finished = false;
      setState((prev) => {
        switch (event.type) {
          case "flight":
            return { ...prev, progress: { ...prev.progress, flight: event.flight } };
          case "route":
            return { ...prev, progress: { ...prev.progress, route: event.route } };
          case "search":
            return { ...prev, progress: { ...prev.progress, searches: [...prev.progress.searches, event.query] } };
          case "stage":
            return { ...prev, progress: { ...prev.progress, stages: [...prev.progress.stages, event.stage] } };
          case "note":
            return { ...prev, progress: { ...prev.progress, notes: [...prev.progress.notes, event.text] } };
          case "flight_notfound":
            finished = true;
            return { ...prev, phase: "notfound", error: event.message };
          case "result":
            finished = true;
            return { ...prev, phase: "done", result: event.result };
          case "error":
            finished = true;
            return { ...prev, phase: "error", error: event.message };
          default:
            return prev;
        }
      });
      if (event.type === "flight_notfound" || event.type === "result" || event.type === "error") finished = true;
      return finished;
    };

    /**
     * One streamed request. Returns true when the server sent a terminal event.
     * Throws on a network failure or a stream that ended early, so the caller can retry.
     */
    const attempt = async (): Promise<boolean> => {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error("The server didn't answer. Try again.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          try {
            if (handle(JSON.parse(line) as PlanEvent)) finished = true;
          } catch {
            // ignore malformed line
          }
        }
      }
      if (buffer.trim()) {
        try {
          if (handle(JSON.parse(buffer.trim()) as PlanEvent)) finished = true;
        } catch {
          // ignore
        }
      }
      if (!finished) throw new Error("The connection dropped before we finished.");
      return true;
    };

    try {
      // Phones drop connections mid-stream (Safari reports "Load failed"). The server
      // caches research, so a quiet retry usually finishes in a couple of seconds.
      for (let i = 0; i < RETRIES; i++) {
        try {
          await attempt();
          return;
        } catch (error) {
          if ((error as Error).name === "AbortError") throw error;
          if (i === RETRIES - 1) throw error;
          setState((prev) => ({ ...prev, progress: emptyProgress }));
          await new Promise((r) => setTimeout(r, 800 * (i + 1)));
          if (controller.signal.aborted) return;
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        if (timedOut) setState((prev) => ({ ...prev, phase: "error", error: "That took too long. Try again." }));
        return;
      }
      setState((prev) => ({ ...prev, phase: "error", error: friendly(error) }));
    } finally {
      clearTimeout(deadline);
    }
  }, []);

  /** Back to the form with the airport and time fields open, e.g. when a found flight looks wrong. */
  const askManual = useCallback((message: string) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ phase: "notfound", progress: emptyProgress, result: null, error: message });
  }, []);

  return { state, run, cancel, reset, hydrate, askManual };
}
