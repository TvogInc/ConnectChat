import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../lib/auth.js";
import { z } from "zod";

const router = Router();
router.use(authMiddleware);

// Get or create a direct channel with another user
router.post("/direct", async (req, res) => {
  const myId = (req as any).userId;
  const { userId } = req.body as { userId: string };
  if (!userId || userId === myId) {
    res.status(400).json({ error: "Invalid user" });
    return;
  }

  const [a, b] = [myId, userId].sort();
  let dm = await prisma.directChannel.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  });
  if (!dm) {
    dm = await prisma.directChannel.create({ data: { userAId: a, userBId: b } });
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, handle: true, displayName: true, avatarColor: true, status: true, isOnline: true },
  });

  res.json({ channel: { id: dm.id, otherUser } });
});

// Get all direct channels for the current user
router.get("/direct", async (req, res) => {
  const myId = (req as any).userId;

  const dms = await prisma.directChannel.findMany({
    where: { OR: [{ userAId: myId }, { userBId: myId }] },
    include: {
      userA: { select: { id: true, handle: true, displayName: true, avatarColor: true, status: true, isOnline: true } },
      userB: { select: { id: true, handle: true, displayName: true, avatarColor: true, status: true, isOnline: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { id: true, displayName: true } } } },
    },
  });

  const channels = dms.map((dm) => {
    const otherUser = dm.userAId === myId ? dm.userB : dm.userA;
    return {
      id: dm.id,
      otherUser,
      lastMessage: dm.messages[0] || null,
    };
  });

  // Sort by last message time, most recent first
  channels.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  res.json({ channels });
});

// Get messages for a direct channel
router.get("/direct/:channelId", async (req, res) => {
  const myId = (req as any).userId;
  const { channelId } = req.params;

  const dm = await prisma.directChannel.findUnique({
    where: { id: channelId },
  });
  if (!dm || (dm.userAId !== myId && dm.userBId !== myId)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { directChannelId: channelId },
    include: { sender: { select: { id: true, displayName: true, avatarColor: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  res.json({ messages });
});

// Send a direct message
const sendDirectSchema = z.object({
  content: z.string().min(1).max(5000),
});

router.post("/direct/:channelId", async (req, res) => {
  const myId = (req as any).userId;
  const { channelId } = req.params;
  const parsed = sendDirectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Message content required" });
    return;
  }

  const dm = await prisma.directChannel.findUnique({ where: { id: channelId } });
  if (!dm || (dm.userAId !== myId && dm.userBId !== myId)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const message = await prisma.message.create({
    data: {
      content: parsed.data.content,
      senderId: myId,
      directChannelId: channelId,
      recipientId: dm.userAId === myId ? dm.userBId : dm.userAId,
    },
    include: { sender: { select: { id: true, displayName: true, avatarColor: true } } },
  });

  res.json({ message });
});

export default router;
