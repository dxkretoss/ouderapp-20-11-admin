import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";

/**
 * Charts follow one spec: a single validated hue (--color-chart), thin marks with 4px rounded data-ends on the
 * baseline, 2px gaps, recessive grid, text in ink tokens (never the series colour), a hover tooltip per mark
 * and a visually hidden table for screen readers.
 */

const shortDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const longDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "long" });

/** Bar path with only the top corners rounded (anchored to the baseline). */
function barPath(x, y, w, h, r) {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

function niceMax(v) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

export function SignupsChart({ data }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = 220, L = 36, R = 8, T = 12, B = 28;
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => d.count))), [data]);
  const total = data.reduce((s, d) => s + d.count, 0);
  const plotW = W - L - R, plotH = H - T - B;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.max(2, slot - 2); // 2px surface gap between adjacent bars
  const ticks = [0, max / 2, max];
  const peak = data.reduce((best, d, i) => (d.count > (data[best]?.count ?? -1) ? i : best), 0);

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Sign-ups per day, last 30 days: ${total} in total`}>
        {ticks.map((t) => {
          const y = T + plotH - (t / max) * plotH;
          return (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y} y2={y} stroke="var(--color-line)" strokeWidth="1" />
              <text x={L - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--color-ink-muted)">{formatNumber(t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.count / max) * plotH;
          const x = L + i * slot + 1;
          return (
            <g key={d.date}>
              <path d={barPath(x, T + plotH - h, barW, h, 4)} fill="var(--color-chart)" opacity={hover === null || hover === i ? 1 : 0.45} />
              {/* Hit target: the whole column, larger than the mark. */}
              <rect x={L + i * slot} y={T} width={slot} height={plotH} fill="transparent"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                tabIndex={0} aria-label={`${longDay.format(new Date(d.date))}: ${d.count} sign-ups`} />
              {i % 7 === 0 || i === data.length - 1 ? (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-ink-muted)">{shortDay.format(new Date(d.date))}</text>
              ) : null}
            </g>
          );
        })}
        {data[peak]?.count > 0 && hover === null ? (
          <text x={L + peak * slot + 1 + barW / 2} y={T + plotH - (data[peak].count / max) * plotH - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-ink)">{data[peak].count}</text>
        ) : null}
        <line x1={L} x2={W - R} y1={T + plotH} y2={T + plotH} stroke="var(--color-ink-muted)" strokeWidth="1" />
      </svg>
      {hover !== null && data[hover] ? (
        <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-2xl border border-white/90 bg-[#fbf8f2] px-3 py-1.5 text-xs shadow-md"
          style={{ left: `${((L + hover * slot + slot / 2) / W) * 100}%` }}>
          <p className="font-semibold text-ink-soft">{longDay.format(new Date(data[hover].date))}</p>
          <p className="font-semibold text-ink">{data[hover].count} sign-up{data[hover].count === 1 ? "" : "s"}</p>
        </div>
      ) : null}
      <table className="sr-only">
        <caption>Sign-ups per day</caption>
        <thead><tr><th>Date</th><th>Sign-ups</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.date}><td>{d.date}</td><td>{d.count}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Horizontal magnitude bars with the label and value as text (identity never by colour alone). */
export function BreakdownBars({ items }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <ul className="space-y-3.5">
      {items.map((item, i) => {
        const pct = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <li key={item.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} title={`${item.label}: ${formatNumber(item.value)} (${pct}%)`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[13px] font-medium text-ink">{item.label}</span>
              <span className="tabular-nums text-ink-soft"><b className="font-semibold text-ink">{formatNumber(item.value)}</b> · {pct}%</span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-[#eadfd1]">
              <div className="h-full rounded-full bg-chart transition-opacity" style={{ width: `${(item.value / max) * 100}%`, opacity: hover === null || hover === i ? 1 : 0.45 }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
