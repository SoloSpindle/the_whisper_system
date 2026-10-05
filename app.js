const SLA_SECONDS = 15 * 60;
const STORAGE_KEY = 'whisper-system-state-v1';

const demoDescriptions = [
  'Need confirmation on process exception before external deadline.',
  'Cross-team policy interpretation is blocking approval workflow.',
  'Urgent clarification needed for compliance checklist item.',
  'Audit prep question requires immediate SME guidance.',
];

const state = {
  roster: {
    active: 'John Doe',
    backup: 'Jane Smith',
  },
  tickets: [],
  activity: [],
  filters: {
    search: '',
    status: 'all',
    urgency: 'all',
  },
};

const intakeForm = document.getElementById('intakeForm');
const queueEl = document.getElementById('queue');
const metricsEl = document.getElementById('metrics');
const activityFeedEl = document.getElementById('activityFeed');
const activeSmeDisplay = document.getElementById('activeSmeDisplay');
const backupSmeDisplay = document.getElementById('backupSmeDisplay');

const searchFilter = document.getElementById('searchFilter');
const statusFilter = document.getElementById('statusFilter');
const urgencyFilter = document.getElementById('urgencyFilter');
const passBatonBtn = document.getElementById('passBatonBtn');
const seedDemoBtn = document.getElementById('seedDemoBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const exportBtn = document.getElementById('exportBtn');

const urgencyStyles = {
  Low: 'bg-slate-200 text-slate-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-rose-100 text-rose-700',
};

const statusStyles = {
  'Awaiting Acknowledgement': 'border-slate-200 bg-white',
  'In Progress': 'border-emerald-300 bg-emerald-50',
  Escalated: 'border-rose-300 bg-rose-50',
  Resolved: 'border-blue-300 bg-blue-50',
};

function nowIso() {
  return new Date().toISOString();
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function remainingSeconds(ticket) {
  if (ticket.status !== 'Awaiting Acknowledgement') {
    return ticket.timeRemainingAtAction ?? Math.max(0, Math.floor((new Date(ticket.deadlineAt).getTime() - new Date(ticket.createdAt).getTime()) / 1000));
  }

  return Math.max(0, Math.floor((new Date(ticket.deadlineAt).getTime() - Date.now()) / 1000));
}

function addActivity(message) {
  state.activity = [{ id: crypto.randomUUID(), at: nowIso(), message }, ...state.activity].slice(0, 60);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);

    if (parsed.roster && parsed.roster.active && parsed.roster.backup) {
      state.roster = parsed.roster;
    }

    if (Array.isArray(parsed.tickets)) {
      state.tickets = parsed.tickets;
    }

    if (Array.isArray(parsed.activity)) {
      state.activity = parsed.activity;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function buildTicket({ targetDepartment, issueCategory, urgency, description }) {
  const createdAt = nowIso();
  const deadlineAt = new Date(Date.now() + SLA_SECONDS * 1000).toISOString();
  return {
    id: `WS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 90 + 10)}`,
    targetDepartment,
    issueCategory,
    urgency,
    description,
    status: 'Awaiting Acknowledgement',
    assignee: state.roster.active,
    createdAt,
    deadlineAt,
    acknowledgedAt: null,
    escalatedAt: null,
    resolvedAt: null,
    timeRemainingAtAction: null,
    eventTrail: [
      {
        at: createdAt,
        message: `Submitted and routed to ${state.roster.active}`,
      },
    ],
  };
}

function addTicket(ticket) {
  state.tickets = [ticket, ...state.tickets];
  addActivity(`${ticket.id} submitted for ${ticket.targetDepartment} and routed to ${ticket.assignee}.`);
}

function escalateTicket(ticket, reason) {
  if (ticket.status !== 'Awaiting Acknowledgement') {
    return;
  }

  ticket.status = 'Escalated';
  ticket.escalatedAt = nowIso();
  ticket.timeRemainingAtAction = 0;
  ticket.assignee = state.roster.backup;
  ticket.eventTrail.push({ at: ticket.escalatedAt, message: `Escalated to backup (${ticket.assignee}) — ${reason}` });
  addActivity(`${ticket.id} escalated to ${ticket.assignee} (${reason}).`);
}

function acknowledgeTicket(ticket) {
  if (!['Awaiting Acknowledgement', 'Escalated'].includes(ticket.status)) {
    return;
  }

  ticket.status = 'In Progress';
  ticket.acknowledgedAt = nowIso();
  ticket.timeRemainingAtAction = remainingSeconds(ticket);
  ticket.eventTrail.push({ at: ticket.acknowledgedAt, message: `Acknowledged by ${ticket.assignee}` });
  addActivity(`${ticket.id} acknowledged by ${ticket.assignee}.`);
}

function resolveTicket(ticket) {
  if (ticket.status === 'Resolved') {
    return;
  }

  ticket.status = 'Resolved';
  ticket.resolvedAt = nowIso();
  ticket.timeRemainingAtAction = remainingSeconds(ticket);
  ticket.eventTrail.push({ at: ticket.resolvedAt, message: `Resolved by ${ticket.assignee}` });
  addActivity(`${ticket.id} resolved by ${ticket.assignee}.`);
}

function passesFilters(ticket) {
  const searchText = state.filters.search.trim().toLowerCase();
  const inSearch =
    !searchText ||
    [ticket.id, ticket.assignee, ticket.description, ticket.targetDepartment, ticket.issueCategory]
      .join(' ')
      .toLowerCase()
      .includes(searchText);

  const inStatus = state.filters.status === 'all' || ticket.status === state.filters.status;
  const inUrgency = state.filters.urgency === 'all' || ticket.urgency === state.filters.urgency;

  return inSearch && inStatus && inUrgency;
}

function renderMetrics() {
  const total = state.tickets.length;
  const awaiting = state.tickets.filter((t) => t.status === 'Awaiting Acknowledgement').length;
  const inProgress = state.tickets.filter((t) => t.status === 'In Progress').length;
  const escalated = state.tickets.filter((t) => t.status === 'Escalated').length;

  const cards = [
    { label: 'Total Tickets', value: total, accent: 'text-slate-800' },
    { label: 'Awaiting SLA', value: awaiting, accent: 'text-blue-700' },
    { label: 'In Progress', value: inProgress, accent: 'text-emerald-700' },
    { label: 'Escalated', value: escalated, accent: 'text-rose-700' },
  ];

  metricsEl.innerHTML = cards
    .map(
      (card) => `
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${card.label}</p>
          <p class="mt-2 text-2xl font-bold ${card.accent}">${card.value}</p>
        </div>
      `,
    )
    .join('');
}

function renderRoster() {
  activeSmeDisplay.textContent = state.roster.active;
  backupSmeDisplay.textContent = state.roster.backup;
}

function renderActivity() {
  if (!state.activity.length) {
    activityFeedEl.innerHTML = '<p class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No activity yet.</p>';
    return;
  }

  activityFeedEl.innerHTML = state.activity
    .map(
      (item) => `
      <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p class="text-xs text-slate-500">${formatDateTime(item.at)}</p>
        <p class="mt-1 text-sm text-slate-800">${item.message}</p>
      </div>
    `,
    )
    .join('');
}

function renderQueue() {
  const visible = state.tickets.filter(passesFilters);

  if (!visible.length) {
    queueEl.innerHTML = `
      <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
        No tickets match the current filters.
      </div>
    `;
    return;
  }

  queueEl.innerHTML = visible
    .map((ticket) => {
      const countdown = remainingSeconds(ticket);
      const timerClass = ticket.status === 'Escalated' ? 'text-rose-700' : ticket.status === 'In Progress' ? 'text-emerald-700' : ticket.status === 'Resolved' ? 'text-blue-700' : 'text-blue-700';
      const urgencyClass = urgencyStyles[ticket.urgency] || urgencyStyles.Low;
      const cardState = statusStyles[ticket.status] || statusStyles['Awaiting Acknowledgement'];
      const canBreach = ticket.status === 'Awaiting Acknowledgement';
      const canAck = ticket.status === 'Awaiting Acknowledgement' || ticket.status === 'Escalated';
      const canResolve = ticket.status === 'In Progress' || ticket.status === 'Escalated';

      return `
        <div class="rounded-lg border p-4 ${cardState}">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">${ticket.id} · ${ticket.targetDepartment}</p>
              <h3 class="mt-1 text-lg font-semibold">${ticket.issueCategory}</h3>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-semibold ${urgencyClass}">${ticket.urgency} Urgency</span>
          </div>

          <p class="mt-3 text-sm text-slate-700">${ticket.description}</p>

          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">SLA Countdown</p>
              <p class="text-2xl font-bold ${timerClass}">${formatTime(countdown)}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">Current Owner</p>
              <p class="font-semibold">${ticket.assignee}</p>
            </div>
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p class="font-semibold">${ticket.status}</p>
            </div>
          </div>

          <p class="mt-3 text-xs text-slate-500">Created ${formatDateTime(ticket.createdAt)}</p>

          <div class="mt-4 flex flex-wrap gap-2">
            <button data-action="ack" data-id="${ticket.id}" class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300" ${canAck ? '' : 'disabled'}>
              Acknowledge
            </button>
            <button data-action="breach" data-id="${ticket.id}" class="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-300" ${canBreach ? '' : 'disabled'}>
              Fast-Forward / Simulate Breach
            </button>
            <button data-action="resolve" data-id="${ticket.id}" class="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300" ${canResolve ? '' : 'disabled'}>
              Mark Resolved
            </button>
          </div>

          <details class="mt-4 rounded-lg border border-slate-200 bg-white p-3">
            <summary class="cursor-pointer text-sm font-semibold text-slate-700">Event Trail</summary>
            <ul class="mt-2 space-y-1 text-sm text-slate-600">
              ${ticket.eventTrail
                .map((event) => `<li>• ${formatDateTime(event.at)} — ${event.message}</li>`)
                .join('')}
            </ul>
          </details>
        </div>
      `;
    })
    .join('');
}

function renderAll() {
  renderRoster();
  renderMetrics();
  renderQueue();
  renderActivity();
}

function persistAndRender() {
  saveState();
  renderAll();
}

intakeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(intakeForm);

  const ticket = buildTicket({
    targetDepartment: formData.get('targetDepartment'),
    issueCategory: formData.get('issueCategory'),
    urgency: formData.get('urgency'),
    description: formData.get('description').toString().trim(),
  });

  addTicket(ticket);
  intakeForm.reset();
  persistAndRender();
});

queueEl.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const id = target.dataset.id;
  const action = target.dataset.action;
  const ticket = state.tickets.find((item) => item.id === id);
  if (!ticket) {
    return;
  }

  if (action === 'ack') {
    acknowledgeTicket(ticket);
  } else if (action === 'breach') {
    ticket.deadlineAt = nowIso();
    escalateTicket(ticket, 'manual breach simulation');
  } else if (action === 'resolve') {
    resolveTicket(ticket);
  }

  persistAndRender();
});

passBatonBtn.addEventListener('click', () => {
  [state.roster.active, state.roster.backup] = [state.roster.backup, state.roster.active];
  addActivity(`Coverage baton passed: ${state.roster.active} is now Active SME.`);
  persistAndRender();
});

seedDemoBtn.addEventListener('click', () => {
  const demoRows = [
    { targetDepartment: 'Compliance', issueCategory: 'Policy Clarification', urgency: 'High' },
    { targetDepartment: 'Operations', issueCategory: 'Process Exception', urgency: 'Medium' },
    { targetDepartment: 'Finance', issueCategory: 'Audit Readiness', urgency: 'Low' },
  ];

  demoRows.forEach((row, index) => {
    const ticket = buildTicket({
      ...row,
      description: demoDescriptions[index % demoDescriptions.length],
    });
    if (index === 0) {
      ticket.deadlineAt = new Date(Date.now() + 45 * 1000).toISOString();
    }
    addTicket(ticket);
  });

  persistAndRender();
});

clearAllBtn.addEventListener('click', () => {
  const shouldClear = confirm('Clear all tickets and activity history?');
  if (!shouldClear) {
    return;
  }

  state.tickets = [];
  state.activity = [];
  addActivity('System reset performed; all tickets cleared.');
  persistAndRender();
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ exportedAt: nowIso(), ...state }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `whisper-system-export-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  addActivity('Queue exported to JSON snapshot.');
  persistAndRender();
});

searchFilter.addEventListener('input', (event) => {
  state.filters.search = event.target.value;
  renderQueue();
});

statusFilter.addEventListener('change', (event) => {
  state.filters.status = event.target.value;
  renderQueue();
});

urgencyFilter.addEventListener('change', (event) => {
  state.filters.urgency = event.target.value;
  renderQueue();
});

function tick() {
  let changed = false;

  state.tickets.forEach((ticket) => {
    if (ticket.status === 'Awaiting Acknowledgement' && remainingSeconds(ticket) <= 0) {
      escalateTicket(ticket, '15-minute SLA missed');
      changed = true;
    }
  });

  if (changed) {
    persistAndRender();
  } else {
    renderQueue();
    renderMetrics();
  }
}

loadState();
renderAll();
setInterval(tick, 1000);
