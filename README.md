# Resonance SCADA

**An adaptive engine-room interface that treats the operator's heart rate and the machine's telemetry as one feedback loop. As stress rises, the screen sheds data.**

Built solo at the Cursor hackathon in Austin, TX on September 19, 2026.

**Live demo:** [resonance-scada-sprint.vercel.app](https://resonance-scada-sprint.vercel.app) · **Built with:** Next.js 16, React 19, Tailwind CSS 4, TypeScript, Supabase Realtime, Vercel

<!-- Add a screenshot or GIF of all four states here: docs/states.gif -->

---

## The problem

In an alarm cascade, the weak link is not sensor latency. It is the operator's working memory. A stressed watchstander scanning 28+ gauges misses most of them, and conventional SCADA screens show the same density whether the plant is fine or on fire, and whether the person reading them is calm or overloaded.

## The scenario

The engine room of an 87-foot Coast Guard patrol boat: two MTU 16V main diesels and two ship's service generators. I stood watch in spaces like this for eight years as a machinery technician, so the gauges, values and casualty procedure come from that experience.

## How it works: four states from two inputs

The interface reads two signals: **engine RPM** (plant state) and **operator heart rate** (human state). Together they select one of four layouts.

| State | Plant | Operator | What the screen does |
|---|---|---|---|
| **1 · Baseline** | Nominal (< 2,000 RPM) | Calm (≤ 120 bpm) | Full four-quadrant overview, 28 channels, three-tier type scale |
| **2 · Calm mirror** | Nominal | Overloaded (> 120 bpm) | Clears to **PLANT NOMINAL** so the operator doesn't panic over a safe plant |
| **3 · Isolate** | Casualty (> 2,000 RPM) | Calm | Isolates the failing loop in amber and shows only the diagnostic pressures |
| **4 · Triage** | Casualty | Overloaded | Black screen, three critical values and one directive: isolate Turbo 1 lube oil |

## Design decisions

- **AI never touches the safety loop.** The mechanical alarm logic is a fixed, deterministic state machine. Adaptation happens only in the presentation layer.
- **ISA-101 high-performance HMI.** Dark slate background, grayscale by default, and color reserved for anomalies so it means something when it appears.
- **Prioritize, don't delete.** Secondary systems drop off the screen in high-load states but stay logged.
- **Deltas, not diagnoses.** Biometric triggers look for sudden changes rather than clinical thresholds, so a watchstander climbing a ladder doesn't trip the system.
- **Adoption is a design problem.** Operators resist automation that takes control away. The F-16 Auto-GCAS story, where pilots distrusted a ground-collision override until it started saving lives, shaped how the states hand control back.

## Architecture

- A single-row Supabase table, `telemetry_state` (`engine_rpm`, `operator_hr`), holds the shared state with row-level security enabled.
- Demo sliders stand in for the sensors. Slider changes are debounced 500 ms and written to Supabase; every open viewer receives the update over a Realtime `postgres_changes` subscription.
- A daily Vercel cron (`vercel.json`) calls `/api/keepalive`, which reads the `telemetry_state` row so the free-tier Supabase project never pauses from inactivity.
- Local and database values are tracked separately. Incoming updates are ignored for 1.5 s after a local interaction, which fixed a race where remote echoes snapped the slider back mid-drag.

## Run it locally

```bash
npm install
npm run dev
```

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The app expects a `telemetry_state` table with one row (`id = 1`) and Realtime enabled on that table.

## Status

Hackathon prototype. All three commits were made on event day. Telemetry other than RPM and heart rate is simulated. Next steps: live wearable input (Fitbit Sense 2) and a per-operator baseline for heart-rate deltas.

## Author

**Jonathan Kattner** — AI UX designer and systems architect. Former Coast Guard machinery technician.