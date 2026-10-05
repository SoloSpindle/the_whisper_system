import React, { useState, useEffect } from 'react';
import {
  Radio,
  Bell,
  Search,
  Activity,
  Clock,
  ShieldCheck,
  Send,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ChevronDown,
  Building2,
  Tag,
  MessageSquare,
  TrendingUp,
  Inbox,
  X,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Static configuration (generic placeholders only)                          */
/* -------------------------------------------------------------------------- */

const DEPARTMENTS = {
  Operations: { primary: 'John Doe', backup: 'Alex Rivera' },
  Compliance: { primary: 'Jane Smith', backup: 'Morgan Lee' },
  Finance: { primary: 'Sam Patel', backup: 'Taylor Brooks' },
  Legal: { primary: 'Chris Morgan', backup: 'Jordan Ellis' },
  'IT Services': { primary: 'Priya Shah', backup: 'Casey Nguyen' },
  'Human Resources': { primary: 'Maria Garcia', backup: 'Riley Chen' },
};

const CATEGORIES = [
  'Process Clarification',
  'Policy Interpretation',
  'System Access',
  'Data Discrepancy',
  'Escalated Customer Issue',
  'Cross-Team Hand-off',
];

const URGENCY = {
  Low: {
    idle: 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50',
    active: 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  Medium: {
    idle: 'border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50/50',
    active: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20',
    dot: 'bg-amber-500',
  },
  High: {
    idle: 'border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50/50',
    active: 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500/20',
    dot: 'bg-red-500',
  },
};

const STATUS_STYLES = {
  'SLA Met': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'In Progress': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Awaiting Ack': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Breached - Escalated': 'bg-red-600 text-white ring-red-700 font-bold shadow-sm shadow-red-600/30',
};

const INITIAL_TICKETS = [
  {
    id: 'WSP-1041',
    dept: 'Compliance',
    category: 'Policy Interpretation',
    urgency: 'High',
    primarySme: DEPARTMENTS.Compliance.primary,
    backupSme: DEPARTMENTS.Compliance.backup,
    elapsed: 222,
    status: 'SLA Met',
    escalated: false,
  },
  {
    id: 'WSP-1042',
    dept: 'Operations',
    category: 'Cross-Team Hand-off',
    urgency: 'Medium',
    primarySme: DEPARTMENTS.Operations.primary,
    backupSme: DEPARTMENTS.Operations.backup,
    elapsed: 108,
    status: 'In Progress',
    escalated: false,
  },
  {
    id: 'WSP-1043',
    dept: 'Finance',
    category: 'Data Discrepancy',
    urgency: 'Low',
    primarySme: DEPARTMENTS.Finance.primary,
    backupSme: DEPARTMENTS.Finance.backup,
    elapsed: 47,
    status: 'Awaiting Ack',
    escalated: false,
  },
];

const EMPTY_FORM = { dept: '', category: '', urgency: 'Medium', description: '' };

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const formatElapsed = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${String(sec).padStart(2, '0')}s`;
};

const initials = (name) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

/* -------------------------------------------------------------------------- */
/*  Small presentational components                                           */
/* -------------------------------------------------------------------------- */

function KpiCard({ icon: Icon, label, value, trend, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-200 transition-colors group-hover:bg-blue-50 group-hover:ring-blue-200">
          <Icon className="h-5 w-5 text-blue-900" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
        <TrendingUp className="h-3.5 w-3.5" />
        <span>{trend}</span>
      </div>
    </div>
  );
}

function SelectField({ icon: Icon, label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 shadow-sm transition focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function Avatar({ name, tone = 'navy', size = 'h-8 w-8' }) {
  const tones = {
    navy: 'bg-gradient-to-br from-blue-800 to-blue-950 text-white',
    red: 'bg-gradient-to-br from-red-500 to-red-700 text-white',
    muted: 'bg-slate-200 text-slate-500',
  };
  return (
    <div
      className={`${size} ${tones[tone]} flex shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-white`}
    >
      {initials(name)}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main App                                                                  */
/* -------------------------------------------------------------------------- */

export default function App() {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [nextId, setNextId] = useState(1044);
  const [cascadeFired, setCascadeFired] = useState(false);

  // Live elapsed-time ticker (stops for escalated tickets)
  useEffect(() => {
    const timer = setInterval(() => {
      setTickets((prev) => prev.map((t) => (t.escalated ? t : { ...t, elapsed: t.elapsed + 1 })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Clear new-row highlight
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightId]);

  const activeWhispers = 9 + tickets.length; // 12 on initial load

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.dept || !form.category || !form.description.trim()) {
      setError('Please complete all fields before submitting.');
      return;
    }
    setError('');
    const id = `WSP-${nextId}`;
    const roster = DEPARTMENTS[form.dept];
    const newTicket = {
      id,
      dept: form.dept,
      category: form.category,
      urgency: form.urgency,
      primarySme: roster.primary,
      backupSme: roster.backup,
      elapsed: 0,
      status: 'Awaiting Ack',
      escalated: false,
    };
    setTickets((prev) => [newTicket, ...prev]);
    setNextId((n) => n + 1);
    setHighlightId(id);
    setForm(EMPTY_FORM);
    setToast({
      type: 'success',
      title: 'Whisper routed',
      body: `${id} delivered directly to ${roster.primary} (${form.dept}).`,
    });
  };

  const simulateEscalation = () => {
    const count = tickets.filter((t) => !t.escalated).length;
    setTickets((prev) =>
      prev.map((t) => ({ ...t, escalated: true, status: 'Breached - Escalated' }))
    );
    setCascadeFired(true);
    setToast({
      type: 'alert',
      title: 'Escalation cascade triggered',
      body: `${count || tickets.length} whisper(s) auto-rerouted to Backup SMEs. Zero blind hand-offs.`,
    });
  };

  const resetDemo = () => {
    setTickets(INITIAL_TICKETS);
    setNextId(1044);
    setCascadeFired(false);
    setToast(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-800 to-blue-950 shadow-md shadow-blue-900/30">
              <Radio className="h-5 w-5 text-white" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-bold tracking-tight text-slate-900">The Whisper System</h1>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Enterprise SME Routing
              </p>
            </div>
          </div>

          <div className="hidden max-w-sm flex-1 px-8 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search whispers, SMEs, departments…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">Jane Doe</p>
                <p className="text-xs text-slate-500">Operations Lead</p>
              </div>
              <Avatar name="Jane Doe" size="h-9 w-9" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* --------------------------- Page title --------------------------- */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Command Center</h2>
            <p className="mt-1 text-sm text-slate-500">
              Real-time visibility into every cross-department request — routed, acknowledged, and protected.
            </p>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 self-start rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 sm:mt-0 sm:self-auto">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            All routing services operational
          </div>
        </div>

        {/* ---------------------------- KPI cards --------------------------- */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <KpiCard
            icon={Activity}
            label="Active Whispers"
            value={activeWhispers}
            trend="Live across 6 departments"
            accent="bg-gradient-to-r from-blue-700 to-blue-900"
          />
          <KpiCard
            icon={Clock}
            label="Avg Acknowledgment Time"
            value="4m 30s"
            trend="62% faster than email baseline"
            accent="bg-gradient-to-r from-sky-500 to-blue-700"
          />
          <KpiCard
            icon={ShieldCheck}
            label="SLA Breaches Prevented"
            value="100%"
            trend="Every breach auto-escalated"
            accent="bg-gradient-to-r from-emerald-500 to-teal-600"
          />
        </section>

        {/* --------------------------- Main grid ---------------------------- */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ---------------------- Intake form ---------------------- */}
          <div className="lg:col-span-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-900" />
                  <h3 className="text-base font-semibold text-slate-900">New Whisper</h3>
                </div>
                <p className="mt-1 text-sm text-slate-500">Route a request directly to the right SME.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
                <SelectField
                  icon={Building2}
                  label="Target Department"
                  value={form.dept}
                  onChange={(v) => setForm({ ...form, dept: v })}
                  options={Object.keys(DEPARTMENTS)}
                  placeholder="Select a department"
                />

                <SelectField
                  icon={Tag}
                  label="Issue Category"
                  value={form.category}
                  onChange={(v) => setForm({ ...form, category: v })}
                  options={CATEGORIES}
                  placeholder="Select a category"
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Urgency</label>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup">
                    {Object.keys(URGENCY).map((level) => {
                      const selected = form.urgency === level;
                      return (
                        <button
                          type="button"
                          key={level}
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setForm({ ...form, urgency: level })}
                          className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all ${
                            selected ? URGENCY[level].active : URGENCY[level].idle
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${URGENCY[level].dot}`} />
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">Brief Description</label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe what you need and any relevant context…"
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{form.description.length}/500</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-800 to-blue-950 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-900/25 transition-all hover:shadow-lg hover:shadow-blue-900/30 hover:brightness-110 active:scale-[0.99]"
                >
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  Submit Whisper
                </button>
              </form>
            </div>
          </div>

          {/* ---------------------- SME Queue ---------------------- */}
          <div className="space-y-4 lg:col-span-8">
            {/* Killer feature: Simulate Escalation */}
            <div
              className={`flex flex-col gap-4 rounded-xl border p-5 shadow-sm transition-colors sm:flex-row sm:items-center sm:justify-between ${
                cascadeFired ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-lg p-2.5 ${
                    cascadeFired ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200'
                  }`}
                >
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {cascadeFired ? 'Cascade Active — Backup SMEs Engaged' : 'Auto-Escalation Engine'}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {cascadeFired
                      ? 'All breached whispers were rerouted instantly. No request was left unowned.'
                      : 'If a Primary SME misses the 15-minute SLA, ownership transfers to a Backup SME automatically.'}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {cascadeFired && (
                  <button
                    onClick={resetDemo}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </button>
                )}
                <button
                  onClick={simulateEscalation}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-red-600/30 transition-all hover:shadow-lg hover:shadow-red-600/40 hover:brightness-110 active:scale-[0.98]"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Simulate Escalation Cascade
                </button>
              </div>
            </div>

            {/* Data table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-blue-900" />
                  <h3 className="text-base font-semibold text-slate-900">Active SME Queue</h3>
                  <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {tickets.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                  Live
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50/80">
                    <tr>
                      {['Ticket ID', 'Target Dept', 'Assigned SME', 'Elapsed Time', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.map((t) => (
                      <tr
                        key={t.id}
                        className={`transition-colors duration-500 ${
                          t.escalated
                            ? 'bg-red-50/60 hover:bg-red-50'
                            : highlightId === t.id
                            ? 'bg-blue-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Ticket ID */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-8 w-1 rounded-full ${
                                t.escalated ? 'bg-red-500' : URGENCY[t.urgency].dot
                              }`}
                            />
                            <div>
                              <p className="font-mono text-sm font-semibold text-slate-900">{t.id}</p>
                              <p className="text-xs text-slate-500">{t.category}</p>
                            </div>
                          </div>
                        </td>

                        {/* Dept */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            {t.dept}
                          </span>
                        </td>

                        {/* Assigned SME */}
                        <td className="whitespace-nowrap px-6 py-4">
                          {t.escalated ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 opacity-60">
                                <Avatar name={t.primarySme} tone="muted" size="h-6 w-6" />
                                <span className="text-xs text-slate-500 line-through">{t.primarySme}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-3.5 w-3.5 text-red-500" />
                                <Avatar name={t.backupSme} tone="red" />
                                <span className="text-sm font-semibold text-slate-900">{t.backupSme}</span>
                                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700 ring-1 ring-inset ring-orange-600/20">
                                  Backup SME
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <Avatar name={t.primarySme} />
                              <span className="text-sm font-semibold text-slate-900">{t.primarySme}</span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                Active SME
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Elapsed */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div
                            className={`inline-flex items-center gap-1.5 font-mono text-sm ${
                              t.escalated ? 'font-bold text-red-600' : 'text-slate-700'
                            }`}
                          >
                            <Clock className="h-4 w-4" />
                            {t.escalated ? '> 15m' : formatElapsed(t.elapsed)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              STATUS_STYLES[t.status]
                            }`}
                          >
                            {t.escalated ? (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            ) : t.status === 'SLA Met' ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            )}
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-500">
                <span>SLA threshold: 15 minutes to acknowledgment</span>
                <span className="hidden sm:inline">Showing {tickets.length} active whispers</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------ Toast ------------------------------ */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm">
          <div
            className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg ${
              toast.type === 'alert' ? 'border-red-200' : 'border-emerald-200'
            }`}
          >
            <div
              className={`rounded-lg p-2 ${
                toast.type === 'alert' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {toast.type === 'alert' ? <Zap className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{toast.body}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
