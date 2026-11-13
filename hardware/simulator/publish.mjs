#!/usr/bin/env node
import mqtt from "mqtt";

const args = process.argv.slice(2);
const get = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};

const url = get("--url", process.env.MQTT_URL || "mqtt://localhost:1883");
const room = get("--room", "OPD-1");
const pattern = get("--pattern", "in-out");
const client = mqtt.connect(url);

client.on("connect", () => {
  const send = (type) => {
    const payload = { v: 1, roomId: room, type, ts: Date.now(), seq: Math.floor(Math.random() * 1e9) };
    const topic = type === "HEARTBEAT" ? `waitless/rooms/${room}/heartbeat` : `waitless/rooms/${room}/occupancy`;
    client.publish(topic, JSON.stringify(payload), { qos: 0 });
    console.log("published", topic, payload);
  };

  send("HEARTBEAT");
  if (pattern === "in-out") {
    setTimeout(() => send("OCCUPIED"), 500);
    setTimeout(() => send("VACANT"), 5000);
  } else if (pattern === "occupied") {
    send("OCCUPIED");
  } else if (pattern === "vacant") {
    send("VACANT");
  }
  setTimeout(() => client.end(), 6000);
});

client.on("error", (err) => {
  console.error("mqtt error", err.message);
  process.exit(1);
});
