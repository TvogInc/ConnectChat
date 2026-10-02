import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../lib/auth.js";
import { z } from "zod";

const router = Router();
router.use(authMiddleware);

// List all spaces the user is a member of
router.get("/", async (req, res) => {
  const myId = (req as any).userId;
  const memberships = await prisma.spaceMember.findMany({
    where: { userId: myId },
    include: {
      space: {
        include: {
          channels: { orderBy: { name: "asc" } },
          members: { include: { user: { select: { id: true, displayName: true, avatarColor: true, isOnline: true } } } },
          owner: { select: { id: true, displayName: true } },
        },
      },
    },
  });

  const spaces = memberships.map((m) => ({
    id: m.space.id,
    name: m.space.name,
    description: m.space.description,
    emoji: m.space.emoji,
    role: m.role,
    ownerId: m.space.ownerId,
    channels: m.space.channels.map((c) => ({ id: c.id, name: c.name })),
    members: m.space.members.map((sm) => ({ ...sm.user, role: sm.role })),
  }));

  res.json({ spaces });
});

// Create a space
const createSchema = z.object({
  name: z.string().min(1).max(40),
  description: z.string().max(200).default(""),
  emoji: z.string().max(10).default("#"),
  channelName: z.string().min(1).max(40).default("general"),
});

router.post("/", async (req, res) => {
  const myId = (req as any).userId;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
    return;
  }

  const { name, description, emoji, channelName } = parsed.data;

  const space = await prisma.space.create({
    data: {
      name,
      description,
      emoji,
      ownerId: myId,
      members: { create: { userId: myId, role: "owner" } },
      channels: { create: { name: channelName } },
    },
    include: { channels: true, members: { include: { user: { select: { id: true, displayName: true, avatarColor: true, isOnline: true } } } } },
  });

  res.status(201).json({
    space: {
      id: space.id,
      name: space.name,
      description: space.description,
      emoji: space.emoji,
      role: "owner",
      ownerId: myId,
      channels: space.channels.map((c) => ({ id: c.id, name: c.name })),
      members: space.members.map((m) => ({ ...m.user, role: m.role })),
    },
  });
});

// Join a space (by searching for it - list all spaces to join)
router.get("/discover", async (req, res) => {
  const myId = (req as any).userId;
  const spaces = await prisma.space.findMany({
    where: { NOT: { members: { some: { userId: myId } } } },
    select: {
      id: true, name: true, description: true, emoji: true,
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });
  res.json({ spaces });
});

router.post("/:spaceId/join", async (req, res) => {
  const myId = (req as any).userId;
  const { spaceId } = req.params;

  const space = await prisma.space.findUnique({ where: { id: spaceId } });
  if (!space) {
    res.status(404).json({ error: "Space not found" });
    return;
  }

  const existing = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId: myId } },
  });
  if (existing) {
    res.status(409).json({ error: "Already a member" });
    return;
  }

  await prisma.spaceMember.create({ data: { spaceId, userId: myId, role: "member" } });
  res.json({ ok: true });
});

// Add a channel to a space
router.post("/:spaceId/channels", async (req, res) => {
  const myId = (req as any).userId;
  const { spaceId } = req.params;
  const { name } = req.body as { name: string };
  if (!name) {
    res.status(400).json({ error: "Channel name required" });
    return;
  }

  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId: myId } },
  });
  if (!membership) {
    res.status(403).json({ error: "Not a member of this space" });
    return;
  }

  const channel = await prisma.channel.create({ data: { name, spaceId } });
  res.status(201).json({ channel });
});

// Get messages for a channel
router.get("/:spaceId/channels/:channelId/messages", async (req, res) => {
  const myId = (req as any).userId;
  const { spaceId, channelId } = req.params;

  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId: myId } },
  });
  if (!membership) {
    res.status(403).json({ error: "Not a member of this space" });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { channelId },
    include: { sender: { select: { id: true, displayName: true, avatarColor: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  res.json({ messages });
});

// Send a message to a channel
router.post("/:spaceId/channels/:channelId/messages", async (req, res) => {
  const myId = (req as any).userId;
  const { spaceId, channelId } = req.params;
  const { content } = req.body as { content: string };
  if (!content) {
    res.status(400).json({ error: "Message content required" });
    return;
  }

  const membership = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId: myId } },
  });
  if (!membership) {
    res.status(403).json({ error: "Not a member of this space" });
    return;
  }

  const message = await prisma.message.create({
    data: { content, senderId: myId, channelId },
    include: { sender: { select: { id: true, displayName: true, avatarColor: true } } },
  });

  res.json({ message });
});

export default router;
