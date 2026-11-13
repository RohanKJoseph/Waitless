# Firmware Skeleton (FRDM-MCXN236)

## Goal
Publish room occupancy and heartbeat events to Waitless via MQTT.

## Toolchain options
- MCUXpresso SDK / IDE
- Zephyr RTOS (board support dependent)

## Minimal tasks
- Sensor read loop (occupancy)
- Debounce/state transition detection
- MQTT publish: `waitless/rooms/{roomId}/occupancy`
- Heartbeat task: `waitless/rooms/{roomId}/heartbeat`
- Persistent/incrementing `seq` for dedupe

## Notes
- FRDM-MCXN236 requires an external Wi-Fi/network module; document UART/SPI wiring in `../docs/wiring.md`.
- Backend treats occupancy as advisory; staff confirmation remains authoritative for consultation completion.
