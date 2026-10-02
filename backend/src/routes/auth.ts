import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/auth.js";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  handle: z.string().min(2).max(20).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(40),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
    return;
  }
  const { email, password, handle, displayName } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { handle: handle.toLowerCase() }] },
  });
  if (existing) {
    res.status(409).json({ error: "Email or handle already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      handle: handle.toLowerCase(),
      displayName,
      avatarColor,
    },
  });

  const token = signToken({ userId: user.id, email: user.email });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, handle: user.handle, displayName: user.displayName, avatarColor: user.avatarColor },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({
    token,
    user: { id: user.id, email: user.email, handle: user.handle, displayName: user.displayName, avatarColor: user.avatarColor },
  });
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = JSON.parse(Buffer.from(header.slice(7).split(".")[1], "base64").toString());
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, email: true, handle: true, displayName: true,
        avatarColor: true, bio: true, pronouns: true, status: true,
        isOnline: true, theme: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
