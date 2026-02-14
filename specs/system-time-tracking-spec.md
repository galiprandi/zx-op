# Time Tracking Accumulator System

## 1. Database Schema (PostgreSQL)

```sql
CREATE TABLE player_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode_id TEXT UNIQUE NOT NULL,
    total_allowed_seconds INTEGER NOT NULL, -- Total duration purchased
    accumulated_seconds INTEGER DEFAULT 0, -- Time consumed in previous finished segments
    last_start_at TIMESTAMP WITH TIME ZONE, -- The moment the player hit "Play"
    is_active BOOLEAN DEFAULT FALSE, -- Current state: playing or paused
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- End of day/business hours
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_barcode ON player_sessions(barcode_id);
```

## 2. Core Logic: Difference Engine

### A. Event: Start/Resume (POST /play)

1. Lookup session by `barcode_id`.
2. Ensure `is_active` is false and `expires_at` is in the future.
3. Update:

```sql
UPDATE player_sessions SET
  is_active = true,
  last_start_at = NOW()
WHERE barcode_id = $1;
```

### B. Event: Pause/Stop (POST /pause)

1. Compute `current_segment` in seconds: `NOW() - last_start_at`.
2. Update:

```sql
UPDATE player_sessions SET
  accumulated_seconds = accumulated_seconds + EXTRACT(EPOCH FROM (NOW() - last_start_at)),
  is_active = false,
  last_start_at = NULL
WHERE barcode_id = $1;
```

### C. Request: Time Balance (GET /status)

Remaining seconds derive from the current state; never stored directly.

```sql
SELECT 
    barcode_id,
    CASE 
        WHEN is_active = false THEN (total_allowed_seconds - accumulated_seconds)
        ELSE (total_allowed_seconds - (accumulated_seconds + EXTRACT(EPOCH FROM (NOW() - last_start_at))))
    END AS remaining_seconds
FROM player_sessions
WHERE barcode_id = $1;
```

## 3. Future-Proofing

1. **Automatic Session Termination (Ghost Players)**
   * Running `GET /status` should detect `remaining_seconds <= 0` and perform the pause logic so the session is marked inactive and time is consumed before showing 0.

2. **Audit Log (History)**
   * Introduce `session_logs` to record each `PLAY` and `PAUSE` event with `session_id` and `timestamp` for support tracing.

3. **Dynamic Multipliers (Happy Hour)**
   * Add `consumption_rate DOUBLE PRECISION DEFAULT 1.0` to `player_sessions` and multiply the elapsed time by this rate when updating `accumulated_seconds`.

4. **Redis Integration**
   * Cache active sessions keyed by `barcode_id`. On `PLAY`, write `{ "barcode_id": "123", "offset": 1200, "started_at": 1715234200 }` to Redis for quick status checks for the 5,000 concurrent GETs per second.

## 4. Waiting Sessions (Never Started)

**Definition:** Sessions that have purchased time but have **never been started**. They satisfy all of:

* `is_active = false`
* `last_start_at IS NULL`
* `accumulated_seconds = 0`
* `total_allowed_seconds - accumulated_seconds > 0` (i.e., `remaining_seconds > 0`)

**Why it matters:** These IDs are shown on the monitor (and later on the TV “next to enter” view) so staff can prioritize onboarding.

**Backend source:** `/api/sessions/active` already returns all sessions with computed `remaining_seconds`; the waiting subset is derived in the client using the predicate above. No separate endpoint is required today.

**UI handling (Monitor):**

* **Stat card:** “Esperando” displays the count of waiting sessions.
* **List:** Shows each waiting session barcode, no progress bar (hasn’t started), ordered by current fetch order.
* **Separation from Pausa:** Paused sessions are those with time remaining **and** evidence of prior play (`last_start_at` not null **or** `accumulated_seconds > 0`). Waiting sessions must not appear in the paused bucket.

**Edge cases:**

* If time is added via check-in and the session has never started, it remains in the waiting bucket until first PLAY.
* If time expires before first play, it will drop from waiting once `remaining_seconds <= 0`.
```
