# Phase 2 implementation and limits

- Implemented an interactive, *mock-only* Session screen; green Start, red Stop and modal confirmation; phase text; timer; simulated status source; disconnect and fault injection.
- Session timeline is 1260 seconds: 30-second ramp-up, 1200-second active interval, 30-second ramp-down. The attached ESP32 test firmware's shorter active duration is not treated as a production specification.
- Start request moves to `start-pending` until its mock acknowledgement. Stop request moves to `stop-pending` until mock acknowledgement. No physical output is claimed for either.
- A stale/disconnected adapter produces unknown status and unavailable time. A fault status does not assert that downstream circuit output was turned off.
- Console and browser must not be used as evidence of electrical safety or output cessation.
- History page remains a truthful empty state because persistence and records are scheduled for Phase 3.
- The mock adapter state survives navigation but not refresh; it is intentionally not stored on disk.

## Verification status

Eleven automated tests passed locally, covering duration, phase boundaries, start/stop transitions, pending acknowledgements, disconnection/fault handling, command guards, and styling tokens. These are not clinical validation, circuit tests, BLE tests, WCAG audits, or full browser interaction tests. `npm test` passed (11/11). Dependency installation timed out in this runtime, so the React production build and browser visual checks remain unverified; run `npm install && npm run build` on a machine with package registry access.

## Follow-on work

Phase 3: durable session records with clearly identified source, interruption reason, actual elapsed time from authoritative state, and optional mood check-ins. Phase 4: define and verify gateway/backend contract; require device-originated timestamps and status before integration.
