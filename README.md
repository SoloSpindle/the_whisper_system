# The Whisper System (Standalone Static App)

A zero-backend, single-page enterprise routing app prototype designed for leadership demos.

## What this app includes

- **Whisper Intake Form** (department, category, urgency, description)
- **Coverage Baton panel** with Active SME and Secondary/Backup SME
- **15-minute SLA countdown** on every submitted ticket
- **Automated escalation cascade** from Active SME to Backup SME when SLA expires
- **Fast-Forward / Simulate Breach** control for presentation scenarios
- **Ticket lifecycle actions**: acknowledge, escalate, resolve
- **Queue filters**: search, status, urgency
- **Metrics dashboard**: total, awaiting SLA, in progress, escalated
- **Activity feed** for routing and status events
- **Local persistence** via `localStorage`
- **Demo utilities**: seed demo tickets, export JSON snapshot, clear all state

## File structure

```
/home/runner/work/the_whisper_system/the_whisper_system/
├── index.html   # Full dashboard UI layout
├── app.js       # Local app state, timer loop, escalation logic, persistence
├── package.json # Local run and validation scripts
└── README.md
```

## Run locally

```bash
cd /home/runner/work/the_whisper_system/the_whisper_system
npm run start
```

Then open `http://localhost:4173`.

## Validation command

```bash
npm run check
```
