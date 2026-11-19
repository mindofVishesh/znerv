# Phase 3 — History and voluntary mood check-ins

## Implemented (browser simulation)

- Records created on mock-confirmed start (`start-pending` → `ramp-up`). Records never appear on unconfirmed start request.
- Mock status changes update a record's last observed duration. Terminal outcomes: `completed`, `stopped-by-user`, `fault`, or `unknown`.
- Failure/disconnection must **not** be counted as confirmed stop. Unknown records retain `endedAt = null`; last observed duration is not asserted to be the actual total duration.
- The adapter exposes no actual current/voltage measurement and does not communicate with ESP32 or FastAPI.
- Records and voluntary check-ins persist in browser `localStorage` with schema version 1. Storage failures fall back to volatile in-memory data. This is not appropriate for identifiable health data.
- On a browser reload, an unclosed in-progress record is recovered with `unknown` outcome; the previous UI simulation is not resumed as if device-authoritative.
- Optional mood choices align with the Figma Mood screen: Calm / Okay / Anxious / Prefer not to say. Pre-session check-in binds to the next confirmed simulation. After-session check-ins can be added to an ended record in History.

## State/provenance notes

- `observedDurationSeconds` is an estimate based on a browser mock remaining-time report, clamped to 0–1260 seconds. It is **not** measured or authoritative stimulation runtime.
- `endedAt` is a timestamp of mock terminal report for completed/stop/fault, not a confirmed electrical-output cessation timestamp.
- `beforeMood` and `afterMood` are self-reported, optional and do not imply symptom improvement or efficacy.
- Device state is always unknown to this app. Mock adapter success is explicitly labeled simulated.

## Verification

Automated Node `--experimental-strip-types` tests: 20 passed (11 previous + 9 new). New tests cover unconfirmed start, confirmed start and pre-mood, observed duration and user stop, completion and post-mood, disconnect outcome, fault, reload recovery, invalid stored JSON and optional mood clearing. Production TypeScript/Vite build was **not** confirmed because npm dependency installation was unavailable in this environment.

## Remaining for subsequent phases

- API contract agreement with Aarohi and verification of ESP32 firmware (current firmware test timings are not yet the planned 21-minute session).
- FastAPI/SQLite implementation if approved; account/data management and data-retention/privacy requirements.
- Browser accessibility audit with keyboard/screen-reader tools, responsive visual testing, test coverage for full React components and storage availability issues.
- Explicit acceptance/denial/error semantics and telemetry freshness for any future device gateway.
