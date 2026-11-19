# ZNERV Frontend — Phase 3

An accessible, responsive **browser simulation** of the ZNERV engineering-prototype interface, extending Phase 2 with browser-local session history and optional mood check-ins.

## Run

Requires Node.js 22+ and npm, with access to the npm registry.

```bash
npm install
npm run dev
```

Open the local URL Vite prints. To run automated tests:

```bash
npm test
npm run build
```

**Validation in the creation environment:** `npm test` passed 20/20. `npm run build` remains unverified because package installation could not complete (npm registry dependencies were not cached). Please run the install/build commands on your machine before using the demo in a presentation.

## Demo walkthrough

1. Open **Session**, select **Connect demo adapter**. This is not a BLE/device connection.
2. Optionally answer the **Before your session** mood check-in. You can skip it.
3. Select **Start session**. The mock adapter takes approximately 500 ms to acknowledge it. Only a confirmed mock start creates a session record.
4. Watch the 21-minute demo timeline: 30 seconds ramp-up, 20 minutes active, 30 seconds ramp-down. It uses actual elapsed wall-clock time in the browser, not accelerated time.
5. Select **Stop session**, confirm, and wait for mock acknowledgement; or let the demo finish. The session appears in **History**, with timestamp and observed simulated duration.
6. In History, expand a record to see its outcome, interruption reason, before/after mood selections and provenance. You can add or edit a post-session check-in there.
7. For error handling, try **Simulate disconnect** or **Inject demo fault** while the demo is active. The history will show an unknown/fault outcome, not a verified physical stop.

## What's implemented

- Session, mock Start/Stop and mock connection/fault flows (inherited from Phase 2).
- UI presentation of the fixed 1260-second timeline (30 + 1200 + 30), no user-selectable modes/intensity.
- A new session record after **confirmed mock start**, never from an unacknowledged command.
- Record updates based on mock status, including simulated completion, user stop, fault, and unknown connection loss.
- Persistent browser-only records using versioned `localStorage` (`znerv.demo.records.v1`), at most 500 records.
- Browser reload recovery: a previously in-progress session becomes **outcome unknown**; it is **not** marked stopped or completed.
- Optional before/after mood values (`Calm`, `Okay`, `Anxious`, `Prefer not to say`) with skip/clear functionality.
- Session-details panel, dates, observed duration, outcomes, reasons, provenance and mood entries.
- Responsive desktop/mobile layouts, semantic labels/fieldset, aria-expanded detail controls and live status messages.

## What is NOT implemented

- Real BLE, FastAPI, SQLite, ESP32 control, live measured output or hardware safety handling.
- An authoritative device history or electrical-output confirmation.
- Clinical data storage, accounts, encryption at rest, export/deletion controls, HIPAA readiness or treatment claims.
- Cross-device sync. Private browsing mode and browser storage clearing may remove records; browser policy/quota might prevent persistence.
- Session restoration as an ongoing controlled session after reload. The record is preserved with an unknown outcome instead.
- Full WCAG 2.2 AA audit, browser visual regression test, or formal usability validation.

## Architecture and boundaries

`src/services/mockGateway.ts` drives *only* simulated status. `src/records/sessionRecords.ts` subscribes to its status updates and stores demo records. `src/hooks/useSessionRecords.ts` makes records reactive to React views. `src/components/MoodCheckIn.tsx` provides voluntary local mood entries. `src/pages/HistoryPage.tsx` renders records and detail views.

In future integration, **device firmware and a validated gateway must own safety and physical timing**. Browser records, acknowledgements and timer displays must never be presented as proof of stimulation, measured current, safe cessation, or clinical effects. Backend persistence and device contracts must be reviewed separately before replacing this mock adapter.

## Source/design notes

The frontend follows the reviewed Figma file's pale background, neutral typography, white cards, and teal accents, while maintaining explicit user-requested green Start and red Stop. Original Figma was not modified. Refer to `docs/PHASE1_REVIEW.md`, `docs/PHASE2_IMPLEMENTATION.md`, and `docs/PHASE3_IMPLEMENTATION.md` for implementation details.


## Change: selectable mock current targets
The Session page now offers six **requested** current targets (1.5 to 4.0 mA, in 0.5 mA increments; default 2.5 mA). The choice locks during an active or pending demo. The mock gateway validates it and includes it in simulated history. No physical electrical output or delivered current is controlled or measured. See `docs/CURRENT_CONTROL_CHANGE.md` for proposed backend integration and required hazard review.
