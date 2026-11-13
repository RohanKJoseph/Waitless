# Wiring & Calibration Notes (Placeholder)

- Board: NXP FRDM-MCXN236 (target). Wi-Fi/radio add-on required (e.g. ESP32/CYW43439 module) and linked over UART/SPI depending on firmware stack.
- Occupancy sensor options: PIR / mmWave / ToF (select based on room layout and privacy constraints).
- Suggested bring-up:
  1. Validate sensor readings over serial console.
  2. Add debounce/filtering for flicker (`SENSOR_DEBOUNCE_SECONDS`).
  3. Publish heartbeat and occupancy events over MQTT with monotonic `seq`.
  4. Calibrate threshold/delay per room and document results here.
- Photo/diagram placeholders: add board, sensor, and mounting diagrams during hardware integration.
