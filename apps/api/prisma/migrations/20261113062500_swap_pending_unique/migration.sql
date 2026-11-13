-- At most one PENDING swap request per appointment, in either role.
-- Prisma cannot express partial unique indexes, so they live here.
CREATE UNIQUE INDEX "SwapRequest_pending_requester_unique"
  ON "SwapRequest" ("requesterAppointmentId")
  WHERE "status" = 'PENDING';

CREATE UNIQUE INDEX "SwapRequest_pending_target_unique"
  ON "SwapRequest" ("targetAppointmentId")
  WHERE "status" = 'PENDING';
