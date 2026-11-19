# Phase 1 — Figma and source review

**Date:** 2026-11-09. **Status:** Initial foundation, not device-integrated.

## Design evidence

- Accessible Figma URL: https://www.figma.com/design/IEOnI5FSsCZi47n1HiFeOb
- Inspected original `Page 1`, desktop `Ready` (node `2:2`) and mobile `Ready` (node `2:127`). Page also includes desktop/mobile `Active`, `Interrupted`, `History`, `Details`, `Mood` frames.
- Extracted Figma tokens: page `#f6f9fb`, primary ink `#142938`, muted ink `#576e7d`, teal `#056e75`, teal tint `#e0f5f2`, white cards, rounded 18px main panels, Inter font; desktop width 1440 with 48px outer padding; mobile width 390 with 20px outer padding.
- Desktop original uses 38px heading, 78px duration and 36px card padding; mobile original uses 22px card padding and smaller duration.
- Intentional deviations: user explicitly requested **green Start and red Stop**, rather than original Figma's teal action; Phase 1 defines these tokens, but no operational controls are shown. Added transparent engineering-only disclaimer and visible disconnected status. Existing original Figma unchanged.
- **Unverified:** a separate Figma file specifically titled “Session Care — Accessible Desktop & Mobile v2” was not located by key. This work uses the accessible original Figma file; do not claim v2 visual parity.

## Project/source evidence

- Current local `esp32_code.ino` reviewed. Its `RAMP_TIME=30000` (30s) but `RUN_TIME=20000` (20 **seconds**, labelled TEST VERSION), not the required 20 minutes. `RUN_TIME=1200000` is commented out. Its `safetyOK=true` is an unimplemented safety-check placeholder. It uses `dacWrite(25,...)` and computes an **expected** voltage from DAC code; it does not measure voltage or current. Commands are serial `START`, `STOP`, `ESTOP`, `RESET`, and `STATUS`.
- Firmware `STOP` requests a ramp-down rather than guaranteed instantaneous shutdown; its separate `ESTOP` state commands DAC code zero. Neither serial message constitutes proof of physical output. A future gateway must carefully distinguish pending, confirmed, unknown, and faults.
- The unrelated uploaded VerteTrain scoliosis DHF is **not** a ZNERV design input.
- Project discussions establish 21-minute baseline: 30s ramp-up, 20m active, 30s ramp-down; fixed preset, no level controls; history and optional mood check-ins; ESP32/device is the timing authority.
- Files named `D1 Detailed Design.pdf` and `ZNERV_Assignment_4_FINAL.pdf` are reported in earlier project context/Library; no claim here that their complete contents were validated by this scaffold.

## Architecture boundaries for upcoming phases

Browser frontend → session coordination API → device gateway → ESP32 → electronics. Browser renders device-reported session state; a visually moving browser timer alone is not evidence of an active stimulus. The Phase 2 mock gateway must be visibly flagged simulated and must never send hardware commands.

## Planned Phase 2 acceptance gate

- Mock-only Start/Stop control states, separate acknowledged vs requested state, confirmed source indicator.
- Correct mock phases and real-time countdown **in simulation only** with 30/1200/30-second schedule.
- Unexpected disconnect and stale-data behavior; avoid claiming Stop success on request alone.
- Check keyboard focus, screen-reader announcements, contrast, touch targets and desktop/mobile viewport rendering.
