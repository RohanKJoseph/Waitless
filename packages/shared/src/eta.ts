export interface EtaInputEntry {
  status: string;
  position: number;
  avgConsultMinutes: number;
}

const QUEUE_AHEAD = new Set(["WAITING", "NOTIFIED", "CALLED", "DELAYED", "IN_CONSULTATION"]);

export function estimateWaitMinutes(entriesAhead: EtaInputEntry[], fallbackMinutes = 12): number {
  if (!entriesAhead.length) return 0;
  const mins = entriesAhead.reduce((sum, e) => sum + Math.max(3, Math.min(60, e.avgConsultMinutes || fallbackMinutes)), 0);
  return Math.max(0, Math.round(mins));
}

export function countAhead(entries: Array<{ status: string }>): number {
  return entries.filter((e) => QUEUE_AHEAD.has(e.status)).length;
}
