import { useEffect, useRef } from "react";
import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { initials } from "@/lib/format";

/**
 * Component library of the admin console. One look everywhere: 8px corners on controls, 12px on cards,
 * hairline borders, small shadows, medium-weight text. Colour carries meaning only (status, accent).
 */

const BUTTON = {
  primary: "bg-brand text-white shadow-xs hover:bg-brand-strong",
  secondary: "border border-white/90 bg-white/70 text-ink shadow-xs backdrop-blur hover:bg-white",
  danger: "bg-bad text-white shadow-xs hover:brightness-95",
  "danger-outline": "border border-bad/30 bg-white/70 text-bad shadow-xs hover:bg-bad-soft",
  ghost: "text-ink-soft hover:bg-white/60 hover:text-ink",
};

export function Button({ variant = "primary", size = "md", loading = false, icon: Icon, children, className = "", disabled, ...props }) {
  const sizes = size === "sm" ? "h-8 px-3 text-[13px] gap-1.5" : size === "lg" ? "h-12 px-6 text-sm gap-2" : "h-10 px-4 text-[13px] gap-2";
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizes} ${BUTTON[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
      {children}
    </button>
  );
}

export const FIELD = "h-10 w-full rounded-2xl border border-line-strong bg-surface px-3.5 text-[13px] text-ink shadow-xs outline-none transition placeholder:text-ink-muted hover:border-line-strong focus:border-brand focus:ring-3 focus:ring-brand/12";

export function Card({ title, subtitle, action, children, className = "", padded = true, footer }) {
  return (
    <section className={`overflow-hidden rounded-[22px] border border-white/85 bg-glass shadow-card backdrop-blur-md ${className}`}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-line/80 px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={padded ? "p-5" : ""}>{children}</div>
      {footer ? <footer className="border-t border-line/80 bg-white/40 px-5 py-3">{footer}</footer> : null}
    </section>
  );
}

const BADGE = {
  good: ["border-good/20 bg-good-soft text-good", "bg-good"],
  warn: ["border-warn/20 bg-warn-soft text-warn", "bg-warn"],
  bad: ["border-bad/20 bg-bad-soft text-bad", "bg-bad"],
  info: ["border-info/20 bg-info-soft text-info", "bg-info"],
  neutral: ["border-line-strong bg-white/60 text-ink-soft", "bg-ink-muted"],
};

/** Status badge: dot + label (never colour alone). */
export function Badge({ tone = "neutral", icon: Icon, dot = true, children }) {
  const [cls, dotCls] = BADGE[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {Icon ? <Icon className="size-3" aria-hidden /> : dot ? <span className={`size-1.5 rounded-full ${dotCls}`} aria-hidden /> : null}
      {children}
    </span>
  );
}

/** Soft avatar colours; the same person always gets the same one (hash of id/e-mail). */
const AVATAR_TONES = [
  ["#e7f1ea", "#24533c"], ["#fbeae2", "#8a4127"], ["#e6eef9", "#2b5486"], ["#efe8f7", "#5b3d7c"],
  ["#fbf2dc", "#7a5300"], ["#e2f3f0", "#1d6559"], ["#f9e6ec", "#86304d"],
];
function toneFor(key = "") {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

export function Avatar({ name, email, id, size = 32, ring = false }) {
  const [bg, fg] = toneFor(id || email || name || "");
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-full font-semibold ${ring ? "ring-4 ring-surface" : ""}`} style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36), background: bg, color: fg }}>
      {initials(name, email)}
    </span>
  );
}

/** Native select (keyboard + mobile friendly) with the console's look and a natural width. */
export function Select({ icon: Icon, className = "", children, ...props }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      {Icon ? <Icon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden /> : null}
      <select
        {...props}
        className={`h-10 w-full cursor-pointer appearance-none rounded-2xl border border-line-strong bg-surface pr-8 text-[13px] font-medium text-ink shadow-xs outline-none transition hover:border-line-strong focus:border-brand focus:ring-3 focus:ring-brand/12 ${Icon ? "pl-8" : "pl-3"}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
    </span>
  );
}

/** Underlined tabs for sections inside a page. */
export function Tabs({ value, onChange, items, label }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-[rgba(226,216,203,.55)] p-1">
      {items.map(([id, text, count]) => (
        <button key={id} type="button" role="tab" aria-selected={value === id} onClick={() => onChange(id)}
          className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] outline-none transition focus-visible:ring-2 focus-visible:ring-brand/40 ${value === id ? "bg-white font-semibold text-brand-strong shadow-[0_2px_8px_rgba(60,50,40,.08)]" : "font-medium text-ink-soft hover:text-ink"}`}>
          {text}
          {count !== undefined ? <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${value === id ? "bg-brand-soft text-brand-strong" : "bg-white/60 text-ink-muted"}`}>{count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-[22px] border border-white/85 bg-glass p-5 shadow-card backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-soft">{label}</p>
        <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand-strong"><Icon className="size-4" aria-hidden /></span>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-2 truncate text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-[13px] text-ink-soft">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

/** Placeholder blocks while data loads (keeps the layout stable). */
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-white/50 ${className}`} aria-hidden />;
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-[13px] text-bad">
      <AlertCircle className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{message}</span>
      {onRetry ? <Button size="sm" variant="secondary" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, compact = false }) {
  return (
    <div className={`flex flex-col items-center px-6 text-center ${compact ? "py-8" : "py-14"}`}>
      {Icon ? <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand-strong"><Icon className="size-4.5" aria-hidden /></span> : null}
      <p className="mt-3 text-[13px] font-medium text-ink">{title}</p>
      {text ? <p className="mt-1 max-w-sm text-xs text-ink-muted">{text}</p> : null}
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/80 bg-white/40 px-5 py-2.5 text-xs text-ink-soft">
      <span>Showing <b className="font-medium text-ink">{from}–{to}</b> of <b className="font-medium text-ink">{total}</b></span>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="secondary" icon={ChevronLeft} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" />
        <span className="px-1.5 tabular-nums">{page} / {pages}</span>
        <Button size="sm" variant="secondary" icon={ChevronRight} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page" />
      </div>
    </div>
  );
}

/** Accessible modal: focus moves in, Escape closes, background click closes. */
export function Modal({ open, title, description, icon: Icon, tone = "neutral", children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    ref.current?.querySelector("textarea, input, button:not([aria-label='Close'])")?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  const iconTone = tone === "bad" ? "bg-bad-soft text-bad" : tone === "good" ? "bg-good-soft text-good" : "bg-brand-soft text-brand-strong";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#26211d]/40 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="relative w-full max-w-md rounded-[26px] border border-white/90 bg-[#fbf8f2] p-6 shadow-pop">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-line-strong bg-white/70 text-ink-soft hover:text-ink"><X className="size-4" /></button>
        {Icon ? <span className={`grid size-10 place-items-center rounded-full ${iconTone}`}><Icon className="size-5" aria-hidden /></span> : null}
        <h2 className={`${Icon ? "mt-4" : ""} text-base font-semibold`}>{title}</h2>
        {description ? <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{description}</p> : null}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-ink-soft">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Label/value rows for detail panels. */
export function DescriptionList({ items }) {
  return (
    <dl className="divide-y divide-line">
      {items.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[minmax(120px,40%)_1fr] gap-4 py-2.5 text-[13px]">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="min-w-0 text-right font-medium text-ink sm:text-left">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
