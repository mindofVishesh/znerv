# Current-target selection — UI change request

**Status:** Implemented in the **simulation-only** frontend, NOT in physical hardware, firmware, backend, or verified electrical output.

## Requested change

A session now accepts a discrete **requested current target** of `1.5`, `2.0`, `2.5` (default), `3.0`, `3.5`, or `4.0` **mA**. These are electrical **current targets** (milliamperes), not voltage targets. Selection is available before Start and locked when a start is pending or a session is ongoing. The 21-minute schedule remains unchanged. The mock adapter accepts only this allowlist and echoes the target; it does **not** model or measure electrical current. Session records preserve the requested target, and older records are labeled unrecorded.

## API contract proposal (not yet implemented)

1. `GET /api/device/status`: fresh, authoritative controller report of readiness, active session ID, phase, fault, timestamp/sequence, and **confirmed target** distinct from measured output.
2. `POST /api/sessions/start`: authenticated single request `{commandId, targetCurrentMa}` with an allowed decimal target. Backend MUST independently validate one of `[1.5,2,2.5,3,3.5,4]`, reject active/pending/not-ready/stale/faulted states, and forward the request only through the controlled gateway. It should respond pending until firmware confirms the command and its parameters; no blind replay after timeout.
3. `POST /api/sessions/stop`: correlate command ID, distinguish pending/accepted/physically confirmed/unknown. Determine whether a one-action stop is required by the risk review.
4. `GET /api/sessions`: include requested target, controller-confirmed target if available, actual measured current statistics only if independently validated, and evidence provenance; never conflate them.

## Decisions required before implementing real current control

- Update controlled ZNERV requirements, use cases, D0/D1/D2 interfaces, and design history/traceability; the earlier single-fixed-setting requirement is superseded by this **new user request**, but is NOT yet team-verified.
- BME team must assess risks, justify allowable range and step resolution, output compliance/load limits, current-feedback regulation, waveform, ramp/slew behavior, output shutoff, and independent sensing/fault protections. **A DAC voltage setting is not a current measurement.**
- Firmware shown in project sources accepts textual START without a value and has a **20-second test run** and placeholder safety check. It cannot accept this new current target safely as-is.
- Perform bench-only validation on suitable dummy loads with calibrated equipment and independent hardware protections before any consideration of human-connected testing. The browser must never be a safety controller.

## Current data limitations

Synthetic browser history uses `localStorage` and is not appropriate for real participant data. No certified device behavior, clinical efficacy, actual current delivery, or medical standard compliance is claimed.
