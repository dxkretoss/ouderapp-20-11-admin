/**
 * The only way the admin panel talks to the server: POST {action, ...fields} to the `admin-api` edge function.
 * The admin session token travels in the `x-admin-token` header and is kept in sessionStorage, so it disappears
 * when the tab closes and is never shared with other tabs or the parent app.
 */
const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const TOKEN_KEY = "ouderapp-admin-token";

export const isConfigured = Boolean(URL_BASE && ANON_KEY);

export class ApiError extends Error {
  constructor(code, message, status) {
    super(message || code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: the session simply does not survive a reload */
  }
}

const unauthorizedListeners = new Set();
/** The auth provider listens here: any 401 ends the session in the UI. */
export function onUnauthorized(fn) {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

export async function api(action, fields = {}, { signal } = {}) {
  if (!isConfigured) throw new ApiError("NOT_CONFIGURED", "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing", 0);
  const token = readToken();
  let res;
  try {
    res = await fetch(`${URL_BASE}/functions/v1/admin-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        ...(token ? { "x-admin-token": token } : {}),
      },
      body: JSON.stringify({ action, ...fields }),
      signal,
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new ApiError("NETWORK", "No connection to the server", 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* not JSON */
  }
  if (!res.ok || !data?.success) {
    const code = data?.code || (res.status === 401 ? "UNAUTHORIZED" : "SERVER");
    if (code === "UNAUTHORIZED" && action !== "login") unauthorizedListeners.forEach((f) => f());
    throw new ApiError(code, data?.message, res.status);
  }
  return data;
}

const MESSAGES = {
  INVALID_CREDENTIALS: "Invalid e-mail or password.",
  RATE_LIMITED: "Too many attempts. Wait 15 minutes and try again.",
  UNAUTHORIZED: "Your session has ended. Please sign in again.",
  FORBIDDEN: "You are not allowed to do this from here.",
  NOT_FOUND: "This item no longer exists.",
  VALIDATION: "Please check the fields and try again.",
  WEAK_PASSWORD: "Use at least 12 characters with upper case, lower case, a digit and a special character.",
  NETWORK: "No connection to the server. Check your internet connection.",
  NOT_CONFIGURED: "The admin panel is not configured (missing Supabase settings).",
};

export function errorText(e) {
  return MESSAGES[e?.code] ?? "Something went wrong. Please try again.";
}
