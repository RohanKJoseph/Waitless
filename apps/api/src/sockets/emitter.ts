import { getIo } from "./index";

function safeEmit(room: string, event: string, payload: unknown) {
  try {
    getIo().to(room).emit(event, payload);
  } catch {
    // sockets not initialized (e.g. tests/scripts)
  }
}

export const socketEmitter = {
  queueUpdated(doctorId: string, payload: unknown) {
    safeEmit(`doctor:${doctorId}`, "queue:updated", payload);
    safeEmit("admin:queue", "queue:updated", payload);
  },
  appointmentUpdated(patientId: string | null | undefined, payload: unknown) {
    if (patientId) safeEmit(`patient:${patientId}`, "appointment:updated", payload);
    safeEmit("admin:queue", "appointment:updated", payload);
  },
  notificationNew(userId: string | null | undefined, patientId: string | null | undefined, payload: unknown) {
    if (patientId) safeEmit(`patient:${patientId}`, "notification:new", payload);
    if (userId) safeEmit(`user:${userId}`, "notification:new", payload);
  },
};
