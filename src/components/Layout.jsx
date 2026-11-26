import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, LayoutDashboard, LogOut, Menu, Search, Settings, ShieldCheck, Users, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui";

const GROUPS = [
  { label: "Overview", items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }] },
  { label: "Management", items: [{ to: "/users", label: "Users", icon: Users }] },
  { label: "Account", items: [{ to: "/settings", label: "Settings", icon: Settings }] },
];

const DEFAULT_CRUMBS = [
  [/^\/$/, [{ label: "Dashboard" }]],
  [/^\/users\/[^/]+$/, [{ label: "Users", to: "/users" }, { label: "User" }]],
  [/^\/users/, [{ label: "Users" }]],
  [/^\/settings/, [{ label: "Settings" }]],
];

/** Pages can replace the breadcrumb (e.g. "Users › Father") with useBreadcrumb([...]). */
const CrumbContext = createContext(() => {});
export function useBreadcrumb(crumbs) {
  const set = useContext(CrumbContext);
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    if (crumbs) set(crumbs);
    return () => set(null);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}

function Sidebar({ onNavigate }) {
  const { admin, signOut } = useAuth();
  return (
    <div className="flex h-full flex-col border-r border-white/80 bg-white/55 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2.5 border-b border-line/70 px-4">
        <img src="/favicon.png" alt="" className="size-8 rounded-lg object-contain" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold tracking-tight">Ouderschap &amp; Co</p>
          <p className="text-[11px] text-ink-muted">Admin console</p>
        </div>
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 py-4">
        {GROUPS.map((g) => (
          <div key={g.label} className="mb-5">
            <p className="mb-1.5 px-2.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">{g.label}</p>
            <div className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) => `flex h-10 items-center gap-2.5 rounded-full px-3.5 text-[13px] outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 ${isActive ? "bg-[#dce6d6] font-semibold text-[#2f4a3a]" : "font-medium text-ink-soft hover:bg-white/70 hover:text-ink"}`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-line/70 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-2xl bg-[#e9efe3] px-3 py-2 text-[11px] text-[#2f4a3a]">
          <ShieldCheck className="size-3.5 shrink-0 text-brand" aria-hidden />
          <span>Session ends after 30 min idle</span>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
          <Avatar name={admin?.name} email={admin?.email} id={admin?.id} size={30} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium">{admin?.name || "Admin"}</p>
            <p className="truncate text-[11px] text-ink-muted">{admin?.email}</p>
          </div>
          <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="grid size-8 place-items-center rounded-full text-ink-muted transition hover:bg-bad-soft hover:text-bad">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileMenu() {
  const { admin, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" aria-label="Account menu" className="flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 p-1 pr-2 shadow-xs transition hover:bg-white">
        <Avatar name={admin?.name} email={admin?.email} id={admin?.id} size={30} />
        <ChevronDown className="size-3.5 text-ink-muted" aria-hidden />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-[22px] border border-white/90 bg-[#fbf8f2] p-1.5 shadow-pop">
          <div className="px-3 py-2.5">
            <p className="truncate text-[13px] font-semibold">{admin?.name || "Admin"}</p>
            <p className="truncate text-xs text-ink-muted">{admin?.email}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <button type="button" role="menuitem" onClick={() => { setOpen(false); navigate("/settings"); }} className="flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-left text-[13px] hover:bg-white"><Settings className="size-4 text-ink-muted" aria-hidden /> Settings</button>
          <button type="button" role="menuitem" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-full px-3 py-2 text-left text-[13px] text-bad hover:bg-bad-soft"><LogOut className="size-4" aria-hidden /> Sign out</button>
        </div>
      ) : null}
    </div>
  );
}

function Topbar({ onMenu, crumbs }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const input = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/45 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onMenu} aria-label="Open menu" className="grid size-9 place-items-center rounded-full border border-white/90 bg-white/70 lg:hidden"><Menu className="size-4.5" /></button>
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <li className="hidden text-ink-muted sm:block">Admin</li>
            {crumbs.map((c, i) => (
              <li key={i} className="flex min-w-0 items-center gap-1.5">
                <ChevronRight className={`size-3.5 shrink-0 text-ink-muted/70 ${i === 0 ? "hidden sm:block" : ""}`} aria-hidden />
                {c.to ? <Link to={c.to} className="truncate text-ink-soft hover:text-ink">{c.label}</Link> : <span className="truncate font-medium text-ink" aria-current="page">{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <form role="search" onSubmit={(e) => { e.preventDefault(); const v = q.trim(); navigate(v ? `/users?q=${encodeURIComponent(v)}` : "/users"); setQ(""); input.current?.blur(); }} className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input ref={input} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" aria-label="Search users" maxLength={100}
            className="h-10 w-64 rounded-full border border-white/90 bg-white/70 pl-9 pr-16 text-[13px] outline-none transition placeholder:text-ink-muted hover:bg-white focus:w-80 focus:border-brand focus:bg-surface focus:ring-3 focus:ring-brand/12" />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full border border-line bg-surface px-1.5 py-0.5 font-sans text-[10px] font-medium text-ink-muted">{isMac ? "⌘" : "Ctrl"} K</kbd>
        </form>
        <div className="h-6 w-px bg-line-strong/70" aria-hidden />
        <ProfileMenu />
      </div>
    </header>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(null);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  const crumbs = custom ?? DEFAULT_CRUMBS.find(([re]) => re.test(pathname))?.[1] ?? [{ label: "Admin" }];
  return (
    <CrumbContext.Provider value={setCustom}>
      <div className="min-h-full lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">
          <Sidebar />
        </aside>
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-[#26211d]/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-[#f3ede3] shadow-pop">
              <Sidebar onNavigate={() => setOpen(false)} />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 grid size-8 place-items-center rounded-full text-ink-muted hover:bg-white/70"><X className="size-4" /></button>
            </aside>
          </div>
        ) : null}
        <div className="min-w-0">
          <Topbar onMenu={() => setOpen(true)} crumbs={crumbs} />
          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1280px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </CrumbContext.Provider>
  );
}
