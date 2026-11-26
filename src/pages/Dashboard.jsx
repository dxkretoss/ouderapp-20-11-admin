import { Link } from "react-router-dom";
import { Activity, ArrowUpRight, Baby, Ban, Clock, Link2, Mail, RefreshCw, UserPlus, Users } from "lucide-react";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { errorText } from "@/lib/api";
import { formatDate, formatNumber, timeAgo, USAGE_LABEL } from "@/lib/format";
import { Avatar, Button, Card, Empty, ErrorBox, PageHeader, Skeleton, StatCard } from "@/components/ui";
import { BreakdownBars, SignupsChart } from "@/components/charts";
import { StatusBadge } from "@/components/StatusBadge";

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong"><Icon className="size-4" aria-hidden /></span>
      <div className="min-w-0">
        <p className="truncate text-xs text-ink-muted">{label}</p>
        <p className="text-[15px] font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[118px] rounded-[22px]" />)}</div>
      <Skeleton className="h-20 rounded-[22px]" />
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 rounded-[22px] lg:col-span-2" /><Skeleton className="h-80 rounded-[22px]" /></div>
    </div>
  );
}

export default function Dashboard() {
  const { data, error, loading, reload } = useApi("dashboard");
  const { admin } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting}, ${admin?.name?.split(" ")[0] || "admin"}. Here is what is happening across Ouderschap & Co.`}
        actions={<Button variant="secondary" icon={RefreshCw} loading={loading && !!data} onClick={reload}>Refresh</Button>}
      />
      {error ? <div className="mb-6"><ErrorBox message={errorText(error)} onRetry={reload} /></div> : null}
      {!data && loading ? <DashboardSkeleton /> : null}

      {data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard icon={Users} label="Total users" value={formatNumber(data.users.total)} hint={`${formatNumber(data.users.verified)} verified · ${formatNumber(data.users.unverified)} unverified`} />
            <StatCard icon={Activity} label="Active users" value={formatNumber(data.users.active7)} hint={`Last 7 days · ${formatNumber(data.users.active30)} in 30 days`} />
            <StatCard icon={UserPlus} label="New sign-ups" value={formatNumber(data.users.new30)} hint={`Last 30 days · ${formatNumber(data.users.new7)} this week`} />
            <StatCard icon={Clock} label="Online today" value={formatNumber(data.sessions_24h)} hint="Sessions active in the last 24 h" />
          </div>

          <div className="grid grid-cols-2 divide-line overflow-hidden rounded-[22px] border border-white/85 bg-glass shadow-card backdrop-blur-md sm:grid-cols-4 sm:divide-x [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-line sm:[&>*:nth-child(n+3)]:border-t-0">
            <MiniStat icon={Baby} label="Children" value={formatNumber(data.children)} />
            <MiniStat icon={Link2} label="Linked co-parents" value={formatNumber(data.connections)} />
            <MiniStat icon={Mail} label="Open invitations" value={formatNumber(data.pending_invitations)} />
            <MiniStat icon={Ban} label="Disabled accounts" value={formatNumber(data.users.disabled)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Sign-ups" subtitle="New accounts per day, last 30 days"
              action={<span className="text-[13px] font-semibold tabular-nums">{formatNumber(data.users.new30)} <span className="font-normal text-ink-muted">total</span></span>}>
              <SignupsChart data={data.signups_per_day} />
            </Card>
            <Card title="Usage" subtitle="How accounts use the app">
              <BreakdownBars items={[
                { label: USAGE_LABEL.together, value: data.usage.together },
                { label: USAGE_LABEL.solo, value: data.usage.solo },
                { label: USAGE_LABEL.caregiver, value: data.usage.caregiver },
              ]} />
              <div className="mt-6 border-t border-line pt-5">
                <p className="mb-3 text-xs font-medium text-ink-muted">E-mail verification</p>
                <BreakdownBars items={[
                  { label: "Verified", value: data.users.verified },
                  { label: "Unverified", value: data.users.unverified },
                ]} />
              </div>
            </Card>
          </div>

          <Card title="Newest accounts" subtitle="The six most recent sign-ups" padded={false}
            action={<Link to="/users" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">View all <ArrowUpRight className="size-3.5" aria-hidden /></Link>}>
            {data.latest_users.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead className="border-b border-line/80 bg-white/40 text-xs text-ink-muted">
                    <tr>
                      <th scope="col" className="px-5 py-2.5 font-medium">User</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Usage</th>
                      <th scope="col" className="px-3 py-2.5 font-medium">Joined</th>
                      <th scope="col" className="px-5 py-2.5 text-right font-medium">Last sign-in</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.latest_users.map((u) => (
                      <tr key={u.id} className="transition hover:bg-white/50">
                        <td className="px-5 py-3">
                          <Link to={`/users/${u.id}`} className="flex items-center gap-3">
                            <Avatar name={u.name} email={u.email} id={u.id} size={30} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-ink hover:underline">{u.name || "—"}</span>
                              <span className="block truncate text-xs text-ink-muted">{u.email}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-3"><StatusBadge user={u} /></td>
                        <td className="px-3 py-3 text-ink-soft">{USAGE_LABEL[u.usage_mode] ?? u.usage_mode}</td>
                        <td className="px-3 py-3 text-ink-soft">{formatDate(u.created_at)}</td>
                        <td className="px-5 py-3 text-right text-ink-soft">{timeAgo(u.last_login_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <Empty icon={Users} title="No accounts yet" compact />}
          </Card>

          <p className="text-xs text-ink-muted">Figures exclude admin accounts. Family content (messages, documents, BSN, medical data) is never shown in this console.</p>
        </div>
      ) : null}
    </>
  );
}
