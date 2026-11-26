import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowUpDown, ChevronRight, CircleDot, Download, Layers, Loader2, RefreshCw, Search, Users as UsersIcon, X } from "lucide-react";
import { useApi, useDebounced } from "@/lib/useApi";
import { errorText } from "@/lib/api";
import { formatDate, formatNumber, timeAgo, USAGE_LABEL } from "@/lib/format";
import { Avatar, Button, Card, Empty, ErrorBox, FIELD, PageHeader, Pagination, Select, Skeleton } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";

const STATUS = [
  ["all", "All statuses"], ["verified", "Active"], ["unverified", "Not verified"], ["disabled", "Disabled"],
  ["active7", "Recently active"], ["inactive30", "Inactive 30+ days"],
];
const USAGE = [["all", "All usage"], ["together", "Together"], ["solo", "Solo"], ["caregiver", "Caregiver"]];
const SORT = [["newest", "Newest first"], ["oldest", "Oldest first"], ["last_login", "Last sign-in"], ["name", "Name A–Z"], ["email", "E-mail A–Z"]];
const PAGE_SIZE = 25;

/** CSV cell: quoted, and formula characters neutralised (no spreadsheet injection from user-chosen names). */
function csvCell(v) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

function exportCsv(users) {
  const head = ["Name", "E-mail", "Status", "Usage", "Children", "Co-parents", "Active sessions", "Joined", "Last sign-in"];
  const rows = users.map((u) => [u.name, u.email, u.disabled_at ? "Disabled" : u.is_verified ? "Active" : "Not verified", USAGE_LABEL[u.usage_mode] ?? u.usage_mode, u.children, u.co_parents, u.active_sessions, u.created_at, u.last_login_at ?? ""]);
  const csv = [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Users() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const q = useDebounced(search.trim(), 350);
  const status = params.get("status") ?? "all";
  const usage = params.get("usage") ?? "all";
  const sort = params.get("sort") ?? "newest";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "" || v === "all" || (k === "page" && v === 1) || (k === "sort" && v === "newest")) next.delete(k);
      else next.set(k, String(v));
    }
    setParams(next, { replace: true });
  };

  // A search started from the top bar changes the URL: show it in the field.
  const urlQ = params.get("q") ?? "";
  useEffect(() => { if (urlQ !== q) setSearch(urlQ); }, [urlQ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search typed → back to page 1.
  useEffect(() => {
    if ((params.get("q") ?? "") !== q) set({ q, page: 1 });
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, error, loading, reload } = useApi("list-users", {
    search: params.get("q") ?? "", status: status === "all" ? undefined : status, usage: usage === "all" ? undefined : usage, sort, page, page_size: PAGE_SIZE,
  });
  const users = data?.users ?? [];

  const filtered = !!(urlQ || status !== "all" || usage !== "all");

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="All parent and caregiver accounts. Open a user for details and account actions."
        actions={<>
          <Button variant="secondary" icon={Download} disabled={!users.length} onClick={() => exportCsv(users)}>Export</Button>
          <Button variant="secondary" icon={RefreshCw} loading={loading && !!data} onClick={reload}>Refresh</Button>
        </>}
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search by name or e-mail</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or e-mail…" maxLength={100} className={`${FIELD} pl-8`} />
          </label>
          <Select aria-label="Status" icon={CircleDot} value={status} onChange={(e) => set({ status: e.target.value, page: 1 })} className="w-44">
            {STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select aria-label="Usage" icon={Layers} value={usage} onChange={(e) => set({ usage: e.target.value, page: 1 })} className="w-40">
            {USAGE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select aria-label="Sort" icon={ArrowUpDown} value={sort} onChange={(e) => set({ sort: e.target.value, page: 1 })} className="w-44">
            {SORT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          {filtered ? <Button variant="ghost" icon={X} onClick={() => { setSearch(""); setParams(new URLSearchParams(sort !== "newest" ? { sort } : {}), { replace: true }); }}>Clear</Button> : null}
        </div>

        <div className="flex items-center justify-between border-b border-line/80 bg-white/40 px-5 py-2 text-xs text-ink-muted">
          <span>{data ? <><b className="font-medium text-ink">{formatNumber(data.total)}</b> account{data.total === 1 ? "" : "s"}{filtered ? " match your filters" : ""}</> : "Loading accounts…"}</span>
          {loading && data ? <span className="flex items-center gap-1.5"><Loader2 className="size-3.5 animate-spin" aria-hidden />Updating</span> : null}
        </div>

        {error ? <div className="p-4"><ErrorBox message={errorText(error)} onRetry={reload} /></div> : null}
        {!data && loading ? (
          <div className="divide-y divide-line">{Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5"><Skeleton className="size-8 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-40" /><Skeleton className="h-3 w-56" /></div><Skeleton className="h-5 w-16" /></div>
          ))}</div>
        ) : null}

        {data ? (
          users.length ? (
            <div className={`overflow-x-auto transition-opacity ${loading ? "opacity-60" : ""}`}>
              <table className="w-full min-w-[900px] text-left text-[13px]">
                <thead className="border-b border-line text-xs text-ink-muted">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-medium">User</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Usage</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Children</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Co-parents</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Sessions</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Joined</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Last sign-in</th>
                    <th scope="col" className="w-10 px-3 py-2.5"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {users.map((u) => (
                    <tr key={u.id} onClick={() => navigate(`/users/${u.id}`)} className="group cursor-pointer transition hover:bg-white/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} email={u.email} id={u.id} size={32} />
                          <div className="min-w-0">
                            <Link to={`/users/${u.id}`} onClick={(e) => e.stopPropagation()} className="block max-w-[260px] truncate font-medium text-ink hover:underline">{u.name || "—"}</Link>
                            <p className="max-w-[260px] truncate text-xs text-ink-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><StatusBadge user={u} /></td>
                      <td className="px-3 py-3 text-ink-soft">{USAGE_LABEL[u.usage_mode] ?? u.usage_mode}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{u.children}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{u.co_parents}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-ink-soft">{u.active_sessions}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft">{formatDate(u.created_at)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-ink-soft" title={u.last_login_at ?? ""}>{timeAgo(u.last_login_at)}</td>
                      <td className="px-3 py-3 text-ink-muted"><ChevronRight className="size-4 opacity-0 transition group-hover:opacity-100" aria-hidden /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty icon={UsersIcon} title={filtered ? "No users match your filters" : "No users yet"} text={filtered ? "Try another search term or clear the filters." : undefined} />
          )
        ) : null}
        {data && data.total > 0 ? <Pagination page={data.page} pageSize={data.page_size} total={data.total} onPage={(p) => set({ page: p })} /> : null}
      </Card>
    </>
  );
}
