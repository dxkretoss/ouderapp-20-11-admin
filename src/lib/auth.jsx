import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, onUnauthorized, readToken, writeToken } from "@/lib/api";
import { sharedApi } from "@/lib/useApi";

/**
 * Admin session in the UI. The server is the authority (every admin-api call re-checks the session and role);
 * this provider only mirrors it: restore on load (`me`), sign in, sign out, and sign out after inactivity
 * (the server enforces the same idle timeout, this just makes the UI follow it promptly).
 */
const AuthContext = createContext(null);
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"];

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: readToken() ? "checking" : "signed-out", admin: null, reason: null });
  const idleMs = useRef(30 * 60 * 1000);
  const lastActivity = useRef(Date.now());

  const signOutLocal = useCallback((reason = null) => {
    writeToken(null);
    setState({ status: "signed-out", admin: null, reason });
  }, []);

  // Restore an existing session (only from this tab's sessionStorage).
  useEffect(() => {
    if (state.status !== "checking") return;
    // Shared request: StrictMode's double mount reuses it instead of cancelling and sending it again.
    let alive = true;
    sharedApi("me")
      .then((r) => {
        if (!alive) return;
        if (r.idle_timeout) idleMs.current = r.idle_timeout * 1000;
        setState({ status: "signed-in", admin: r.admin, reason: null });
      })
      .catch((e) => {
        if (alive) signOutLocal(e?.code === "UNAUTHORIZED" ? "expired" : null);
      });
    return () => { alive = false; };
  }, [state.status, signOutLocal]);

  useEffect(() => onUnauthorized(() => signOutLocal("expired")), [signOutLocal]);

  // Inactivity sign-out.
  useEffect(() => {
    if (state.status !== "signed-in") return;
    const mark = () => { lastActivity.current = Date.now(); };
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, mark, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current > idleMs.current) {
        api("logout").catch(() => {});
        signOutLocal("idle");
      }
    }, 30_000);
    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, mark));
      window.clearInterval(timer);
    };
  }, [state.status, signOutLocal]);

  const signIn = useCallback(async (email, password) => {
    const r = await api("login", { email, password });
    writeToken(r.token);
    if (r.idle_timeout) idleMs.current = r.idle_timeout * 1000;
    lastActivity.current = Date.now();
    setState({ status: "signed-in", admin: r.admin, reason: null });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api("logout");
    } catch {
      /* the local session ends regardless */
    }
    signOutLocal(null);
  }, [signOutLocal]);

  const value = useMemo(() => ({ ...state, signIn, signOut }), [state, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
