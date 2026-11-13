import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { prisma } from "../../config/prisma";

export const notificationRouter: Router = Router();
notificationRouter.use(authenticate);

const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

notificationRouter.get("/", async (req, res, next) => {
  try {
    const auth = req.auth!;
    const where = auth.role === "PATIENT"
      ? { OR: [{ patientId: auth.patientId ?? undefined }, { userId: auth.userId }] }
      : { userId: auth.userId };
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const unread = notifications.filter((n) => !n.readAt).length;
    res.json({ data: { notifications, unread } });
  } catch (error) {
    next(error);
  }
});

notificationRouter.patch("/:id/read", async (req, res, next) => {
  try {
    const auth = req.auth!;
    const id = param(req.params.id);
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Notification not found" } });
    if (auth.role === "PATIENT" && existing.patientId !== auth.patientId && existing.userId !== auth.userId) {
      return res.status(403).json({ error: { code: "FORBIDDEN", message: "Forbidden" } });
    }
    const notification = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    res.json({ data: { notification } });
  } catch (error) {
    next(error);
  }
});

notificationRouter.patch("/read-all", async (req, res, next) => {
  try {
    const auth = req.auth!;
    const where = auth.role === "PATIENT"
      ? { OR: [{ patientId: auth.patientId ?? undefined }, { userId: auth.userId }], readAt: null }
      : { userId: auth.userId, readAt: null };
    await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
    res.json({ data: { ok: true } });
  } catch (error) {
    next(error);
  }
});
