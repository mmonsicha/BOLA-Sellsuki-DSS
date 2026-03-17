import { useState, useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 30_000;

interface HealthCheckResult {
  dbOk: boolean;
  checking: boolean;
}

export function useHealthCheck(): HealthCheckResult {
  const [dbOk, setDbOk] = useState(true);
  const [checking, setChecking] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      abortRef.current = new AbortController();
      try {
        const res = await fetch("/readiness", {
          method: "GET",
          signal: abortRef.current.signal,
        });
        if (!cancelled) {
          setDbOk(res.status === 200);
        }
      } catch {
        if (!cancelled) {
          setDbOk(false);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    // Check immediately on mount
    void check();

    // Then poll every 30 seconds
    const intervalId = setInterval(() => {
      void check();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      abortRef.current?.abort();
    };
  }, []);

  return { dbOk, checking };
}
