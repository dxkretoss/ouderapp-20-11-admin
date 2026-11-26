import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Activity, Eye, EyeOff, Lock, LogIn, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { errorText, isConfigured } from "@/lib/api";
import { Button, ErrorBox, FIELD } from "@/components/ui";

const REASONS = {
  expired: "Your session has ended. Please sign in again.",
  idle: "You were signed out after 30 minutes without activity.",
};

/** Left half on large screens: brand visual, drawn in code (no external image, CSP-safe). */
function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#3f5747] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16" aria-hidden="true">
      {/* Soft shapes */}
      <div className="absolute -left-32 -top-32 size-[28rem] rounded-full bg-[#4f6b58] opacity-60 blur-3xl" />
      <div className="absolute -bottom-40 right-[-6rem] size-[32rem] rounded-full bg-[#c97b5a] opacity-25 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="#fff" /></pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Top: brand */}
      <div className="relative flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-white/95 p-1.5 shadow-lg"><img src="/favicon.png" alt="" className="size-full object-contain" /></span>
        <div>
          <p className="text-lg font-bold tracking-tight text-white">Ouderschap &amp; Co</p>
          <p className="text-xs font-medium text-white/60">Admin console</p>
        </div>
      </div>

      {/* Middle: headline + preview cards */}
      <div className="relative">
        <h2 className="max-w-md text-[40px] font-semibold leading-[1.1] tracking-tight text-white xl:text-5xl">
          Keep every family’s space safe and running smoothly.
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
          Accounts, activity and security for Ouderschap &amp; Co, in one calm overview.
        </p>

        <div className="relative mt-10 h-56 max-w-md">
          <div className="absolute left-0 top-0 w-60 rotate-[-3deg] rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-medium text-white/70"><Users className="size-3.5" /> Total users</div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">Families</p>
            <div className="mt-3 flex h-10 items-end gap-1">
              {[40, 55, 35, 70, 60, 85, 75, 95, 80, 100].map((h, i) => (
                <span key={i} className="flex-1 rounded-t-[3px] bg-white/60" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-10 w-52 rotate-[4deg] rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-medium text-white/70"><Activity className="size-3.5" /> Active this week</div>
            <div className="mt-3 h-2 rounded-full bg-white/15"><div className="h-full w-3/4 rounded-full bg-white/70" /></div>
            <div className="mt-2 h-2 rounded-full bg-white/15"><div className="h-full w-1/2 rounded-full bg-white/50" /></div>
            <div className="mt-2 h-2 rounded-full bg-white/15"><div className="h-full w-2/3 rounded-full bg-white/40" /></div>
          </div>
          <div className="absolute bottom-0 left-16 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md">
            <span className="grid size-9 place-items-center rounded-full bg-white/90 text-[#2f4a3a]"><ShieldCheck className="size-4.5" /></span>
            <div>
              <p className="text-sm font-semibold text-white">Protected session</p>
              <p className="text-xs text-white/60">8 h max · 30 min idle</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Ouderschap &amp; Co · Restricted access</p>
    </aside>
  );
}

export default function Login() {
  const { status, signIn, reason } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (status === "signed-in") return <Navigate to={location.state?.from || "/"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(errorText(err));
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-full lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <main className="flex min-h-full flex-col bg-[#fbf8f2]/80 px-6 py-10 backdrop-blur sm:px-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px]">
            <img src="/ouderschap-co-logo.webp" alt="Ouderschap & Co" className="h-12 w-auto" />
            <p className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
              <ShieldCheck className="size-3.5" aria-hidden /> Admin panel
            </p>
            <h1 className="mt-4 text-[28px] font-semibold leading-tight tracking-tight text-ink">Welcome back</h1>
            <p className="mt-1.5 text-sm text-ink-soft">Sign in with your administrator account to continue.</p>

            <form onSubmit={submit} noValidate className="mt-8">
              {!isConfigured ? <div className="mb-4"><ErrorBox message="Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local." /></div> : null}
              {reason && !error ? <p role="status" className="mb-4 rounded-2xl bg-warn-soft px-3.5 py-2.5 text-xs font-medium text-warn">{REASONS[reason]}</p> : null}
              {error ? <div className="mb-4"><ErrorBox message={error} /></div> : null}

              <label className="block text-sm font-medium text-ink" htmlFor="email">E-mail</label>
              <input id="email" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={`mt-2 min-h-12 ${FIELD}`} />

              <label className="mt-5 block text-sm font-medium text-ink" htmlFor="password">Password</label>
              <div className="relative mt-2">
                <input id="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className={`min-h-12 ${FIELD} pr-12`} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:bg-canvas">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              <Button type="submit" icon={LogIn} loading={busy} disabled={!email.trim() || !password || !isConfigured} className="mt-7 min-h-12 w-full text-[15px]">
                Sign in
              </Button>
            </form>

            <div className="mt-8 flex items-start gap-3 rounded-[22px] bg-[#e9efe3] p-4">
              <Lock className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <p className="text-xs leading-relaxed text-ink-soft">
                Restricted area for authorised administrators only. Every sign-in and action is logged, and sessions end after 30 minutes without activity.
              </p>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-ink-muted lg:hidden">© {new Date().getFullYear()} Ouderschap &amp; Co</p>
      </main>
    </div>
  );
}
