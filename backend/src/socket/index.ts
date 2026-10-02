import { Server as SocketServer } from "socket.io";
import { createAdapter } from "socket.io-redis-adapter";
import { createClient } from "redis";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../lib/auth.js";
import type { Server } from "http";

export function setupSocket(httpServer: Server) {
  const io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Redis adapter for scaling
  const pubClient = createClient({ url: process.env.REDIS_URL || "redis://redis:6379" });
  const subClient = pubClient.duplicate();
  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => io.adapter(createAdapter(pubClient, subClient)))
    .catch((err) => console.error("Redis adapter error:", err));

  // Track online users
  const onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    try {
      const payload = verifyToken(token);
      (socket as any).userId = payload.userId;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = (socket as any).userId as string;
    socket.join(`user:${userId}`);

    // Track online status
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);

    // Set user as online
    await prisma.user.update({ where: { id: userId }, data: { isOnline: true } });
    io.emit("presence:update", { userId, isOnline: true });

    // Join direct channel rooms
    const dms = await prisma.directChannel.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });
    for (const dm of dms) socket.join(`dm:${dm.id}`);

    // Join space channel rooms
    const memberships = await prisma.spaceMember.findMany({
      where: { userId },
      include: { space: { include: { channels: true } } },
    });
    for (const m of memberships) {
      for (const ch of m.space.channels) {
        socket.join(`channel:${ch.id}`);
      }
    }

    // Send a direct message
    socket.on("dm:send", async (data: { channelId: string; content: string }) => {
      try {
        const dm = await prisma.directChannel.findUnique({ where: { id: data.channelId } });
        if (!dm || (dm.userAId !== userId && dm.userBId !== userId)) return;

        const message = await prisma.message.create({
          data: {
            content: data.content,
            senderId: userId,
            directChannelId: data.channelId,
            recipientId: dm.userAId === userId ? dm.userBId : dm.userAId,
          },
          include: { sender: { select: { id: true, displayName: true, avatarColor: true } } },
        });

        io.to(`dm:${data.channelId}`).emit("dm:message", { channelId: data.channelId, message });
      } catch (err) {
        console.error("dm:send error:", err);
      }
    });

    // Typing indicator for DMs
    socket.on("dm:typing", (data: { channelId: string; isTyping: boolean }) => {
      socket.to(`dm:${data.channelId}`).emit("dm:typing", {
        channelId: data.channelId,
        userId,
        isTyping: data.isTyping,
      });
    });

    // Send a channel message
    socket.on("channel:send", async (data: { channelId: string; content: string }) => {
      try {
        const message = await prisma.message.create({
          data: { content: data.content, senderId: userId, channelId: data.channelId },
          include: { sender: { select: { id: true, displayName: true, avatarColor: true } } },
        });
        io.to(`channel:${data.channelId}`).emit("channel:message", { channelId: data.channelId, message });
      } catch (err) {
        console.error("channel:send error:", err);
      }
    });

    // Typing indicator for channels
    socket.on("channel:typing", (data: { channelId: string; isTyping: boolean }) => {
      socket.to(`channel:${data.channelId}`).emit("channel:typing", {
        channelId: data.channelId,
        userId,
        isTyping: data.isTyping,
      });
    });

    // Disconnect
    socket.on("disconnect", async () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          await prisma.user.update({ where: { id: userId }, data: { isOnline: false } });
          io.emit("presence:update", { userId, isOnline: false });
        }
      }
    });
  });

  return io;
}
