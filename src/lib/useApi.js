import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

/**
 * Identical requests that are still on their way are shared: the same action with the same fields
 * goes over the network once, however many components (or React StrictMode's double mount) ask for it.
 */
const inFlight = new Map();
export function sharedApi(action, fields = {}) {
  const key = `${action}:${JSON.stringify(fields)}`;
  let p = inFlight.get(key);
  if (!p) {
    p = api(action, fields).finally(() => inFlight.delete(key));
    inFlight.set(key, p);
  }
  return p;
}

/**
 * Loads one admin-api action and re-runs when `fields` change (compared by JSON).
 * A result that arrives after the fields changed (or after unmount) is ignored, so fast typing in a
 * search box never shows stale results. Requests are not aborted: a duplicate is simply shared.
 */
export function useApi(action, fields = {}, { enabled = true } = {}) {
  const key = JSON.stringify(fields);
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const latest = useRef(0);

  const load = useCallback(() => {
    const run = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    sharedApi(action, JSON.parse(key))
      .then((data) => { if (run === latest.current) setState({ data, error: null, loading: false }); })
      .catch((error) => { if (run === latest.current) setState((s) => ({ ...s, error, loading: false })); });
  }, [action, key]);

  useEffect(() => {
    if (!enabled) return undefined;
    load();
    return () => { latest.current++; }; // ignore whatever is still on its way for these fields
  }, [load, enabled]);

  return { ...state, reload: load, setData: (d) => setState((s) => ({ ...s, data: typeof d === "function" ? d(s.data) : d })) };
}

/** Debounced copy of a value (for search fields). */
export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
