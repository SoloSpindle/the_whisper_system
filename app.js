const ACTIVE_SME = 'John Doe';
const BACKUP_SME = 'Jane Smith';
const SLA_SECONDS = 15 * 60;

const intakeForm = document.getElementById('intakeForm');
const queueEl = document.getElementById('queue');

/** @type {Array<{id:string,targetDepartment:string,issueCategory:string,urgency:string,description:string,timeLeft:number,status:'Awaiting Acknowledgement'|'In Progress'|'Escalated',assignee:string,escalated:boolean}>} */
let tickets = [];

const urgencyStyles = {
  Low: 'bg-slate-200 text-slate-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-rose-100 text-rose-700',
};

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.max(seconds % 60, 0)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

function createTicket(formData) {
  return {
    id: `WS-${Date.now().toString().slice(-6)}`,
    targetDepartment: formData.get('targetDepartment'),
    issueCategory: formData.get('issueCategory'),
    urgency: formData.get('urgency'),
    description: formData.get('description').toString().trim(),
    timeLeft: SLA_SECONDS,
    status: 'Awaiting Acknowledgement',
    assignee: ACTIVE_SME,
    escalated: false,
  };
}

function renderQueue() {
  if (!tickets.length) {
    queueEl.innerHTML = `
      <div class="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">
        No whispers submitted yet.
      </div>
    `;
    return;
  }

  queueEl.innerHTML = tickets
    .map((ticket) => {
      const isAcked = ticket.status === 'In Progress';
      const isEscalated = ticket.status === 'Escalated';

      const cardState = isAcked
        ? 'border-emerald-300 bg-emerald-50'
        : isEscalated
          ? 'border-rose-300 bg-rose-50'
          : 'border-slate-200 bg-white';

      const timerColor = isAcked ? 'text-emerald-700' : isEscalated ? 'text-rose-700' : 'text-blue-700';
      const urgencyClass = urgencyStyles[ticket.urgency] || urgencyStyles.Low;

      return `
        <div class="rounded-lg border p-4 ${cardState}">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-sm text-slate-500">${ticket.id} · ${ticket.targetDepartment}</p>
              <h3 class="text-lg font-semibold">${ticket.issueCategory}</h3>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-semibold ${urgencyClass}">${ticket.urgency} Urgency</span>
          </div>

          <p class="mt-3 text-slate-700">${ticket.description}</p>

          <div class="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">SLA Countdown</p>
              <p class="text-2xl font-bold ${timerColor}">${formatTime(ticket.timeLeft)}</p>
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

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              data-action="ack"
              data-id="${ticket.id}"
              class="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
              ${isAcked ? 'disabled' : ''}
            >
              Acknowledge
            </button>
            <button
              data-action="breach"
              data-id="${ticket.id}"
              class="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-rose-300"
              ${isEscalated || isAcked ? 'disabled' : ''}
            >
              Fast-Forward / Simulate Breach
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

function escalateTicket(ticket) {
  ticket.timeLeft = 0;
  ticket.status = 'Escalated';
  ticket.assignee = BACKUP_SME;
  ticket.escalated = true;
}

intakeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(intakeForm);
  const ticket = createTicket(formData);
  tickets = [ticket, ...tickets];
  intakeForm.reset();
  renderQueue();
});

queueEl.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  const id = target.dataset.id;
  const action = target.dataset.action;
  const ticket = tickets.find((item) => item.id === id);

  if (!ticket) {
    return;
  }

  if (action === 'ack' && ticket.status !== 'In Progress') {
    ticket.status = 'In Progress';
  }

  if (action === 'breach' && ticket.status === 'Awaiting Acknowledgement') {
    escalateTicket(ticket);
  }

  renderQueue();
});

setInterval(() => {
  let hasChange = false;

  tickets.forEach((ticket) => {
    if (ticket.status !== 'Awaiting Acknowledgement') {
      return;
    }

    if (ticket.timeLeft > 0) {
      ticket.timeLeft -= 1;
      hasChange = true;
    }

    if (ticket.timeLeft <= 0 && !ticket.escalated) {
      escalateTicket(ticket);
      hasChange = true;
    }
  });

  if (hasChange) {
    renderQueue();
  }
}, 1000);

renderQueue();
