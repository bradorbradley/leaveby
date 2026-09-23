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

export function usePlan() {
  const [state, setState] = useState<PlanState>({ phase: "idle", progress: emptyProgress, result: null, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ phase: "idle", progress: emptyProgress, result: null, error: null });
  }, []);

  const reset = cancel;

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

    try {
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

      const handle = (event: PlanEvent) => {
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
      };

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
            handle(JSON.parse(line) as PlanEvent);
          } catch {
            // ignore malformed line
          }
        }
      }
      if (buffer.trim()) {
        try {
          handle(JSON.parse(buffer.trim()) as PlanEvent);
        } catch {
          // ignore
        }
      }
      if (!finished) setState((prev) => ({ ...prev, phase: "error", error: "The connection dropped before we finished. Try again." }));
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        if (timedOut) setState((prev) => ({ ...prev, phase: "error", error: "That took too long. Try again." }));
        return;
      }
      const message = error instanceof Error ? error.message : "Something went wrong.";
      setState((prev) => ({ ...prev, phase: "error", error: message }));
    } finally {
      clearTimeout(deadline);
    }
  }, []);

  return { state, run, cancel, reset };
}
