# The Whisper System (Static Prototype)

A zero-backend, static single-page prototype for demonstrating role-based cross-department routing, 15-minute SLA tracking, and automated escalation.

## Recommended File Structure

```
/home/runner/work/the_whisper_system/the_whisper_system/
├── index.html   # Main dashboard layout (intake form, roster, queue)
├── app.js       # Local browser state, countdown timer, escalation logic
├── package.json # Minimal project metadata scaffolded with npm
└── README.md
```

## Run Locally

Open `index.html` directly in a browser, or serve statically:

```bash
python -m http.server 4173
```

Then visit `http://localhost:4173`.
