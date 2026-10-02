import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

router.get("/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: (req as any).userId },
    select: {
      id: true, email: true, handle: true, displayName: true,
      avatarColor: true, bio: true, pronouns: true, status: true,
      isOnline: true, theme: true, createdAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

const updateSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  bio: z.string().max(200).optional(),
  pronouns: z.string().max(20).optional(),
  status: z.string().max(100).optional(),
  avatarColor: z.string().optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

router.patch("/me", authMiddleware, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
    return;
  }
  const user = await prisma.user.update({
    where: { id: (req as any).userId },
    data: parsed.data,
    select: {
      id: true, email: true, handle: true, displayName: true,
      avatarColor: true, bio: true, pronouns: true, status: true,
      isOnline: true, theme: true,
    },
  });
  res.json({ user });
});

router.get("/all", authMiddleware, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { id: { not: (req as any).userId } },
    select: {
      id: true, handle: true, displayName: true, avatarColor: true,
      status: true, isOnline: true,
    },
    orderBy: { displayName: "asc" },
  });
  res.json({ users });
});

router.get("/:id", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, handle: true, displayName: true, avatarColor: true,
      bio: true, pronouns: true, status: true, isOnline: true, createdAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

export default router;
