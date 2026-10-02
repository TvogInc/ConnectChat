import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];

  const demoUsers = [
    { email: "alice@example.com", handle: "alice", displayName: "Alice Chen", bio: "Designer & coffee enthusiast", pronouns: "she/her", status: "Designing the future ✨", color: "#ec4899" },
    { email: "bob@example.com", handle: "bob", displayName: "Bob Martinez", bio: "Full-stack dev, mountain biker", pronouns: "he/him", status: "Building cool stuff 🚀", color: "#10b981" },
    { email: "carol@example.com", handle: "carol", displayName: "Carol Johnson", bio: "Product manager, cat lover", pronouns: "she/her", status: "Shipping features 💪", color: "#f59e0b" },
    { email: "dave@example.com", handle: "dave", displayName: "Dave Kim", bio: "DevOps engineer, gamer", pronouns: "he/him", status: "On call 🔧", color: "#3b82f6" },
  ];

  for (const u of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: await bcrypt.hash("password123", 10),
        handle: u.handle,
        displayName: u.displayName,
        bio: u.bio,
        pronouns: u.pronouns,
        status: u.status,
        avatarColor: u.color,
      },
    });
  }

  // Create a demo space
  const alice = await prisma.user.findUnique({ where: { handle: "alice" } });
  const bob = await prisma.user.findUnique({ where: { handle: "bob" } });
  const carol = await prisma.user.findUnique({ where: { handle: "carol" } });

  if (alice && bob && carol) {
    const existingSpace = await prisma.space.findFirst({ where: { name: "ConnectChat Team" } });
    if (!existingSpace) {
      const space = await prisma.space.create({
        data: {
          name: "ConnectChat Team",
          description: "The main team space for ConnectChat development",
          emoji: "💬",
          ownerId: alice.id,
          members: {
            create: [
              { userId: alice.id, role: "owner" },
              { userId: bob.id, role: "member" },
              { userId: carol.id, role: "member" },
            ],
          },
          channels: {
            create: [
              { name: "general" },
              { name: "design" },
              { name: "engineering" },
            ],
          },
        },
      });

      // Seed some messages
      const generalChannel = await prisma.channel.findFirst({
        where: { spaceId: space.id, name: "general" },
      });
      if (generalChannel) {
        await prisma.message.createMany({
          data: [
            { content: "Welcome to ConnectChat everyone! 🎉", senderId: alice.id, channelId: generalChannel.id },
            { content: "This is looking great! Nice work on the UI.", senderId: bob.id, channelId: generalChannel.id },
            { content: "Excited to see this come together 💪", senderId: carol.id, channelId: generalChannel.id },
          ],
        });
      }
    }
  }

  console.log("Seed completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
