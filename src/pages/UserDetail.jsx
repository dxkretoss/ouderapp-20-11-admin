import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Baby, Ban, CalendarDays, CalendarRange, Check, CheckCircle2, Circle, Clock, Copy, Euro, HandCoins, History, Link2, ListTodo,
  Lock, LogIn, Mail, MonitorSmartphone, Repeat, ShieldAlert, UserCheck, Users,
} from "lucide-react";
import { useApi } from "@/lib/useApi";
import { api, errorText } from "@/lib/api";
import { deviceLabel, formatDate, formatDateTime, timeAgo, USAGE_LABEL } from "@/lib/format";
import { Avatar, Badge, Button, Card, DescriptionList, Empty, ErrorBox, FIELD, Modal, Skeleton, Tabs } from "@/components/ui";
import { StatusBadge } from "@/components/StatusBadge";
import { useBreadcrumb } from "@/components/Layout";

const INVITE_TONE = { accepted: "good", sent: "info", pending: "info", viewed: "info", declined: "bad", rejected: "bad", cancelled: "neutral", expired: "neutral" };
const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Same names as the parent app (lib/start-store.js patronen, en.json).
const PATTERN = { "om-de-week": "Alternate weeks", weekenden: "Alternate weekends", "2-2-3": "2-2-3", "2-2-5-5": "2-2-5-5", "vaste-dagen": "Fixed days each week", "een-weekend": "One weekend every two weeks", wisselend: "Varying", zelf: "Custom" };
const CONFIRM = { open: ["Waiting for other parent", "warn"], klopt: ["Confirmed by other parent", "good"], klopt_niet: ["Other parent says it is not right", "bad"] };
const EXPENSE_TONE = { agreed: "good", approved: "good", accepted: "good", pending: "warn", rejected: "bad", declined: "bad" };
const SETTLEMENT_DONE = ["afgerond", "ontvangst-bevestigd"];

function CopyId({ id }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={() => { navigator.clipboard?.writeText(id).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }); }}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line-strong bg-white/60 px-2 py-0.5 font-mono text-[11px] text-ink-soft hover:text-ink" title="Copy user ID">
      <span className="truncate">{id}</span>{done ? <Check className="size-3 shrink-0 text-good" /> : <Copy className="size-3 shrink-0" />}
    </button>
  );
}

function Fact({ icon: Icon, label, value, title }) {
  return (
    <div className="flex items-center gap-2 text-[13px]" title={title}>
      <Icon className="size-4 text-ink-muted" aria-hidden />
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function ListRow({ icon: Icon, title, sub, right, to, muted = false }) {
  const inner = (
    <>
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${muted ? "bg-white/70 text-ink-muted" : "bg-brand-soft text-brand-strong"}`}><Icon className="size-4" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">{title}</p>
        {sub ? <p className="truncate text-xs text-ink-muted">{sub}</p> : null}
      </div>
      {right}
    </>
  );
  return to
    ? <li><Link to={to} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/50">{inner}</Link></li>
    : <li className="flex items-center gap-3 px-5 py-3">{inner}</li>;
}

function SummaryTile({ icon: Icon, label, value, sub, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-[18px] border border-white/85 bg-white/55 p-3.5 text-left transition hover:bg-white/80">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong"><Icon className="size-4" aria-hidden /></span>
      <span className="min-w-0">
        <span className="block text-xs text-ink-muted">{label}</span>
        <span className="block text-[15px] font-semibold tabular-nums">{value}</span>
        {sub ? <span className="block truncate text-[11px] text-ink-muted">{sub}</span> : null}
      </span>
    </button>
  );
}

/** Two-week schedule grid from this user's point of view. */
function ScheduleGrid({ days }) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[64px_repeat(7,1fr)] gap-1.5 text-center text-[11px] font-medium text-ink-muted">
        <span />{DAYS.map((d) => <span key={d}>{d}</span>)}
      </div>
      {[0, 1].map((w) => (
        <div key={w} className="grid grid-cols-[64px_repeat(7,1fr)] items-center gap-1.5">
          <span className="text-[11px] font-medium text-ink-muted">Week {w + 1}</span>
          {days.slice(w * 7, w * 7 + 7).map((d, i) => (
            <span key={i} title={d === "user" ? "With this user" : "With the other parent"}
              className={`grid h-9 place-items-center rounded-[10px] text-[11px] font-semibold ${d === "user" ? "border-2 border-[#7f9a86] bg-[#e9efe3] text-[#2f4a3a]" : "border border-[#e2d8cb] bg-[repeating-linear-gradient(135deg,#fff_0_5px,#f2ece3_5px_7px)] text-[#8a5a44]"}`}>
              {d === "user" ? "U" : "O"}
            </span>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap gap-4 pt-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-[4px] border-2 border-[#7f9a86] bg-[#e9efe3]" />U · with this user</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-[4px] border border-[#e2d8cb] bg-[repeating-linear-gradient(135deg,#fff_0_3px,#f2ece3_3px_5px)]" />O · with the other parent</span>
      </div>
    </div>
  );
}

function dateRange(start, end) {
  if (!start) return "—";
  return end && end !== start ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start);
}

export default function UserDetail() {
  const { id } = useParams();
  const { data, error, loading, reload, setData } = useApi("get-user", { id });
  const [tab, setTab] = useState("overview");
  const [dialog, setDialog] = useState(null); // "disable" | "enable"
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  useBreadcrumb(data ? [{ label: "Users", to: "/users" }, { label: data.user.name || data.user.email }] : null);

  const run = async (action, fields, done) => {
    setBusy(true);
    setActionError(null);
    try {
      const r = await api(action, { id, ...fields });
      if (r.user) setData((d) => ({ ...d, user: { ...d.user, ...r.user } }));
      setNotice(done);
      setDialog(null);
      setReason("");
      reload();
    } catch (e) {
      setActionError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const close = () => { if (!busy) { setDialog(null); setActionError(null); } };

  if (error && !data) {
    return <ErrorBox message={error.code === "NOT_FOUND" ? "This user does not exist (or is an administrator)." : errorText(error)} onRetry={error.code === "NOT_FOUND" ? undefined : reload} />;
  }
  if (!data) {
    return (
      <div className="space-y-6" aria-hidden>
        <Skeleton className="h-44 rounded-[22px]" />
        <Skeleton className="h-10 w-[480px] max-w-full rounded-full" />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72 rounded-[22px]" /><Skeleton className="h-72 rounded-[22px] lg:col-span-2" /></div>
      </div>
    );
  }

  const { user, children, connections, invitations, sessions, activity } = data;
  const appointments = data.appointments ?? [];
  const tasks = data.tasks ?? [];
  const expenses = data.expenses ?? [];
  const settlements = data.settlements ?? [];
  const totals = data.totals ?? {};
  const activeSessions = sessions.filter((s) => s.active).length;
  const withSchedule = children.filter((c) => c.schedule && !c.schedule.later);
  const who = user.name || user.email;

  // ---- Sections ------------------------------------------------------------------------------
  const scheduleSection = children.length ? (
    <div className="grid gap-6 xl:grid-cols-2">
      {children.map((c) => {
        const s = c.schedule;
        const [confLabel, confTone] = CONFIRM[s?.confirmation] ?? [null, null];
        return (
          <Card key={c.id} title={`Weekly schedule · ${c.name}`} subtitle={s && !s.later ? (s.set_by_user ? "Set up by this user" : "Set up by the other parent") : undefined}
            action={confLabel ? <Badge tone={confTone}>{confLabel}</Badge> : null}>
            {!s ? <Empty icon={CalendarRange} title="No weekly schedule yet" compact />
              : s.later ? <Empty icon={Clock} title="Chose to set up the schedule later" compact />
              : (
                <>
                  <ScheduleGrid days={s.days} />
                  <div className="mt-5 border-t border-line/80 pt-3">
                    <DescriptionList items={[
                      ["Pattern", PATTERN[s.pattern] ?? s.pattern ?? "—"],
                      ["Handover time", s.handover_time || "—"],
                      ["Handover place", s.place || "—"],
                      ["Saved", s.saved_at ? formatDateTime(s.saved_at) : "—"],
                    ]} />
                  </div>
                </>
              )}
          </Card>
        );
      })}
    </div>
  ) : <Card><Empty icon={CalendarRange} title="No children, so no weekly schedule" compact /></Card>;

  const calendarSection = (
    <Card title="Calendar appointments" subtitle={`Created by this user · ${appointments.length}${appointments.length >= 50 ? " (latest 50)" : ""}`} padded={false}>
      {appointments.length ? (
        <ul className="divide-y divide-line/80">
          {appointments.map((e) => (
            <ListRow key={e.id} icon={e.private ? Lock : CalendarDays} muted={e.private}
              title={e.private ? <span className="italic text-ink-soft">Private appointment</span> : e.title}
              sub={[dateRange(e.start_date, e.end_date), e.is_all_day ? "All day" : e.start_time?.slice(0, 5), e.child_names?.join(", ")].filter(Boolean).join(" · ")}
              right={e.status && e.status !== "confirmed" ? <Badge tone={e.status === "cancelled" ? "neutral" : "warn"}>{e.status}</Badge> : e.private ? <Badge dot={false}>Only for them</Badge> : null} />
          ))}
        </ul>
      ) : <Empty icon={CalendarDays} title="No appointments created" compact />}
    </Card>
  );

  const tasksSection = (
    <Card title="Tasks" subtitle={`Created by or assigned to this user · ${totals.open_tasks ?? 0} open`} padded={false}>
      {tasks.length ? (
        <ul className="divide-y divide-line/80">
          {tasks.map((t) => (
            <ListRow key={t.id} icon={t.is_completed ? CheckCircle2 : Circle} muted={t.is_completed}
              title={<span className={t.is_completed ? "text-ink-muted line-through" : ""}>{t.title}</span>}
              sub={[
                t.created_by_user ? "Created by this user" : "Assigned to this user",
                t.assignee && t.assignee !== "self" ? `for ${t.assignee}` : null,
                t.deadline ? `due ${formatDate(t.deadline)}` : null,
                t.recurrence && t.recurrence !== "eenmalig" ? t.recurrence : null,
                t.child_names?.join(", "),
              ].filter(Boolean).join(" · ")}
              right={t.is_completed ? <Badge tone="good">Done</Badge> : <Badge tone="warn">Open</Badge>} />
          ))}
        </ul>
      ) : <Empty icon={ListTodo} title="No tasks" compact />}
    </Card>
  );

  const costsSection = (
    <div className="space-y-6">
      <Card title="Costs" subtitle={`Paid or entered by this user · ${euro.format(totals.expenses_amount ?? 0)} paid by them`} padded={false}>
        {expenses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="border-b border-line/80 bg-white/40 text-xs text-ink-muted [&_th]:font-medium">
                <tr><th className="px-5 py-2.5">Description</th><th className="px-3 py-2.5">Date</th><th className="px-3 py-2.5">Paid by</th><th className="px-3 py-2.5">Status</th><th className="px-5 py-2.5 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-line/80">
                {expenses.map((e) => (
                  <tr key={e.id} className="transition hover:bg-white/50">
                    <td className="px-5 py-3"><p className="max-w-[280px] truncate font-medium">{e.description}</p>{e.child_names?.length ? <p className="text-xs text-ink-muted">{e.child_names.join(", ")}</p> : null}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-ink-soft">{formatDate(e.date)}</td>
                    <td className="px-3 py-3 text-ink-soft">{e.payer === "self" ? "This user" : e.payer}</td>
                    <td className="px-3 py-3">{e.settled ? <Badge tone="good">Settled</Badge> : <Badge tone={EXPENSE_TONE[e.approval_status] ?? "neutral"}>{e.approval_status || e.status}</Badge>}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums">{euro.format(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty icon={Euro} title="No costs" compact />}
      </Card>
      <Card title="Settlements" subtitle="Payments between the parents (bank details are never shown)" padded={false}>
        {settlements.length ? (
          <ul className="divide-y divide-line/80">
            {settlements.map((x) => (
              <ListRow key={x.id} icon={HandCoins}
                title={<>{euro.format(x.amount)} <span className="font-normal text-ink-muted">· {x.direction === "pays" ? `pays ${x.other}` : `receives from ${x.other}`}</span></>}
                sub={`Created ${formatDate(x.created_at)}${x.finished_at ? ` · finished ${formatDate(x.finished_at)}` : x.paid_at ? ` · paid ${formatDate(x.paid_at)}` : ""}`}
                right={<Badge tone={SETTLEMENT_DONE.includes(x.status) ? "good" : "warn"}>{x.status.replace(/-/g, " ")}</Badge>} />
            ))}
          </ul>
        ) : <Empty icon={HandCoins} title="No settlements" compact />}
      </Card>
    </div>
  );

  const childrenCard = (
    <Card title="Children" subtitle="First name and birth year only — no medical or identity data" padded={false}>
      {children.length ? (
        <ul className="divide-y divide-line/80">
          {children.map((c) => (
            <ListRow key={c.id} icon={Baby}
              title={<>{c.name}{c.birth_year ? <span className="font-normal text-ink-muted"> · born {c.birth_year}</span> : null}</>}
              sub={c.other_parents.length ? <>Also linked: {c.other_parents.map((p, i) => <span key={p.id}>{i ? ", " : ""}<Link to={`/users/${p.id}`} className="font-medium text-brand hover:underline">{p.name || p.email || "Unknown"}</Link></span>)}</> : "No other parent linked"}
              right={<Badge dot={false}>{c.role}</Badge>} />
          ))}
        </ul>
      ) : <Empty icon={Baby} title="No children added" compact />}
    </Card>
  );
  const connectionsCard = (
    <Card title="Co-parent links" padded={false}>
      {connections.length ? (
        <ul className="divide-y divide-line/80">
          {connections.map((c) => (
            <ListRow key={c.id} icon={Link2} to={`/users/${c.parent.id}`} title={c.parent.name || c.parent.email || "Unknown"} sub={`${c.parent.email || ""} · since ${formatDate(c.created_at)}`}
              right={<Badge tone={["connected", "active"].includes(c.status) ? "good" : "neutral"}>{c.status}</Badge>} />
          ))}
        </ul>
      ) : <Empty icon={Link2} title="Not linked to another parent" compact />}
    </Card>
  );
  const sessionsCard = (
    <Card title="Sessions" subtitle={`${activeSessions} active · most recent 10`} padded={false}>
      {sessions.length ? (
        <ul className="divide-y divide-line/80">
          {sessions.map((s) => (
            <ListRow key={s.id} icon={MonitorSmartphone} title={deviceLabel(s.user_agent)} sub={`Started ${formatDateTime(s.created_at)} · last seen ${timeAgo(s.last_seen_at)}`}
              right={s.active ? <Badge tone="good">Active</Badge> : <Badge>{s.revoked_at ? "Signed out" : "Expired"}</Badge>} />
          ))}
        </ul>
      ) : <Empty icon={History} title="No sessions yet" compact />}
    </Card>
  );
  const invitationsCard = (
    <Card title="Invitations sent" padded={false}>
      {invitations.length ? (
        <ul className="divide-y divide-line/80">
          {invitations.map((inv) => (
            <ListRow key={inv.id} icon={Mail} title={inv.to_email} sub={`Sent ${formatDate(inv.created_at)}${inv.accepted_at ? ` · accepted ${formatDate(inv.accepted_at)}` : ` · expires ${formatDate(inv.expires_at)}`}`}
              right={<Badge tone={INVITE_TONE[inv.status] ?? "neutral"}>{inv.status}</Badge>} />
          ))}
        </ul>
      ) : <Empty icon={Mail} title="No invitations sent" compact />}
    </Card>
  );

  return (
    <>
      {/* Profile header */}
      <section className="overflow-hidden rounded-[22px] border border-white/85 bg-glass shadow-card backdrop-blur-md">
        <div className="h-20 bg-[linear-gradient(120deg,#dce6d2_0%,#f3ede3_55%,#eadbc7_100%)]" />
        <div className="px-6 pb-5">
          <div className="-mt-9 flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-end gap-4">
              <Avatar name={user.name} email={user.email} id={user.id} size={72} ring />
              <div className="min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-semibold tracking-tight">{user.name || "—"}</h1>
                  <StatusBadge user={user} />
                </div>
                <a href={`mailto:${user.email}`} className="mt-0.5 block truncate text-[13px] text-ink-soft hover:text-ink">{user.email}</a>
              </div>
            </div>
            <div className="pb-1">
              {user.disabled_at
                ? <Button icon={UserCheck} onClick={() => setDialog("enable")}>Enable account</Button>
                : <Button variant="danger-outline" icon={Ban} onClick={() => setDialog("disable")}>Disable account</Button>}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line/80 pt-4">
            <Fact icon={Users} label="Usage" value={USAGE_LABEL[user.usage_mode] ?? user.usage_mode} />
            <Fact icon={CalendarDays} label="Joined" value={formatDate(user.created_at)} />
            <Fact icon={LogIn} label="Last sign-in" value={timeAgo(user.last_login_at)} title={formatDateTime(user.last_login_at)} />
            <Fact icon={Clock} label="Last action" value={timeAgo(activity.last_event_at)} />
          </div>
        </div>
      </section>

      {notice ? <p role="status" className="mt-4 flex items-center gap-2 rounded-2xl border border-good/20 bg-good-soft px-3.5 py-2.5 text-[13px] font-medium text-good"><CheckCircle2 className="size-4" aria-hidden />{notice}</p> : null}
      {user.disabled_at ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-bad/20 bg-bad-soft px-4 py-3 text-[13px] text-bad">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div><b className="font-semibold">Account disabled on {formatDateTime(user.disabled_at)}.</b> {user.disabled_reason ? `Reason: ${user.disabled_reason}.` : "No reason given."} This person cannot sign in.</div>
        </div>
      ) : null}

      <div className="mt-6">
        <Tabs label="User sections" value={tab} onChange={setTab} items={[
          ["overview", "Overview"],
          ["schedule", "Schedule", withSchedule.length],
          ["calendar", "Calendar", appointments.length],
          ["tasks", "Tasks", tasks.length],
          ["costs", "Costs", expenses.length],
          ["family", "Family", children.length + connections.length],
          ["sessions", "Sessions", activeSessions],
          ["invitations", "Invitations", invitations.length],
        ]} />
      </div>

      <div className={`mt-6 transition-opacity ${loading ? "opacity-70" : ""}`}>
        {tab === "overview" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <SummaryTile icon={Baby} label="Children" value={children.length} onClick={() => setTab("family")} />
              <SummaryTile icon={CalendarRange} label="Weekly schedule" value={withSchedule.length ? "Set" : "Not set"} sub={withSchedule.length ? `${withSchedule.length} child${withSchedule.length === 1 ? "" : "ren"}` : undefined} onClick={() => setTab("schedule")} />
              <SummaryTile icon={CalendarDays} label="Appointments" value={appointments.length} onClick={() => setTab("calendar")} />
              <SummaryTile icon={ListTodo} label="Tasks" value={tasks.length} sub={`${totals.open_tasks ?? 0} open`} onClick={() => setTab("tasks")} />
              <SummaryTile icon={Euro} label="Costs paid" value={euro.format(totals.expenses_amount ?? 0)} sub={`${expenses.length} item${expenses.length === 1 ? "" : "s"}`} onClick={() => setTab("costs")} />
              <SummaryTile icon={Repeat} label="Settlements" value={settlements.length} onClick={() => setTab("costs")} />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card title="Account details">
                <div className="-my-2.5">
                  <DescriptionList items={[
                    ["Name", user.name || "—"],
                    ["E-mail", <span className="break-all">{user.email}</span>],
                    ["Status", <StatusBadge user={user} />],
                    ["E-mail verified", user.is_verified ? "Yes" : "No"],
                    ["Onboarding", user.onboarding_completed ? "Completed" : "Not finished"],
                    ["Usage", USAGE_LABEL[user.usage_mode] ?? user.usage_mode],
                    ["Joined", formatDateTime(user.created_at)],
                    ["Last sign-in", formatDateTime(user.last_login_at)],
                    ["Active sessions", activeSessions],
                    ["Recorded actions", activity.events],
                    ["User ID", <CopyId id={user.id} />],
                  ]} />
                </div>
              </Card>
              <div className="space-y-6 lg:col-span-2">
                {childrenCard}
                {connectionsCard}
              </div>
            </div>
          </div>
        ) : tab === "schedule" ? scheduleSection
          : tab === "calendar" ? calendarSection
          : tab === "tasks" ? tasksSection
          : tab === "costs" ? costsSection
          : tab === "family" ? <div className="grid gap-6 lg:grid-cols-2">{childrenCard}{connectionsCard}</div>
          : tab === "sessions" ? sessionsCard
          : invitationsCard}
      </div>

      {/* Confirmations */}
      <Modal open={dialog === "disable"} title="Disable this account?" icon={Ban} tone="bad" onClose={close}
        description={`${who} is signed out on every device and can no longer sign in. Their data stays, and you can enable the account again later.`}>
        <label className="block text-xs font-medium text-ink-soft" htmlFor="reason">Reason <span className="font-normal text-ink-muted">(only visible to admins)</span></label>
        <textarea id="reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className={`mt-1.5 h-auto py-2 ${FIELD}`} placeholder="For example: abuse reported on 26 Nov" />
        {actionError ? <div className="mt-3"><ErrorBox message={actionError} /></div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
          <Button variant="danger" icon={Ban} loading={busy} onClick={() => run("disable-user", { reason }, "Account disabled.")}>Disable account</Button>
        </div>
      </Modal>
      <Modal open={dialog === "enable"} title="Enable this account?" icon={UserCheck} tone="good" onClose={close} description={`${who} can sign in again with their password.`}>
        {actionError ? <div className="mb-3"><ErrorBox message={actionError} /></div> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
          <Button icon={UserCheck} loading={busy} onClick={() => run("enable-user", {}, "Account enabled.")}>Enable account</Button>
        </div>
      </Modal>
    </>
  );
}
