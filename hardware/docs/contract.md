# Hardware Contract (Waitless)

## MQTT topics
- `waitless/rooms/{roomId}/occupancy` → `{ v:1, roomId, type:"OCCUPIED"|"VACANT", ts, seq, sig }`
- `waitless/rooms/{roomId}/heartbeat` → `{ v:1, ts, rssi, fw }`

## HTTP fallback
- `POST /api/v1/hardware/events` with same payload shape (`roomId`, `type`, `ts`, `seq`, optional `payload`)

## Auth & integrity
- Device auth via MQTT broker credentials/ACL (Mosquitto config in `infra/mosquitto/`)
- Optional HMAC body signature field `sig` using `DEVICE_HMAC_SECRET` (backend verification hook can be extended)

## Idempotency & processing
- Events persisted with `dedupeKey` (`roomId:seq:type`) and unique index; replays ignored
- Backend records events and treats occupancy as staff-assist hints (not authoritative patient identity)

## Failure modes
- Missing/unknown room: rejected (404) by HTTP ingest; MQTT subscriber logs and skips
- Duplicate seq/replay: accepted as duplicate/no-op
- Broker/device offline: heartbeat absence can be surfaced in admin views (future enhancement)

## Simulator
- `node hardware/simulator/publish.mjs --room OPD-1 --pattern in-out` (requires `mqtt` installed at repo root/api context or run with dependencies available)
